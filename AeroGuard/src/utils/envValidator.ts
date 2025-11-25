// Environment Variable Validator and Diagnostic Tool
import Constants from 'expo-constants';
export class EnvValidator {
  static validateAQIConfiguration(): {
    isValid: boolean;
    issues: string[];
    configuration: Record<string, any>;
  } {
    const issues: string[] = [];
    const configuration: Record<string, any> = {};

  // Check API keys
  import Constants from 'expo-constants';
  const extra = (Constants.expoConfig as Record<string, any>)?.extra ?? {};
  const iqairKey = extra.EXPO_PUBLIC_IQAIR_API_KEY;
  const googleAirQualityKey = extra.EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY;
  const useMockData = extra.EXPO_PUBLIC_USE_MOCK_DATA;
  const enableLogging = extra.EXPO_PUBLIC_ENABLE_LOGGING;

    // Validate IQAir API configuration
    configuration.iqairApiKey = iqairKey ? (iqairKey === 'YOUR_IQAIR_API_KEY' ? 'NOT_CONFIGURED' : 'CONFIGURED') : 'MISSING';
    configuration.googleAirQualityKey = googleAirQualityKey ? 'CONFIGURED' : 'MISSING';
    configuration.useMockData = useMockData === 'true';
    configuration.enableLogging = enableLogging === 'true';

    // Check if app will use mock data
    if (!iqairKey || iqairKey === 'YOUR_IQAIR_API_KEY') {
      if (!googleAirQualityKey) {
        issues.push('No valid API keys found - app will use mock data');
        configuration.dataSource = 'MOCK_DATA';
      } else {
        configuration.dataSource = 'GOOGLE_AIR_QUALITY_ONLY';
      }
    } else {
      if (googleAirQualityKey) {
        configuration.dataSource = 'GOOGLE_PRIMARY_IQAIR_FALLBACK';
      } else {
        configuration.dataSource = 'IQAIR_ONLY';
      }
    }

    // Check location configuration
    const defaultLat = process.env.EXPO_PUBLIC_DEFAULT_LAT;
    const defaultLng = process.env.EXPO_PUBLIC_DEFAULT_LNG;
    const defaultCity = process.env.EXPO_PUBLIC_DEFAULT_CITY;
    const defaultCountry = process.env.EXPO_PUBLIC_DEFAULT_COUNTRY;

    configuration.defaultLocation = {
      lat: defaultLat ? parseFloat(defaultLat) : 6.9271,
      lng: defaultLng ? parseFloat(defaultLng) : 79.8612,
      city: defaultCity || 'Colombo',
      country: defaultCountry || 'Sri Lanka'
    };

    // Validate coordinates
    const lat = configuration.defaultLocation.lat;
    const lng = configuration.defaultLocation.lng;
    
    if (lat < -90 || lat > 90) {
      issues.push(`Invalid latitude: ${lat} (must be between -90 and 90)`);
    }
    
    if (lng < -180 || lng > 180) {
      issues.push(`Invalid longitude: ${lng} (must be between -180 and 180)`);
    }

    // Check if coordinates match expected location (Sri Lanka)
    const isInSriLanka = lat >= 5.9 && lat <= 9.9 && lng >= 79.7 && lng <= 81.9;
    configuration.locationValid = isInSriLanka;
    
    if (!isInSriLanka) {
      issues.push(`Coordinates (${lat}, ${lng}) don't appear to be in Sri Lanka`);
    }

    // Other environment checks
    configuration.other = {
      googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? 'CONFIGURED' : 'MISSING',
      mapProvider: process.env.EXPO_PUBLIC_MAP_PROVIDER || 'default',
      appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development'
    };

    return {
      isValid: issues.length === 0,
      issues,
      configuration
    };
  }

  static async testCoordinateValidity(lat: number, lng: number): Promise<{
    valid: boolean;
    location?: string;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // Basic validation
    if (lat < -90 || lat > 90) {
      issues.push(`Invalid latitude: ${lat}`);
    }
    
    if (lng < -180 || lng > 180) {
      issues.push(`Invalid longitude: ${lng}`);
    }

    // Check if coordinates are in a reasonable location (not ocean, etc.)
    if (lat === 0 && lng === 0) {
      issues.push('Coordinates are at null island (0,0) - likely not a real location');
    }

    // For Sri Lanka specifically
    const isInSriLanka = lat >= 5.9 && lat <= 9.9 && lng >= 79.7 && lng <= 81.9;
    if (!isInSriLanka) {
      issues.push('Coordinates are outside Sri Lanka bounds');
    }

    try {
      // Try reverse geocoding to validate location
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=1&appid=demo`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const location = `${data[0].name}, ${data[0].country}`;
          return {
            valid: issues.length === 0,
            location,
            issues
          };
        }
      }
    } catch (error) {
      issues.push(`Could not validate location: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  static logDiagnostics(): void {
    const validation = this.validateAQIConfiguration();
    
    console.group('🔍 AQI Service Configuration Diagnostics');
    console.log('Configuration:', validation.configuration);
    
    if (validation.issues.length > 0) {
      console.group('⚠️ Issues Found:');
      validation.issues.forEach(issue => console.warn(issue));
      console.groupEnd();
    } else {
      console.log('✅ Configuration looks good!');
    }
    
    console.groupEnd();
  }
}

export default EnvValidator;