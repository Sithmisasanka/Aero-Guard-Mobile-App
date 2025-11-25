import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import ForecastService, { AQIForecast, ForecastData } from '../services/forecastService';
import { getTranslation } from '../utils/localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

interface ForecastScreenProps {
  navigation: any;
}

export const ForecastScreen: React.FC<ForecastScreenProps> = ({ navigation }) => {
  const [forecast, setForecast] = useState<AQIForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewType, setViewType] = useState<'hourly' | 'daily'>('hourly');
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const forecastService = ForecastService.getInstance();

  useEffect(() => {
    initializeLocation();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setSelectedLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        loadForecast(location.coords.latitude, location.coords.longitude);
      } else {
        // Use default location
        const defaultLat = parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LAT || '6.9271');
        const defaultLng = parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LNG || '79.8612');
        setSelectedLocation({ latitude: defaultLat, longitude: defaultLng });
        loadForecast(defaultLat, defaultLng);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Fallback to default location
      const defaultLat = parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LAT || '6.9271');
      const defaultLng = parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LNG || '79.8612');
      setSelectedLocation({ latitude: defaultLat, longitude: defaultLng });
      loadForecast(defaultLat, defaultLng);
    }
  };

  const loadForecast = async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      const forecastData = await forecastService.getAQIForecast(latitude, longitude);
      setForecast(forecastData);
    } catch (error) {
      console.error('Error loading forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (selectedLocation) {
      setRefreshing(true);
      await loadForecast(selectedLocation.latitude, selectedLocation.longitude);
      setRefreshing(false);
    }
  };

  const renderForecastItem = (item: ForecastData, type: 'hourly' | 'daily') => {
    const color = forecastService.getAQIColor(item.aqi);
    const time = forecastService.formatForecastTime(item.date, type);

    return (
      <View key={item.date} style={styles.forecastItem}>
        <Text style={styles.forecastTime}>{time}</Text>
        <View style={styles.forecastContent}>
          <View style={[styles.aqiCircle, { backgroundColor: color }]}>
            <Text style={styles.aqiValue}>{item.aqi}</Text>
          </View>
          <View style={styles.forecastDetails}>
            <Text style={styles.forecastStatus}>{item.status}</Text>
            <View style={styles.meteorology}>
              <View style={styles.meteoItem}>
                <Ionicons name="thermometer-outline" size={14} color="#666" />
                <Text style={styles.meteoText}>{item.temperature}°C</Text>
              </View>
              <View style={styles.meteoItem}>
                <Ionicons name="water-outline" size={14} color="#666" />
                <Text style={styles.meteoText}>{item.humidity}%</Text>
              </View>
              <View style={styles.meteoItem}>
                <Ionicons name="flag-outline" size={14} color="#666" />
                <Text style={styles.meteoText}>{item.windSpeed} km/h</Text>
              </View>
            </View>
          </View>
          <Text style={styles.primaryPollutant}>{item.primary_pollutant}</Text>
        </View>
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!forecast) return null;

    const currentAQI = forecast.current.aqi;
    const healthRec = forecastService.getHealthRecommendation(currentAQI);
    const activityRecs = forecastService.getActivityRecommendation(currentAQI);

    return (
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>{getTranslation('healthAndActivityRecommendations', userProfile?.preferredLanguage || 'en')}</Text>
        
        <View style={styles.healthRecommendation}>
          <Ionicons name="medical-outline" size={24} color="#007AFF" />
          <Text style={styles.healthText}>{healthRec}</Text>
        </View>

        <View style={styles.activityRecommendations}>
          {activityRecs.map((rec, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={styles.activityName}>{rec.activity}</Text>
              <Text style={styles.activityRec}>{rec.recommendation}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading && !forecast) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="cloud-outline" size={64} color="#007AFF" />
        <Text style={styles.loadingText}>{getTranslation('loadingForecast', userProfile?.preferredLanguage || 'en')}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['rgba(138, 173, 244, 0.12)', 'rgba(174, 139, 248, 0.08)', 'rgba(255, 182, 193, 0.05)']}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {forecast && (
        <>
          {/* Current Conditions */}
          <View style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <View>
                <Text style={styles.locationText}>
                  {forecast.location.city}, {forecast.location.country}
                </Text>
                <Text style={styles.updateTime}>
                  {getTranslation('updated', userProfile?.preferredLanguage || 'en')}: {new Date(forecast.lastUpdated).toLocaleTimeString()}
                </Text>
              </View>
              <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                <Ionicons name="refresh" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.currentAQI}>
              <View style={[
                styles.currentAQICircle,
                { backgroundColor: forecastService.getAQIColor(forecast.current.aqi) }
              ]}>
                <Text style={styles.currentAQIValue}>{forecast.current.aqi}</Text>
                <Text style={styles.currentAQILabel}>AQI</Text>
              </View>
              <View style={styles.currentInfo}>
                <Text style={styles.currentStatus}>
                  {forecastService.getAQIStatus ? 
                    forecastService.getAQIStatus(forecast.current.aqi) : 
                    'Unknown'
                  }
                </Text>
                <Text style={styles.currentDescription}>
                  {getTranslation('primaryPollutant', userProfile?.preferredLanguage || 'en')}: PM2.5
                </Text>
              </View>
            </View>
          </View>

          {/* View Toggle */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, viewType === 'hourly' && styles.toggleButtonActive]}
                onPress={() => setViewType('hourly')}
              >
                <Text style={[
                  styles.toggleText,
                  viewType === 'hourly' && styles.toggleTextActive
                ]}>
                  {getTranslation('hourlyView', userProfile?.preferredLanguage || 'en')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, viewType === 'daily' && styles.toggleButtonActive]}
                onPress={() => setViewType('daily')}
              >
                <Text style={[
                  styles.toggleText,
                  viewType === 'daily' && styles.toggleTextActive
                ]}>
                  {getTranslation('dailyView', userProfile?.preferredLanguage || 'en')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forecast List */}
          <View style={styles.forecastCard}>
            <Text style={styles.cardTitle}>
              {viewType === 'hourly' ? 
                getTranslation('hourlyForecast', userProfile?.preferredLanguage || 'en') : 
                getTranslation('dailyForecast', userProfile?.preferredLanguage || 'en')
              }
            </Text>
            {(viewType === 'hourly' ? forecast.hourly : forecast.daily).map((item) =>
              renderForecastItem(item, viewType)
            )}
          </View>

          {/* Recommendations */}
          {renderRecommendations()}
        </>
      )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  currentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  updateTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
  },
  currentAQI: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentAQICircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  currentAQIValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  currentAQILabel: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
  },
  currentInfo: {
    flex: 1,
  },
  currentStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  currentDescription: {
    fontSize: 16,
    color: '#666',
  },
  toggleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: 'white',
  },
  forecastCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  forecastItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  forecastTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  forecastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aqiCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aqiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  forecastDetails: {
    flex: 1,
  },
  forecastStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  meteorology: {
    flexDirection: 'row',
    gap: 12,
  },
  meteoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meteoText: {
    fontSize: 12,
    color: '#666',
  },
  primaryPollutant: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  recommendationsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  healthRecommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  healthText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  activityRecommendations: {
    gap: 12,
  },
  activityItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityRec: {
    fontSize: 14,
    color: '#666',
  },
});