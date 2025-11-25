import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTranslation } from '../utils/localization';
import RoutingService, { AQIAwareRoute, RouteRequest, LatLng } from '../services/routingService';

interface MapScreenProps {
  navigation: any;
}

const { width, height } = Dimensions.get('window');

// Get configuration from Expo extra (bundled at build time)
const extra = (Constants?.expoConfig?.extra || {}) as Record<string, any>;
// In Expo Go on iOS, Google provider requires a dev build (native modules). Default to Apple on iOS for Expo Go.
const isExpoGo = Constants.appOwnership === 'expo';
const wantsGoogle = String(extra.EXPO_PUBLIC_MAP_PROVIDER || '').toLowerCase() === 'google';
const MAP_PROVIDER = Platform.OS === 'android'
  ? PROVIDER_GOOGLE
  // On iOS: use Google only if not Expo Go (i.e., dev build or standalone). Otherwise fall back to Apple.
  : (!isExpoGo && wantsGoogle ? PROVIDER_GOOGLE : undefined);
const DEFAULT_LAT = parseFloat(extra.EXPO_PUBLIC_DEFAULT_LAT || '6.9271');
const DEFAULT_LNG = parseFloat(extra.EXPO_PUBLIC_DEFAULT_LNG || '79.8612');

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const mapRef = useRef<MapView | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [destinationInput, setDestinationInput] = useState('');
  const [routes, setRoutes] = useState<AQIAwareRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<AQIAwareRoute | null>(null);
  const [routePreference, setRoutePreference] = useState<'fastest' | 'safest' | 'balanced'>('balanced');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const hasCenteredRef = useRef(false);
  // Follow user like Google Maps: when true, map keeps centering on user until user drags map
  const [isFollowing, setIsFollowing] = useState<boolean>(true);

  const routingService = RoutingService.getInstance();

  useEffect(() => {
    // Immediately get current location and center map on it
    getCurrentLocation();
    loadUserProfile();

    // Start watching for location updates to keep user location fresh
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const sub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000, // Update every 10 seconds
              distanceInterval: 50, // Update when moved 50 meters
            },
            (loc) => {
              if (!isMounted) return;
              setLocation(loc);
              // Auto-center on location updates if following is active and we haven't initially centered
              if (isFollowing && !hasCenteredRef.current) {
                centerOnCoords(loc.coords.latitude, loc.coords.longitude, false);
              }
            }
          );
          if (isMounted) setLocationSubscription(sub);
        }
      } catch (e) {
        console.warn('watchPositionAsync failed:', e);
      }
    })();

    return () => {
      isMounted = false;
      try {
        locationSubscription?.remove();
      } catch {}
    };
  }, []);

  // Ensure we center as soon as we have a location (covering cases where map may show SF by default)
  useEffect(() => {
    if (location && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
      centerOnCoords(location.coords.latitude, location.coords.longitude, true);
    }
  }, [location]);

  const loadUserProfile = async () => {
    try {
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) {
        setUserProfile(JSON.parse(profile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied, using Colombo as fallback');
        // Use Colombo coordinates as fallback
        centerOnCoords(DEFAULT_LAT, DEFAULT_LNG, true);
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
      // Immediately center on user's current location
      centerOnCoords(currentLocation.coords.latitude, currentLocation.coords.longitude, true);
      console.log('Centered map on current location:', currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      // Use Colombo coordinates as fallback when location fails
      console.log('Location failed, using Colombo as fallback');
      centerOnCoords(DEFAULT_LAT, DEFAULT_LNG, true);
    } finally {
      setLoading(false);
    }
  };

  const centerOnCoords = (lat: number, lng: number, immediate = false) => {
    const region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
    setMapRegion(region);
    if (mapRef.current) {
      if (immediate) {
        mapRef.current.animateToRegion(region, 0);
      } else {
        mapRef.current.animateToRegion(region, 800);
      }
    }
  };

  const centerOnUser = async () => {
    // Enable follow mode explicitly on press
    setIsFollowing(true);
    if (location && mapRef.current) {
      // Use existing location if available
      centerOnCoords(location.coords.latitude, location.coords.longitude);
      return;
    }
    
    // Try to get fresh location if not available
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
        centerOnCoords(currentLocation.coords.latitude, currentLocation.coords.longitude);
      } else {
        // Fallback to Colombo if no permission
        centerOnCoords(DEFAULT_LAT, DEFAULT_LNG);
        Alert.alert('Location Access', 'Location permission is required. Showing Colombo instead.');
      }
    } catch (error) {
      // Fallback to Colombo if location fails
      centerOnCoords(DEFAULT_LAT, DEFAULT_LNG);
      Alert.alert('Location Error', 'Unable to get current location. Showing Colombo instead.');
    }
  };

  // Handle Google-style follow toggle UX
  const handleRecenterPress = () => {
    // Tapping toggles follow ON and recenters
    setIsFollowing(true);
    centerOnUser();
  };

  const searchForRoutes = async () => {
    if (!location || !destination) {
      Alert.alert('Error', 'Please set a destination first');
      return;
    }

    setRoutesLoading(true);
    try {
      const routeRequest: RouteRequest = {
        origin: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        destination,
        userHealthProfile: userProfile,
        routePreference,
        avoidHighAQI: userProfile?.healthConditions?.length > 0,
        maxAQIThreshold: userProfile?.healthConditions?.length > 0 ? 100 : 150
      };

      const aqiRoutes = await routingService.getAQIAwareRoutes(routeRequest);
      setRoutes(aqiRoutes);
      
      if (aqiRoutes.length > 0) {
        setSelectedRoute(aqiRoutes[0]); // Select the best route by default
      }
    } catch (error) {
      console.error('Error getting routes:', error);
      Alert.alert('Error', 'Unable to find routes. Please try again.');
    } finally {
      setRoutesLoading(false);
    }
  };

  const setDestinationFromInput = () => {
    // Simple geocoding simulation - in production, use Google Geocoding API
    const coords = destinationInput.split(',').map(s => parseFloat(s.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      setDestination({ latitude: coords[0], longitude: coords[1] });
      searchForRoutes();
    } else {
      Alert.alert('Error', 'Please enter coordinates in format: latitude, longitude');
    }
  };

  const onMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setDestination({ latitude, longitude });
    setDestinationInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
  };

  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return '#4ECDC4'; // Good - Teal
    if (aqi <= 100) return '#45B7D1'; // Moderate - Blue
    if (aqi <= 150) return '#FFA726'; // Unhealthy for Sensitive - Orange
    if (aqi <= 200) return '#FF6B6B'; // Unhealthy - Red
    if (aqi <= 300) return '#9C27B0'; // Very Unhealthy - Purple
    return '#795548'; // Hazardous - Brown
  };

  const getHealthRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return '#4ECDC4';
      case 'moderate': return '#FFA726';
      case 'high': return '#FF6B6B';
      case 'very-high': return '#9C27B0';
      default: return '#666';
    }
  };

  const getRouteColor = (aqi: number) => {
    if (aqi <= 50) return '#4ECDC4';
    if (aqi <= 100) return '#45B7D1';
    if (aqi <= 150) return '#FFA726';
    return '#FF6B6B';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Controls */}
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.destinationInput}
            placeholder="Enter destination (lat, lng) or tap map"
            value={destinationInput}
            onChangeText={setDestinationInput}
            onSubmitEditing={setDestinationFromInput}
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={setDestinationFromInput}
            disabled={!destinationInput}
          >
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.preferenceContainer}>
          <Text style={styles.preferenceLabel}>Route Preference:</Text>
          <View style={styles.preferenceButtons}>
            {(['fastest', 'safest', 'balanced'] as const).map((pref) => (
              <TouchableOpacity
                key={pref}
                style={[
                  styles.preferenceButton,
                  routePreference === pref && styles.preferenceButtonActive
                ]}
                onPress={() => setRoutePreference(pref)}
              >
                <Text style={[
                  styles.preferenceButtonText,
                  routePreference === pref && styles.preferenceButtonTextActive
                ]}>
                  {pref.charAt(0).toUpperCase() + pref.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <MapView
        style={styles.map}
        provider={MAP_PROVIDER}
        ref={mapRef}
        initialRegion={mapRegion}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        // Exit follow mode when user drags the map manually
        onPanDrag={() => setIsFollowing(false)}
        onPress={onMapPress}
        showsUserLocation={true}
        followsUserLocation={isFollowing}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={false}
        mapType="standard"
        onUserLocationChange={(e) => {
          const c = e.nativeEvent.coordinate;
          if (!c) return;
          // First reliable coordinate from the map: center immediately on iOS for best UX
          if (!hasCenteredRef.current) {
            hasCenteredRef.current = true;
            centerOnCoords(c.latitude, c.longitude, true);
          }
          // If following is enabled, keep centering smoothly on updates
          if (isFollowing) {
            centerOnCoords(c.latitude, c.longitude, false);
          }
        }}
      >
        {/* User's current location */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            description="You are here"
          >
            <View style={styles.userMarker}>
              <Ionicons name="person" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            description="Your destination"
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="flag" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* AQI-aware routes */}
        {routes.map((route) => (
          <React.Fragment key={route.id}>
            <Polyline
              coordinates={route.waypoints}
              strokeColor={route.color}
              strokeWidth={selectedRoute?.id === route.id ? 6 : 4}
              lineDashPattern={selectedRoute?.id === route.id ? [] : [5, 5]}
            />
            
            {/* AQI markers along the route */}
            {route.waypoints.slice(0, -1).map((waypoint, index) => (
              waypoint.aqi && (
                <Marker
                  key={`${route.id}-aqi-${index}`}
                  coordinate={waypoint}
                  title={`AQI: ${waypoint.aqi}`}
                  description={waypoint.airQualityStatus}
                >
                  <View style={[
                    styles.aqiMarker, 
                    { backgroundColor: getAQIColor(waypoint.aqi) }
                  ]}>
                    <Text style={styles.aqiMarkerText}>{waypoint.aqi}</Text>
                  </View>
                </Marker>
              )
            ))}
          </React.Fragment>
        ))}
      </MapView>

      {/* Route Information Panel */}
      {routes.length > 0 && (
        <ScrollView style={styles.routePanel}>
          <View style={styles.routePanelHeader}>
            <Text style={styles.panelTitle}>
              {routesLoading ? 'Finding Routes...' : 'AQI-Aware Routes'}
            </Text>
            {routesLoading && <ActivityIndicator size="small" color="#007AFF" />}
          </View>
          
          {routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={[
                styles.routeItem,
                selectedRoute?.id === route.id && styles.routeItemSelected
              ]}
              onPress={() => setSelectedRoute(route)}
            >
              <View style={[styles.routeIndicator, { backgroundColor: route.color }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{route.name}</Text>
                <Text style={styles.routeDetails}>
                  Avg AQI: {Math.round(route.averageAQI)} • {Math.round(route.distance/1000 * 10)/10}km • {Math.round(route.duration/60)}min
                </Text>
                <Text style={[styles.healthRisk, { color: getHealthRiskColor(route.healthRisk) }]}>
                  {route.healthRisk.toUpperCase()} RISK
                </Text>
                {route.warnings.length > 0 && (
                  <Text style={styles.warnings} numberOfLines={2}>
                    {route.warnings[0]}
                  </Text>
                )}
              </View>
              <View style={styles.routeStats}>
                <Text style={styles.routeStatLabel}>Max AQI</Text>
                <Text style={[styles.routeStatValue, { color: getAQIColor(route.maxAQI) }]}>
                  {route.maxAQI}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {selectedRoute && (
            <View style={styles.selectedRouteDetails}>
              <Text style={styles.selectedRouteTitle}>Route Details</Text>
              <Text style={styles.selectedRouteDescription}>
                Recommended for: {selectedRoute.recommendedFor.join(', ')}
              </Text>
              {selectedRoute.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  • {warning}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Air Quality</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.legendText}>Good (0-50)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#45B7D1' }]} />
            <Text style={styles.legendText}>Moderate (51-100)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFA726' }]} />
            <Text style={styles.legendText}>Unhealthy (101-150)</Text>
          </View>
        </View>
      </View>

      {/* Recenter (My Location) Button */}
      <TouchableOpacity
        style={[
          styles.recenterButton,
          isFollowing ? styles.recenterButtonActive : null,
        ]}
        onPress={handleRecenterPress}
        accessibilityRole="button"
        accessibilityLabel="Center on my location"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.8}
      >
        <Ionicons name={isFollowing ? 'locate' : 'locate-outline'} size={22} color={isFollowing ? '#007AFF' : '#606060'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#333',
  },
  searchButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  preferenceContainer: {
    marginTop: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  preferenceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  preferenceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  preferenceButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  preferenceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  preferenceButtonTextActive: {
    color: 'white',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  destinationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  aqiMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  aqiMarkerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  routeMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  routePanel: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    maxHeight: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  routePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  routeItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  routeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  healthRisk: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  warnings: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  routeStats: {
    alignItems: 'center',
    marginLeft: 8,
  },
  routeStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  routeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  selectedRouteDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  selectedRouteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  selectedRouteDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginVertical: 2,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    top: 250,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 12,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  legendItems: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recenterButtonActive: {
    borderColor: '#007AFF',
    shadowOpacity: 0.25,
  },
});
