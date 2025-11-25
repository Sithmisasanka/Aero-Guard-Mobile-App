import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, Region, LatLng, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import RouteCalculationService, { RouteWithAQI } from '../services/routeCalculationService';
import AQIHeatmapService, { AQIHeatmapPoint } from '../services/aqiHeatmapService';

const { width, height } = Dimensions.get('window');

interface RouteDetails {
  distance: string;
  estimatedTime: string;
  exposureScore: number;
  pollutionLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  aqiAlongRoute: number[];
  steps: string[];
}

const RouteMapScreen: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<LatLng | null>(null);
  const [routes, setRoutes] = useState<RouteWithAQI[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithAQI | null>(null);
  const [isDriving, setIsDriving] = useState(false);
  const [driveIndex, setDriveIndex] = useState(0);
  const drivingIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const [driverPosition, setDriverPosition] = useState<LatLng | null>(null);
  const [isSelecting, setIsSelecting] = useState<'start' | 'end' | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState<AQIHeatmapPoint[]>([]);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (showHeatmap && currentLocation) {
      loadHeatmapData();
    }
  }, [showHeatmap, currentLocation, selectedTime]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location permission is required to show your position and provide route recommendations.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Could not get your current location');
      // Set default location (San Francisco) as fallback
      setCurrentLocation({
        latitude: 37.7749,
        longitude: -122.4194,
      });
    }
  };

  const loadHeatmapData = async () => {
    if (!currentLocation) return;

    setIsLoadingHeatmap(true);
    try {
      const bounds = {
        northeast: {
          latitude: currentLocation.latitude + 0.01,
          longitude: currentLocation.longitude + 0.01,
        },
        southwest: {
          latitude: currentLocation.latitude - 0.01,
          longitude: currentLocation.longitude - 0.01,
        },
      };

      const timeFilter = {
        hour: selectedTime.getHours(),
        day: selectedTime.getDay(),
        month: selectedTime.getMonth() + 1,
      };

      const heatmap = await AQIHeatmapService.generateHeatmapData(
        bounds,
        15, // Grid size
        timeFilter
      );

      setHeatmapData(heatmap);
    } catch (error) {
      console.error('Error loading heatmap:', error);
      Alert.alert('Heatmap Error', 'Could not load pollution heatmap');
    } finally {
      setIsLoadingHeatmap(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    
    if (isSelecting === 'start') {
      setStartPoint(coordinate);
      setIsSelecting(null);
    } else if (isSelecting === 'end') {
      setEndPoint(coordinate);
      setIsSelecting(null);
    }
  };

  const calculateRoutes = async () => {
    if (!startPoint || !endPoint) {
      Alert.alert('Missing Points', 'Please select both start and end points');
      return;
    }

    setIsCalculating(true);
    try {
      // Calculate routes using the service
      const calculatedRoutes = await RouteCalculationService.calculateRoutes(
        startPoint,
        endPoint,
        true // Get alternatives
      );

      // Process routes with AQI data
      const routesWithAQI = await RouteCalculationService.processRoutesWithAQI(calculatedRoutes);
      
      setRoutes(routesWithAQI);
      setSelectedRoute(routesWithAQI[0]); // Select safest route by default
    } catch (error) {
      console.error('Error calculating routes:', error);
      Alert.alert('Route Error', 'Could not calculate routes. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const selectRoute = (route: RouteWithAQI) => {
    setSelectedRoute(route);
    setRouteDetails({
      distance: RouteCalculationService.formatDistance(route.totalDistance),
      estimatedTime: RouteCalculationService.formatDuration(route.totalDuration),
      exposureScore: route.exposureScore,
      pollutionLevel: route.pollutionLevel,
      aqiAlongRoute: route.aqiAlongRoute,
      steps: route.segments[0]?.steps || [],
    });
    setShowRouteDetails(true);
    // Fit map to route bounds
    if (mapRef.current && route.bounds) {
      try {
        mapRef.current.fitToCoordinates(route.polylineCoordinates, {
          edgePadding: { top: 80, right: 40, bottom: 200, left: 40 },
          animated: true,
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const clearRoutes = () => {
    setRoutes([]);
    setSelectedRoute(null);
    setStartPoint(null);
    setEndPoint(null);
    setRouteDetails(null);
    setShowRouteDetails(false);
  };

  const getRouteColor = (route: RouteWithAQI) => {
    if (route.isSafest) return '#4CAF50'; // Green for safest
    if (route.exposureScore < 50) return '#FF9800'; // Orange for moderate
    return '#F44336'; // Red for high exposure
  };

  const getExposureColor = (score: number) => {
    if (score < 30) return '#4CAF50';
    if (score < 50) return '#FF9800';
    if (score < 70) return '#FF5722';
    return '#F44336';
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || 37.78825,
          longitude: currentLocation?.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
            pinColor="blue"
          />
        )}

        {/* Start Point Marker */}
        {startPoint && (
          <Marker
            coordinate={startPoint}
            title="Start Point"
            pinColor="green"
          >
            <View style={styles.customMarker}>
              <Ionicons name="play" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* End Point Marker */}
        {endPoint && (
          <Marker
            coordinate={endPoint}
            title="End Point"
            pinColor="red"
          >
            <View style={[styles.customMarker, { backgroundColor: '#F44336' }]}>
              <Ionicons name="flag" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Route Lines */}
        {routes.map((route) => (
          <Polyline
            key={route.id}
            coordinates={route.polylineCoordinates}
            strokeColor={getRouteColor(route)}
            strokeWidth={selectedRoute?.id === route.id ? 6 : 4}
            onPress={() => selectRoute(route)}
          />
        ))}

          {/* Highlight selected route with stronger style */}
          {selectedRoute && (
            <Polyline
              key={`selected_${selectedRoute.id}`}
              coordinates={selectedRoute.polylineCoordinates}
              strokeColor={'#1976D2'}
              strokeWidth={8}
              lineDashPattern={[]}
            />
          )}

          {/* Driver marker when simulating drive */}
          {isDriving && driverPosition && (
            <Marker
              coordinate={driverPosition}
              title="You"
              pinColor="#1976D2"
            />
          )}

        {/* Heatmap Overlay */}
        {showHeatmap && heatmapData.map((point, index) => (
          <Circle
            key={`heatmap_${index}`}
            center={point.coordinate}
            radius={50}
            fillColor={AQIHeatmapService.getAQIColor(point.aqi)}
            strokeColor="transparent"
          />
        ))}
      </MapView>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
          style={styles.controlContent}
        >
          <Text style={styles.title}>Safe Route Planner</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, isSelecting === 'start' && styles.activeButton]}
              onPress={() => setIsSelecting('start')}
            >
              <Ionicons name="play" size={16} color={isSelecting === 'start' ? 'white' : '#4CAF50'} />
              <Text style={[styles.buttonText, isSelecting === 'start' && styles.activeButtonText]}>
                Set Start
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isSelecting === 'end' && styles.activeButton]}
              onPress={() => setIsSelecting('end')}
            >
              <Ionicons name="flag" size={16} color={isSelecting === 'end' ? 'white' : '#F44336'} />
              <Text style={[styles.buttonText, isSelecting === 'end' && styles.activeButtonText]}>
                Set End
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={calculateRoutes}
              disabled={!startPoint || !endPoint || isCalculating}
            >
              {isCalculating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="navigate" size={16} color="white" />
              )}
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {isCalculating ? 'Calculating...' : 'Find Routes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, showHeatmap && styles.activeButton]}
              onPress={() => setShowHeatmap(!showHeatmap)}
              disabled={isLoadingHeatmap}
            >
              {isLoadingHeatmap ? (
                <ActivityIndicator size="small" color={showHeatmap ? 'white' : '#FF9800'} />
              ) : (
                <Ionicons name="thermometer" size={16} color={showHeatmap ? 'white' : '#FF9800'} />
              )}
              <Text style={[styles.buttonText, showHeatmap && styles.activeButtonText]}>
                {isLoadingHeatmap ? 'Loading...' : 'Heatmap'}
              </Text>
            </TouchableOpacity>
          </View>

          {routes.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearRoutes}
            >
              <Ionicons name="trash" size={16} color="white" />
              <Text style={[styles.buttonText, styles.clearButtonText]}>
                Clear Routes
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      {/* Route List */}
      {routes.length > 0 && (
        <View style={styles.routeList}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
            style={styles.routeListContent}
          >
            <Text style={styles.routeListTitle}>Available Routes</Text>
            {routes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeItem,
                  selectedRoute?.id === route.id && styles.selectedRouteItem,
                ]}
                onPress={() => selectRoute(route)}
              >
                <View style={styles.routeInfo}>
                  <Text style={styles.routeDistance}>
                    {RouteCalculationService.formatDistance(route.totalDistance)}
                  </Text>
                  <Text style={styles.routeDuration}>
                    {RouteCalculationService.formatDuration(route.totalDuration)}
                  </Text>
                </View>
                <View style={styles.exposureInfo}>
                  <View
                    style={[
                      styles.exposureBadge,
                      { backgroundColor: getExposureColor(route.exposureScore) },
                    ]}
                  >
                    <Text style={styles.exposureScore}>{route.exposureScore}</Text>
                  </View>
                  {route.isSafest && (
                    <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </LinearGradient>
        </View>
      )}

      {/* Floating info panel for selected route */}
      {selectedRoute && (
        <View style={{ position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, minWidth: 220, elevation: 3 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1976D2', marginBottom: 4 }}>Route Summary</Text>
            <Text style={{ fontSize: 14 }}>Distance: {RouteCalculationService.formatDistance(selectedRoute.totalDistance)}</Text>
            <Text style={{ fontSize: 14 }}>Duration: {RouteCalculationService.formatDuration(selectedRoute.totalDuration)}</Text>
          </View>
        </View>
      )}

      {/* Route Details Modal */}
      <Modal
        visible={showRouteDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRouteDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Route Details</Text>
              <TouchableOpacity onPress={() => setShowRouteDetails(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>

            {routeDetails && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={20} color="#666" />
                  <Text style={styles.detailLabel}>Distance:</Text>
                  <Text style={styles.detailValue}>{routeDetails.distance}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time" size={20} color="#666" />
                  <Text style={styles.detailLabel}>Estimated Time:</Text>
                  <Text style={styles.detailValue}>{routeDetails.estimatedTime}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="thermometer" size={20} color="#666" />
                  <Text style={styles.detailLabel}>Pollution Level:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: getExposureColor(routeDetails.exposureScore) },
                    ]}
                  >
                    {routeDetails.pollutionLevel}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="analytics" size={20} color="#666" />
                  <Text style={styles.detailLabel}>Exposure Score:</Text>
                  <View
                    style={[
                      styles.exposureBadge,
                      { backgroundColor: getExposureColor(routeDetails.exposureScore) },
                    ]}
                  >
                    <Text style={styles.exposureScore}>{routeDetails.exposureScore}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="pulse" size={20} color="#666" />
                  <Text style={styles.detailLabel}>AQI Range:</Text>
                  <Text style={styles.detailValue}>
                    {Math.min(...routeDetails.aqiAlongRoute)} - {Math.max(...routeDetails.aqiAlongRoute)}
                  </Text>
                </View>

                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Pollution Along Route</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chart}>
                      {routeDetails.aqiAlongRoute.map((aqi, index) => (
                        <View key={index} style={styles.chartBar}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: (aqi / 150) * 80,
                                backgroundColor: getExposureColor(aqi),
                              },
                            ]}
                          />
                          <Text style={styles.barLabel}>{aqi}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Step-by-step instructions */}
                {routeDetails.steps && routeDetails.steps.length > 0 && (
                  <View style={{ marginTop: 18 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 8, color: '#1976D2' }}>Turn-by-Turn Directions</Text>
                    <ScrollView style={{ maxHeight: 120 }}>
                      {routeDetails.steps.map((step: string, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name="arrow-forward" size={16} color="#1976D2" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 13, color: '#333' }}>{step}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={{ marginTop: 15 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: isDriving ? '#F44336' : '#1976D2' }]}
                    onPress={() => {
                      if (isDriving) {
                        // Stop driving
                        setIsDriving(false);
                        if (drivingIntervalRef.current) {
                          clearInterval(drivingIntervalRef.current as any);
                          drivingIntervalRef.current = null;
                        }
                        setDriveIndex(0);
                        setDriverPosition(null);
                      } else if (selectedRoute) {
                        // Start simulated drive along selected route
                        setIsDriving(true);
                        const coords = selectedRoute.polylineCoordinates;
                        setDriveIndex(0);
                        setDriverPosition(coords[0]);
                        drivingIntervalRef.current = setInterval(() => {
                          setDriveIndex((prev) => {
                            const next = prev + 1;
                            if (next >= coords.length) {
                              // reached end
                              if (drivingIntervalRef.current) {
                                clearInterval(drivingIntervalRef.current as any);
                                drivingIntervalRef.current = null;
                              }
                              setIsDriving(false);
                              return prev;
                            }
                            const nextPos = coords[next];
                            setDriverPosition(nextPos);
                            // center map on driver
                            if (mapRef.current) {
                              mapRef.current.animateToRegion({
                                latitude: nextPos.latitude,
                                longitude: nextPos.longitude,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                              }, 300);
                            }
                            return next;
                          });
                        }, 800);
                      }
                    }}
                  >
                    <Ionicons name={isDriving ? 'stop' : 'car'} size={16} color="white" />
                    <Text style={[styles.buttonText, { color: 'white', marginLeft: 8 }]}> 
                      {isDriving ? 'Stop Driving' : 'Start Driving'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  controlPanel: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlContent: {
    padding: 15,
    borderRadius: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 0.48,
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  buttonText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  activeButtonText: {
    color: 'white',
  },
  primaryButtonText: {
    color: 'white',
  },
  clearButtonText: {
    color: 'white',
  },
  routeList: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  routeListContent: {
    padding: 15,
    borderRadius: 15,
  },
  routeListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedRouteItem: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  routeInfo: {
    flex: 1,
  },
  routeDistance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  routeDuration: {
    fontSize: 12,
    color: '#666',
  },
  exposureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exposureBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  exposureScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: width * 0.9,
    maxHeight: height * 0.7,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 10,
  },
  chartBar: {
    alignItems: 'center',
    marginHorizontal: 2,
    minWidth: 25,
  },
  bar: {
    width: 20,
    marginBottom: 5,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export default RouteMapScreen;