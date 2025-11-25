import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { AQIData } from '../types';
import { AQIService } from '../services/aqiService';
import { getTranslation } from '../utils/localization';

interface AQIDisplayProps {
  language?: 'en' | 'si' | 'ta';
  hasHealthConditions?: boolean;
}

const { width } = Dimensions.get('window');

export const AQIDisplay: React.FC<AQIDisplayProps> = ({
  language = 'en',
  hasHealthConditions = false,
}) => {
  const [aqiData, setAQIData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAQIData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let latitude = parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LAT || '6.9271');
      let longitude = parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LNG || '79.8612');

      // Only try to get location if not forced to use mock data
      if (process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'true') {
        try {
          // Request location permission
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            // Get current location
            const location = await Location.getCurrentPositionAsync({});
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
          } else {
            console.log('Location permission denied, using default location');
          }
        } catch (locationError) {
          console.log('Location error, using default location:', locationError);
        }
      } else {
        console.log('Using mock data mode - location fetching disabled');
      }

      // Fetch AQI data (will use mock data if configured)
      const data = await AQIService.getCurrentAQI(latitude, longitude);
      
      if (data) {
        setAQIData(data);
        setLastUpdated(new Date());
      } else {
        Alert.alert(
          'Error',
          'Unable to fetch air quality data. Please try again later.'
        );
      }
    } catch (error) {
      console.error('Error fetching AQI data:', error);
      
      // Fallback to mock data on any error
      try {
        const defaultLat = parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LAT || '6.9271');
        const defaultLng = parseFloat(process.env.EXPO_PUBLIC_DEFAULT_LNG || '79.8612');
        const fallbackData = await AQIService.getCurrentAQI(defaultLat, defaultLng);
        
        if (fallbackData) {
          setAQIData(fallbackData);
          setLastUpdated(new Date());
        } else {
          Alert.alert(
            'Error',
            'Unable to fetch air quality data. Please check your internet connection.'
          );
        }
      } catch (fallbackError) {
        Alert.alert(
          'Error',
          'Unable to fetch air quality data. Please check your internet connection.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAQIData();
    
    // Set up auto-refresh every 10 minutes (reduced from 30 for better balance)
    const interval = setInterval(() => {
      fetchAQIData();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    fetchAQIData(true);
  };

  if (loading && !aqiData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {getTranslation('loadingAQI', language)}
        </Text>
      </View>
    );
  }

  if (!aqiData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>
          {getTranslation('noDataAvailable', language)}
        </Text>
      </View>
    );
  }

  const riskInfo = AQIService.getAQIRiskInfo(aqiData.aqi);
  const recommendation = AQIService.getPersonalizedRecommendation(
    aqiData.aqi,
    hasHealthConditions
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={[riskInfo.color + '20', riskInfo.color + '10']}
        style={styles.mainCard}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>
            {getTranslation('currentAQI', language)}
          </Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.locationText}>
              {aqiData.city}, {aqiData.country}
            </Text>
          </View>
        </View>

        <View style={styles.aqiSection}>
          <View style={[styles.aqiCircle, { borderColor: riskInfo.color }]}>
            <Text style={[styles.aqiValue, { color: riskInfo.color }]}>
              {aqiData.aqi}
            </Text>
            <Text style={styles.aqiLabel}>AQI</Text>
          </View>
          
          <View style={styles.aqiInfo}>
            <Text style={[styles.riskLevel, { color: riskInfo.color }]}>
              {getTranslation(riskInfo.level, language)}
            </Text>
            <Text style={styles.description}>
              {riskInfo.description}
            </Text>
          </View>
        </View>

        <View style={styles.recommendationSection}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="bulb-outline" size={20} color="#007AFF" />
            <Text style={styles.recommendationTitle}>
              {getTranslation('recommendation', language)}
            </Text>
          </View>
          <Text style={styles.recommendationText}>
            {recommendation}
          </Text>
        </View>

        <View style={styles.pollutantsSection}>
          <Text style={styles.sectionTitle}>
            {getTranslation('pollutants', language)}
          </Text>
          <View style={styles.pollutantsGrid}>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>PM2.5</Text>
              <Text style={styles.pollutantValue}>{aqiData.pollutants.pm25}</Text>
            </View>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>PM10</Text>
              <Text style={styles.pollutantValue}>{aqiData.pollutants.pm10}</Text>
            </View>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>O3</Text>
              <Text style={styles.pollutantValue}>{aqiData.pollutants.o3}</Text>
            </View>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>NO2</Text>
              <Text style={styles.pollutantValue}>{aqiData.pollutants.no2}</Text>
            </View>
          </View>
        </View>

        {lastUpdated && (
          <View style={styles.lastUpdatedSection}>
            <Ionicons name="time-outline" size={14} color="#999" />
            <Text style={styles.lastUpdatedText}>
              {getTranslation('lastUpdated', language)}: {formatTime(lastUpdated)}
            </Text>
          </View>
        )}
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  mainCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  aqiSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  aqiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  aqiValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  aqiLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  aqiInfo: {
    flex: 1,
    marginLeft: 20,
  },
  riskLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  recommendationSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  pollutantsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pollutantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pollutantItem: {
    width: (width - 80) / 2,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  pollutantLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pollutantValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lastUpdatedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lastUpdatedText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#999',
  },
});
