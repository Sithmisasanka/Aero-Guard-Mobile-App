import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationContext {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  nearbyLandmarks: string[];
  pollutionSources: PollutionSource[];
  weatherCorrelation: WeatherData | null;
  aqiForecast: ForecastData[];
  locationQuality: LocationQuality;
}

export interface PollutionSource {
  type: 'traffic' | 'industrial' | 'construction' | 'natural';
  name: string;
  distance: number; // in meters
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  pressure: number;
  weatherCondition: string;
}

export interface ForecastData {
  time: string;
  aqi: number;
  confidence: number;
  factors: string[];
}

export interface LocationQuality {
  accuracy: number;
  age: number; // seconds since last update
  source: 'gps' | 'network' | 'cached';
}

class LocationContextService {
  private static instance: LocationContextService;
  private cachedLocation: LocationContext | null = null;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  static getInstance(): LocationContextService {
    if (!LocationContextService.instance) {
      LocationContextService.instance = new LocationContextService();
    }
    return LocationContextService.instance;
  }

  /**
   * Get comprehensive location context
   */
  async getLocationContext(): Promise<LocationContext | null> {
    try {
      // Check if we have valid cached data
      if (this.isCacheValid()) {
        return this.cachedLocation;
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return this.getDefaultLocationContext();
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get reverse geocoding
      const addressData = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Build location context
      const context: LocationContext = {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        address: this.formatAddress(addressData[0]),
        nearbyLandmarks: await this.getNearbyLandmarks(location.coords.latitude, location.coords.longitude),
        pollutionSources: this.identifyPollutionSources(location.coords.latitude, location.coords.longitude),
        weatherCorrelation: await this.getWeatherData(location.coords.latitude, location.coords.longitude),
        aqiForecast: this.generateAQIForecast(location.coords.latitude, location.coords.longitude),
        locationQuality: {
          accuracy: location.coords.accuracy || 0,
          age: 0,
          source: 'gps',
        },
      };

      // Cache the result
      this.cachedLocation = context;
      await this.saveCachedLocation(context);

      return context;
    } catch (error) {
      console.error('Failed to get location context:', error);
      return this.getDefaultLocationContext();
    }
  }

  /**
   * Get location context with custom coordinates
   */
  async getLocationContextForCoordinates(latitude: number, longitude: number): Promise<LocationContext> {
    try {
      // Get reverse geocoding
      const addressData = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const context: LocationContext = {
        coordinates: { latitude, longitude },
        address: this.formatAddress(addressData[0]),
        nearbyLandmarks: await this.getNearbyLandmarks(latitude, longitude),
        pollutionSources: this.identifyPollutionSources(latitude, longitude),
        weatherCorrelation: await this.getWeatherData(latitude, longitude),
        aqiForecast: this.generateAQIForecast(latitude, longitude),
        locationQuality: {
          accuracy: 10000, // Approximate accuracy for manual coordinates
          age: 0,
          source: 'network',
        },
      };

      return context;
    } catch (error) {
      console.error('Failed to get location context for coordinates:', error);
      return this.getDefaultLocationContext();
    }
  }

  /**
   * Format address from geocoding data
   */
  private formatAddress(addressData: any): string {
    if (!addressData) return 'Unknown Location';

    const parts = [];
    if (addressData.street) parts.push(addressData.street);
    if (addressData.city) parts.push(addressData.city);
    if (addressData.region) parts.push(addressData.region);
    if (addressData.country) parts.push(addressData.country);

    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }

  /**
   * Get nearby landmarks (mock implementation)
   */
  private async getNearbyLandmarks(latitude: number, longitude: number): Promise<string[]> {
    // In a real implementation, this would query a places API
    const landmarks = [
      'City Center',
      'Main Hospital',
      'Central Park',
      'Shopping Mall',
      'University Campus',
      'Industrial Zone',
      'Airport',
      'Beach Front',
      'Mountain View',
      'River Side'
    ];

    // Return 2-4 random landmarks for demo
    const count = Math.floor(Math.random() * 3) + 2;
    const shuffled = landmarks.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Identify potential pollution sources
   */
  private identifyPollutionSources(latitude: number, longitude: number): PollutionSource[] {
    // Mock implementation - in reality would use geographic data
    const sources: PollutionSource[] = [];

    // Simulate different pollution sources based on location characteristics
    const locationHash = Math.abs(latitude + longitude * 2) % 100;

    if (locationHash < 30) {
      sources.push({
        type: 'traffic',
        name: 'Main Highway',
        distance: Math.floor(Math.random() * 500) + 100,
        severity: 'high',
        description: 'Heavy traffic corridor with diesel vehicles',
      });
    }

    if (locationHash > 20 && locationHash < 50) {
      sources.push({
        type: 'industrial',
        name: 'Manufacturing District',
        distance: Math.floor(Math.random() * 1000) + 500,
        severity: 'medium',
        description: 'Light industrial area with factories',
      });
    }

    if (locationHash > 40 && locationHash < 70) {
      sources.push({
        type: 'construction',
        name: 'Construction Site',
        distance: Math.floor(Math.random() * 300) + 50,
        severity: 'medium',
        description: 'Active construction with dust generation',
      });
    }

    if (locationHash > 60) {
      sources.push({
        type: 'natural',
        name: 'Dust Storm Area',
        distance: Math.floor(Math.random() * 2000) + 1000,
        severity: 'low',
        description: 'Natural dust sources from dry areas',
      });
    }

    return sources;
  }

  /**
   * Get weather data (mock implementation)
   */
  private async getWeatherData(latitude: number, longitude: number): Promise<WeatherData | null> {
    try {
      // Mock weather data - in production, integrate with weather API
      const mockWeather: WeatherData = {
        temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        visibility: Math.floor(Math.random() * 5) + 5, // 5-10 km
        pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
        weatherCondition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Hazy', 'Windy'][Math.floor(Math.random() * 5)],
      };

      return mockWeather;
    } catch (error) {
      console.error('Failed to get weather data:', error);
      return null;
    }
  }

  /**
   * Generate AQI forecast for next 6 hours
   */
  private generateAQIForecast(latitude: number, longitude: number): ForecastData[] {
    const forecast: ForecastData[] = [];
    const currentHour = new Date().getHours();
    const baseAQI = Math.floor(Math.random() * 150) + 50;

    for (let i = 1; i <= 6; i++) {
      const hour = (currentHour + i) % 24;
      const variation = Math.floor(Math.random() * 40) - 20; // ±20 variation
      const aqi = Math.max(0, Math.min(500, baseAQI + variation));

      forecast.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        aqi,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100% confidence
        factors: this.getInfluencingFactors(hour, aqi),
      });
    }

    return forecast;
  }

  /**
   * Get factors influencing AQI at specific time
   */
  private getInfluencingFactors(hour: number, aqi: number): string[] {
    const factors = [];

    // Rush hour factors
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      factors.push('Rush hour traffic');
    }

    // Temperature inversion (early morning)
    if (hour >= 5 && hour <= 8) {
      factors.push('Temperature inversion');
    }

    // Industrial activity
    if (hour >= 8 && hour <= 18) {
      factors.push('Industrial emissions');
    }

    // Wind patterns
    if (aqi > 100) {
      factors.push('Low wind speed');
    } else {
      factors.push('Good ventilation');
    }

    // Seasonal factors (simplified)
    const month = new Date().getMonth();
    if (month >= 10 || month <= 2) {
      factors.push('Winter conditions');
    }

    return factors.slice(0, 3); // Return max 3 factors
  }

  /**
   * Check if cached data is valid
   */
  private isCacheValid(): boolean {
    if (!this.cachedLocation) return false;
    
    const now = Date.now();
    const cacheAge = now - (this.cachedLocation.locationQuality.age * 1000);
    
    return cacheAge < this.cacheExpiry;
  }

  /**
   * Get default location context (fallback)
   */
  private getDefaultLocationContext(): LocationContext {
    return {
      coordinates: {
        latitude: 6.9271,
        longitude: 79.8612,
      },
      address: 'Colombo, Sri Lanka',
      nearbyLandmarks: ['City Center', 'Galle Face Green', 'Port of Colombo'],
      pollutionSources: [
        {
          type: 'traffic',
          name: 'Main Road',
          distance: 200,
          severity: 'medium',
          description: 'Urban traffic pollution',
        },
      ],
      weatherCorrelation: {
        temperature: 28,
        humidity: 75,
        windSpeed: 15,
        windDirection: 'SW',
        visibility: 8,
        pressure: 1012,
        weatherCondition: 'Partly Cloudy',
      },
      aqiForecast: [],
      locationQuality: {
        accuracy: 1000,
        age: 3600,
        source: 'cached',
      },
    };
  }

  /**
   * Save cached location to storage
   */
  private async saveCachedLocation(context: LocationContext): Promise<void> {
    try {
      const cacheData = {
        ...context,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('cached_location_context', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save cached location:', error);
    }
  }

  /**
   * Load cached location from storage
   */
  async loadCachedLocation(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('cached_location_context');
      if (cached) {
        const data = JSON.parse(cached);
        const age = Math.floor((Date.now() - data.timestamp) / 1000);
        
        if (age < this.cacheExpiry / 1000) {
          this.cachedLocation = {
            ...data,
            locationQuality: {
              ...data.locationQuality,
              age,
            },
          };
        }
      }
    } catch (error) {
      console.error('Failed to load cached location:', error);
    }
  }

  /**
   * Clear cached location
   */
  async clearCache(): Promise<void> {
    this.cachedLocation = null;
    try {
      await AsyncStorage.removeItem('cached_location_context');
    } catch (error) {
      console.error('Failed to clear location cache:', error);
    }
  }
}

export const locationContextService = LocationContextService.getInstance();