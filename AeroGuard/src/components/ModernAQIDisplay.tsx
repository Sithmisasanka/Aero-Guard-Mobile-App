import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { AQIData } from '../types';
import { AQIService } from '../services/aqiService';
import { useRealtimeAQI } from '../services/realtimeAQIService';
import { SymptomsDisplay } from './SymptomsDisplay';

interface ModernAQIDisplayProps {
  language?: 'en' | 'si' | 'ta';
  hasHealthConditions?: boolean;
  healthConditions?: any[];
}

const { width, height } = Dimensions.get('window');

export const ModernAQIDisplay: React.FC<ModernAQIDisplayProps> = ({
  language = 'en',
  hasHealthConditions = false,
  healthConditions = [],
}) => {
  const [latitude, setLatitude] = useState(parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LAT || '6.9271'));
  const [longitude, setLongitude] = useState(parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LNG || '79.8612'));
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Use realtime AQI service with rate-limited configuration
  const { data: aqiData, error, isConnected, refresh, getStatus } = useRealtimeAQI(
    latitude,
    longitude,
    {
      pollInterval: parseInt(process.env.EXPO_PUBLIC_AQI_POLL_INTERVAL || '300000'), // 5 minutes default
      maxRetries: 3,
      retryDelay: 30000 // 30 seconds between retries
    }
  );

  const status = getStatus();
  const loading = !aqiData && !error;
  const lastUpdated = status.lastUpdate;

  // Get user location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        setLocationStatus('loading');
        setLocationError(null);

        // Check if location services are available
        const isLocationAvailable = await Location.hasServicesEnabledAsync();
        if (!isLocationAvailable) {
          setLocationStatus('unavailable');
          setLocationError('Location services are disabled on this device');
          setIsUsingMockData(true);
          console.log('Location services not available, using default location');
          return;
        }

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          setLocationStatus('granted');
          console.log('Location permission granted');

          // Get current position
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          setLatitude(location.coords.latitude);
          setLongitude(location.coords.longitude);
          setIsUsingMockData(false);

          console.log('Location obtained:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy
          });

        } else if (status === 'denied') {
          setLocationStatus('denied');
          setLocationError('Location permission denied. Using default location.');
          setIsUsingMockData(true);
          console.log('Location permission denied, using default location');
        }

      } catch (locationError: any) {
        console.error('Location error:', locationError);
        setLocationStatus('unavailable');
        setLocationError(`Unable to get location: ${locationError.message || 'Unknown error'}`);
        setIsUsingMockData(true);

        // Show user-friendly error message
        if (locationError.code === 'E_LOCATION_TIMEOUT') {
          setLocationError('Location request timed out. Using default location.');
        } else if (locationError.code === 'E_NO_LOCATION_PERMISSION') {
          setLocationError('Location permission required. Using default location.');
        }
      }
    };

    // Only get location if not using mock data
    if (process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'true') {
      getLocation();
    } else {
      setLocationStatus('granted');
      setIsUsingMockData(true);
      console.log('Using mock data mode - skipping location request');
    }
  }, []);

  const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return '#4CAF50'; // Green - Good
  if (aqi <= 100) return '#FFD600'; // Darker Yellow - Moderate
  if (aqi <= 150) return '#FF9800'; // Orange - Unhealthy for Sensitive
  if (aqi <= 200) return '#F44336'; // Red - Unhealthy
  if (aqi <= 300) return '#9C27B0'; // Purple - Very Unhealthy
  return '#8D4E85'; // Maroon - Hazardous
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getHealthMessage = (aqi: number) => {
    if (aqi <= 50) return 'Air quality is satisfactory for most people';
    if (aqi <= 100) return 'Moderate air quality. Sensitive individuals should limit outdoor exposure';
    if (aqi <= 150) return 'Unhealthy for sensitive groups. Consider reducing outdoor activities';
    if (aqi <= 200) return 'Unhealthy air quality. Everyone should limit outdoor exposure';
    if (aqi <= 300) return 'Very unhealthy. Avoid outdoor activities';
    return 'Hazardous air quality. Emergency conditions for all';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading air quality data...</Text>
        {locationStatus === 'loading' && (
          <Text style={styles.locationStatusText}>Getting your location...</Text>
        )}
        {locationStatus === 'denied' && (
          <View style={styles.locationPermissionContainer}>
            <Text style={styles.locationStatusText}>
              Location permission is required for accurate AQI data
            </Text>
            <TouchableOpacity
              style={styles.grantPermissionButton}
              onPress={async () => {
                try {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Balanced,
                    });
                    setLatitude(location.coords.latitude);
                    setLongitude(location.coords.longitude);
                    setLocationStatus('granted');
                    setLocationError(null);
                    setIsUsingMockData(false);
                  }
                } catch (error) {
                  console.error('Permission request failed:', error);
                }
              }}
            >
              <Text style={styles.grantPermissionText}>Grant Location Permission</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (!aqiData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>
          {error ? 'Unable to load air quality data' : 'No air quality data available'}
        </Text>
        {error && (
          <Text style={styles.errorDetails}>
            {error.message || 'Please check your internet connection and try again.'}
          </Text>
        )}
        {isUsingMockData && (
          <Text style={styles.mockDataNotice}>
            Currently showing sample data. Enable location services for real-time local data.
          </Text>
        )}
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const aqiColor = getAQIColor(aqiData.aqi);
  const aqiStatus = getAQIStatus(aqiData.aqi);
  const healthMessage = getHealthMessage(aqiData.aqi);

  return (
    <LinearGradient
      colors={['rgba(138, 173, 244, 0.12)', 'rgba(174, 139, 248, 0.08)', 'rgba(255, 182, 193, 0.05)']}
      style={styles.container}
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={[aqiColor + '20', aqiColor + '08']}
          style={styles.heroSection}
        >
        <View style={styles.locationHeader}>
          <Ionicons name="location" size={16} color="#666" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              {aqiData.city}, {aqiData.country}
              {isUsingMockData && <Text style={styles.mockDataIndicator}> (Default)</Text>}
            </Text>
            {locationError && (
              <Text style={styles.locationWarning}>
                <Ionicons name="warning" size={12} color="#FF9800" />
                {' '}{locationError}
              </Text>
            )}
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#FF9800' }]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Live' : status.connectionState === 'connecting' ? 'Connecting...' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Location/Data Warning Banner */}
        {(isUsingMockData || locationError) && (
          <View style={styles.warningBanner}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                {isUsingMockData ? 'Using Default Location Data' : 'Location Warning'}
              </Text>
              <Text style={styles.warningMessage}>
                {isUsingMockData
                  ? 'Unable to access your location. Showing air quality data for Colombo, Sri Lanka.'
                  : locationError
                }
              </Text>
              {!isUsingMockData && (
                <TouchableOpacity
                  style={styles.retryLocationButton}
                  onPress={() => {
                    // Retry location request
                    const retryLocation = async () => {
                      try {
                        const { status } = await Location.requestForegroundPermissionsAsync();
                        if (status === 'granted') {
                          const location = await Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.Balanced,
                          });
                          setLatitude(location.coords.latitude);
                          setLongitude(location.coords.longitude);
                          setLocationStatus('granted');
                          setLocationError(null);
                          setIsUsingMockData(false);
                        }
                      } catch (error) {
                        console.error('Retry location failed:', error);
                      }
                    };
                    retryLocation();
                  }}
                >
                  <Text style={styles.retryLocationText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Main AQI Display */}
        <View style={styles.aqiMainDisplay}>
          <View style={[styles.aqiCircle, { borderColor: aqiColor, shadowColor: aqiColor }]}>
            <Text style={[styles.aqiValue, { color: aqiColor }]}>{aqiData.aqi}</Text>
            <Text style={styles.aqiLabel}>AQI</Text>
          </View>
          
          <View style={styles.aqiStatusContainer}>
            <Text style={[styles.aqiStatus, { color: aqiColor }]}>{aqiStatus}</Text>
            <Text style={styles.healthMessage}>{healthMessage}</Text>
            
            {lastUpdated && (
              <View style={styles.lastUpdatedContainer}>
                <Ionicons name="time" size={14} color="#999" />
                <Text style={styles.lastUpdatedText}>
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Health Recommendations Card */}
      <View style={styles.recommendationCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="medical" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>Health Recommendations</Text>
        </View>
        
        <View style={styles.recommendationContent}>
          {hasHealthConditions && (
            <View style={styles.sensitiveGroupAlert}>
              <Ionicons name="alert-circle" size={20} color="#FF9800" />
              <Text style={styles.sensitiveGroupText}>
                Extra precaution advised for sensitive individuals
              </Text>
            </View>
          )}
          
          <Text style={styles.recommendationText}>
            {AQIService.getPersonalizedRecommendation(aqiData.aqi, hasHealthConditions, healthConditions)}
          </Text>
        </View>
      </View>

      {/* Symptoms Display */}
      {hasHealthConditions && healthConditions.length > 0 && (
        <SymptomsDisplay
          currentAQI={aqiData.aqi}
          healthConditions={healthConditions}
        />
      )}

      {/* Pollutants Breakdown */}
      <View style={styles.pollutantsCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="analytics" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>Pollutant Levels</Text>
        </View>
        <Text style={styles.locationSubtext}>
          {aqiData.city}{aqiData.country ? `, ${aqiData.country}` : ''}
        </Text>

        <View style={styles.pollutantsGrid}>
          {[
            { name: 'PM2.5', value: aqiData.pollutants.pm25, unit: 'μg/m³', icon: 'ellipse' },
            { name: 'PM10', value: aqiData.pollutants.pm10, unit: 'μg/m³', icon: 'ellipse-outline' },
            { name: 'O₃', value: aqiData.pollutants.o3, unit: 'μg/m³', icon: 'cloud' },
            { name: 'NO₂', value: aqiData.pollutants.no2, unit: 'μg/m³', icon: 'cloud-outline' },
            { name: 'SO₂', value: aqiData.pollutants.so2, unit: 'μg/m³', icon: 'cloudy' },
            { name: 'CO', value: aqiData.pollutants.co, unit: 'mg/m³', icon: 'cloudy-outline' },
          ].map((pollutant, index) => (
            <View key={index} style={styles.pollutantItem}>
              <Ionicons name={pollutant.icon as any} size={20} color="#666" />
              <Text style={styles.pollutantName}>{pollutant.name}</Text>
              <Text style={styles.pollutantValue}>{pollutant.value}</Text>
              <Text style={styles.pollutantUnit}>{pollutant.unit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Air Quality Scale */}
      <View style={styles.scaleCard}>
        <Text style={styles.cardTitle}>Air Quality Index Scale</Text>
        <View style={styles.scaleContainer}>
          {[
            { range: '0-50', status: 'Good', color: '#4CAF50' },
            { range: '51-100', status: 'Moderate', color: '#FFEB3B' },
            { range: '101-150', status: 'Unhealthy for Sensitive', color: '#FF9800' },
            { range: '151-200', status: 'Unhealthy', color: '#F44336' },
            { range: '201-300', status: 'Very Unhealthy', color: '#9C27B0' },
            { range: '300+', status: 'Hazardous', color: '#8D4E85' },
          ].map((level, index) => (
            <View key={index} style={styles.scaleItem}>
              <View style={[styles.scaleIndicator, { backgroundColor: level.color }]} />
              <View style={styles.scaleText}>
                <Text style={styles.scaleRange}>{level.range}</Text>
                <Text style={styles.scaleStatus}>{level.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  locationStatusText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  locationPermissionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  grantPermissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  grantPermissionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetails: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  mockDataNotice: {
    fontSize: 13,
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  heroSection: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    margin: 16,
    marginBottom: 0,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  mockDataIndicator: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
  },
  locationWarning: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  refreshButton: {
    padding: 8,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 18,
    marginBottom: 8,
  },
  retryLocationButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryLocationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  aqiMainDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aqiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  aqiValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  aqiLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  aqiStatusContainer: {
    flex: 1,
    marginLeft: 20,
  },
  aqiStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  healthMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdatedText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#999',
  },
  recommendationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    margin: 16,
    marginTop: 0,
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendationContent: {
    // marginTop: 12,
  },
  sensitiveGroupAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sensitiveGroupText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '500',
  },
  recommendationText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  pollutantsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pollutantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pollutantItem: {
    width: (width - 80) / 3,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  pollutantName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  pollutantValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pollutantUnit: {
    fontSize: 10,
    color: '#666',
  },
  locationSubtext: {
    marginTop: -8,
    marginBottom: 8,
    marginHorizontal: 4,
    color: '#666',
    fontSize: 12,
  },
  scaleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scaleContainer: {
    marginTop: 16,
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scaleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 16,
  },
  scaleText: {
    flex: 1,
  },
  scaleRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scaleStatus: {
    fontSize: 12,
    color: '#666',
  },
});
