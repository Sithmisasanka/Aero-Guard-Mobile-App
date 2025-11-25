import { AQIData, AQIResponse, AQIRiskLevel, AQIRiskInfo, IQAirData } from '../types';
import NotificationService from './notificationService';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

// Environment variables for API configuration
const expoConfig = Constants.expoConfig ?? {};
const extra = (expoConfig as Record<string, any>).extra ?? {};
const API_KEY = extra.EXPO_PUBLIC_IQAIR_API_KEY || 'YOUR_IQAIR_API_KEY';
const GOOGLE_AIR_QUALITY_KEY = extra.EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY || '';
const BASE_URL = 'https://api.airvisual.com/v2';
const USE_MOCK_DATA = extra.EXPO_PUBLIC_USE_MOCK_DATA === 'true';

// Default location from environment or fallback
const DEFAULT_CITY = extra.EXPO_PUBLIC_DEFAULT_CITY || 'Colombo';
const DEFAULT_COUNTRY = extra.EXPO_PUBLIC_DEFAULT_COUNTRY || 'Sri Lanka';
const DEFAULT_LAT = parseFloat(extra.EXPO_PUBLIC_DEFAULT_LAT || '6.9271');
const DEFAULT_LNG = parseFloat(extra.EXPO_PUBLIC_DEFAULT_LNG || '79.8612');

// Mock data for development/testing when API key is not available
const MOCK_AQI_DATA = {
  aqi: 75, // Moderate level - realistic for Colombo
  city: DEFAULT_CITY,
  country: DEFAULT_COUNTRY,
  station: 'Demo Station',
  timestamp: new Date().toISOString(),
  coordinates: {
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
  },
  pollutants: {
    pm25: 28, // Realistic PM2.5 for moderate AQI (~75)
    pm10: 40,
    o3: 35,
    no2: 20,
    so2: 8,
    co: 12,
  },
};

export class AQIService {
  private static notificationService = NotificationService.getInstance();

  // Compute US EPA AQI from PM2.5 concentration (μg/m³)
  private static computeUSAQIFromPM25(pm25: number): number {
    // EPA breakpoints for PM2.5 (24-hour), units: μg/m³
    // [C_low, C_high, I_low, I_high]
    const ranges = [
      [0.0, 12.0, 0, 50],
      [12.1, 35.4, 51, 100],
      [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200],
      [150.5, 250.4, 201, 300],
      [250.5, 350.4, 301, 400],
      [350.5, 500.4, 401, 500],
    ] as const;
    for (const [Cl, Ch, Il, Ih] of ranges) {
      if (pm25 >= Cl && pm25 <= Ch) {
        const aqi = ((Ih - Il) / (Ch - Cl)) * (pm25 - Cl) + Il;
        return Math.round(aqi);
      }
    }
    if (pm25 > 500.4) return 500;
    return 0;
  }

  // Reverse geocode latitude/longitude to get a human-readable city and country
  private static async reverseGeocodeCityCountry(
    latitude: number,
    longitude: number
  ): Promise<{ city?: string; country?: string }> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const g = results?.[0];
      if (!g) return {};
      // Prefer locality/district/subregion/region for city-like label
      const city = (g.city || (g as any).district || g.subregion || g.region || g.name || undefined) as
        | string
        | undefined;
      const country = (g.country || g.isoCountryCode || undefined) as string | undefined;
      return { city, country };
    } catch (e) {
      if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
        console.warn('Reverse geocode failed:', e);
      }
    }
    return {};
  }

  static async getCurrentAQI(latitude: number, longitude: number): Promise<AQIData | null> {
    try {
      // Prefer Google Air Quality API if configured (provides pollutant concentrations)
      if (!USE_MOCK_DATA && GOOGLE_AIR_QUALITY_KEY) {
        const fromGoogle = await this.fetchFromGoogleAirQuality(latitude, longitude);
        if (fromGoogle) {
          await this.checkForAQIAlert(fromGoogle);
          return fromGoogle;
        }
      }

      // Check if we should use mock data (either forced by environment or API key not configured)
      if (USE_MOCK_DATA || API_KEY === 'YOUR_IQAIR_API_KEY') {
        if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
          console.log('AQIService: Using mock data mode');
          console.log('AQIService: USE_MOCK_DATA =', USE_MOCK_DATA);
          console.log('AQIService: API_KEY =', API_KEY === 'YOUR_IQAIR_API_KEY' ? 'NOT_CONFIGURED' : 'CONFIGURED');
        }
        const mockData = {
          ...MOCK_AQI_DATA,
          coordinates: { latitude, longitude }
        };
        if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
          console.log('AQIService: Returning mock data:', mockData);
        }
        
        // Check for notification alert
        await this.checkForAQIAlert(mockData);
        
        return mockData;
      }

      if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
        console.log('AQIService: Using real API data');
      }

      const response = await fetch(
        `${BASE_URL}/nearest_city?lat=${latitude}&lon=${longitude}&key=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: AQIResponse = await response.json();
      
      if (data.status === 'success' && data.data) {
        // Build base AQI data from IQAir (note: concentrations not provided)
        let aqiData: AQIData = {
          aqi: data.data.current.pollution.aqius,
          city: data.data.city,
          country: data.data.country,
          station: data.data.station?.name || 'Unknown',
          timestamp: new Date().toISOString(),
          coordinates: {
            latitude,
            longitude,
          },
          pollutants: {
            // IQAir nearest_city does not include concentrations; do not misuse AQI as μg/m³.
            pm25: 0,
            pm10: 0,
            o3: 0,
            no2: 0,
            so2: 0,
            co: 0,
          },
        };
        // Improve city/country using reverse geocoding for more accurate local labels
        try {
          const gc = await this.reverseGeocodeCityCountry(latitude, longitude);
          aqiData = {
            ...aqiData,
            city: gc.city || aqiData.city,
            country: gc.country || aqiData.country,
          };
        } catch {}
        
        // Check for notification alert
        await this.checkForAQIAlert(aqiData);
        
        return aqiData;
      }
      
      return null;
    } catch (error) {
      if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
        console.error('Error fetching AQI data:', error);
        console.log('Falling back to mock data due to API error');
      }
      // Fallback to mock data on error
      const fallbackData = {
        ...MOCK_AQI_DATA,
        coordinates: { latitude, longitude }
      };
      
      // Check for notification alert even with fallback data
      await this.checkForAQIAlert(fallbackData);
      
      return fallbackData;
    }
  }

  private static async fetchFromGoogleAirQuality(lat: number, lng: number): Promise<AQIData | null> {
    try {
      const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_AIR_QUALITY_KEY}`;
      const body = {
        location: { latitude: lat, longitude: lng },
        extraComputations: [
          'POLLUTANT_CONCENTRATION',
          'HEALTH_RECOMMENDATIONS',
          'DOMINANT_POLLUTANT_CONCENTRATION'
        ],
        languageCode: 'en'
      };
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        throw new Error(`Google Air Quality API error: ${resp.status}`);
      }
      const json = await resp.json();

      // Google response schema can vary. Try to be defensive.
      const cc = json.currentConditions?.[0] || json.currentConditions || json.data?.[0] || json;
      if (!cc) return null;

      // Extract pollutant concentrations first
      const pollutantsArr = cc.pollutants || cc.pollutantConcentrations || [];
      const readVal = (codes: string[]): number => {
        if (!Array.isArray(pollutantsArr)) return 0;
        for (const p of pollutantsArr) {
          const code = String(p.code || p.name || p.fullName || '').toLowerCase();
          const display = String(p.displayName || p.fullName || '').toLowerCase();
          if (codes.some(c => code.includes(c) || display.includes(c))) {
            const v = p.concentration?.value ?? p.value ?? p.amount ?? 0;
            return Number(v) || 0;
          }
        }
        return 0;
      };

      const pm25 = readVal(['pm2', 'pm2.5', 'pm2p5', 'pm25']);
      const pm10 = readVal(['pm10']);
      const o3 = readVal(['o3', 'ozone']);
      const no2 = readVal(['no2']);
      const so2 = readVal(['so2']);
      const co = readVal(['co']);

      // Prefer computing US EPA AQI from PM2.5 to align with app scale (0-500)
      let aqi = this.computeUSAQIFromPM25(pm25);
      
      // Debug logging for high PM2.5 values
      if (pm25 > 100 && process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
        console.warn(`🚨 High PM2.5 detected: ${pm25} μg/m³ → AQI ${aqi}`);
        console.log('Location:', `${lat}, ${lng}`);
        console.log('Pollutant data:', { pm25, pm10, o3, no2, so2, co });
      }
      
      // If PM2.5 missing, try to fall back to any provided US-specific index
      if (!aqi) {
        const indexes = cc.indexes || cc.aqiIndexes || [];
        if (Array.isArray(indexes) && indexes.length > 0) {
          const us = indexes.find((i: any) => /us|epa/.test(String(i.code || i.name || '').toLowerCase()));
          const anyIdx = us || indexes[0];
          aqi = Number(anyIdx?.aqi ?? anyIdx?.value ?? anyIdx?.index ?? 0) || 0;
          
          if (aqi > 150 && process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
            console.warn(`🚨 High AQI from API index: ${aqi}`);
            console.log('Index data:', anyIdx);
          }
        }
      }

      // Reverse geocode to get proper city and country names
      const gc = await this.reverseGeocodeCityCountry(lat, lng);
      const city = gc.city || 'Current Location';
      const country = gc.country || '';

      // Final AQI calculation with safety checks
      let finalAQI = aqi || Math.max(pm25, pm10, o3, no2, so2, co) || 0;
      
      // Safety check for unrealistic values
      if (finalAQI > 300) {
        if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
          console.warn(`🚨 Extremely high AQI detected: ${finalAQI} - This might indicate:
            1. Real severe air pollution event
            2. API data error or unit confusion
            3. Calculation error`);
        }
        
        // For Sri Lanka context, AQI > 300 is extremely rare
        // Cap at 200 for safety unless it's clearly a real pollution event
        if (finalAQI > 500 || (pm25 === 0 && pm10 === 0)) {
          console.warn('🔧 Capping unrealistic AQI value to 150 (unhealthy level)');
          finalAQI = 150;
        }
      }

      const result: AQIData = {
        aqi: finalAQI,
        city,
        country,
        station: 'Google Air Quality',
        timestamp: new Date().toISOString(),
        coordinates: { latitude: lat, longitude: lng },
        pollutants: { pm25, pm10, o3, no2, so2, co }
      };
      return result;
    } catch (e) {
      if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
        console.warn('Google Air Quality fetch failed, falling back:', e);
      }
      return null;
    }
  }

  static async getAQIByCity(city: string, state?: string, country?: string): Promise<AQIData | null> {
    try {
      // Check if we should use mock data
      if (USE_MOCK_DATA || API_KEY === 'YOUR_IQAIR_API_KEY') {
        if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
          console.log('Using mock data for city search - configure EXPO_PUBLIC_IQAIR_API_KEY for real data');
        }
        return {
          ...MOCK_AQI_DATA,
          city: city,
          country: country || MOCK_AQI_DATA.country,
        };
      }

      const response = await fetch(
        `${BASE_URL}/city?city=${city}&state=${state || ''}&country=${country || ''}&key=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: AQIResponse = await response.json();
      
      if (data.status === 'success' && data.data) {
        return {
          aqi: data.data.current.pollution.aqius,
          city: data.data.city,
          country: data.data.country,
          station: data.data.station?.name || 'Unknown',
          timestamp: new Date().toISOString(),
          coordinates: {
            latitude: data.data.location.coordinates[1],
            longitude: data.data.location.coordinates[0],
          },
          pollutants: {
            pm25: data.data.current.pollution.aqius,
            pm10: 0,
            o3: 0,
            no2: 0,
            so2: 0,
            co: 0,
          },
        };
      }
      
      return null;
    } catch (error) {
      if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
        console.error('Error fetching AQI data:', error);
      }
      return null;
    }
  }

  static getAQIRiskLevel(aqi: number): AQIRiskLevel {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthySensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'veryUnhealthy';
    return 'hazardous';
  }

  static getAQIRiskInfo(aqi: number): AQIRiskInfo {
    const level = this.getAQIRiskLevel(aqi);
    
    const riskInfoMap: Record<AQIRiskLevel, AQIRiskInfo> = {
      good: {
        level: 'good',
        color: '#00E400',
        description: 'Air quality is satisfactory',
        recommendation: 'Great day for outdoor activities!'
      },
      moderate: {
        level: 'moderate',
        color: '#FFFF00',
        description: 'Air quality is acceptable',
        recommendation: 'Sensitive people should consider limiting outdoor activities'
      },
      unhealthySensitive: {
        level: 'unhealthySensitive',
        color: '#FF7E00',
        description: 'Unhealthy for sensitive groups',
        recommendation: 'Sensitive people should avoid outdoor activities'
      },
      unhealthy: {
        level: 'unhealthy',
        color: '#FF0000',
        description: 'Air quality is unhealthy',
        recommendation: 'Everyone should limit outdoor activities'
      },
      veryUnhealthy: {
        level: 'veryUnhealthy',
        color: '#8F3F97',
        description: 'Air quality is very unhealthy',
        recommendation: 'Avoid all outdoor activities'
      },
      hazardous: {
        level: 'hazardous',
        color: '#7E0023',
        description: 'Hazardous air quality',
        recommendation: 'Stay indoors and keep windows closed'
      }
    };
    
    return riskInfoMap[level];
  }

  static getPersonalizedRecommendation(aqi: number, hasHealthConditions: boolean, healthConditions?: any[]): string {
    const riskLevel = this.getAQIRiskLevel(aqi);
    
    // Enhanced recommendations based on specific health conditions
    if (healthConditions && healthConditions.length > 0) {
      const conditionTypes = healthConditions.map(c => c.id);
      const hasRespiratoryConditions = conditionTypes.some(c => 
        ['asthma', 'copd', 'respiratoryIssues', 'allergies'].includes(c)
      );
      const hasCardiacConditions = conditionTypes.includes('heartDisease');
      const isVulnerable = conditionTypes.some(c => 
        ['pregnancy', 'elderlyAge', 'childUnder12'].includes(c)
      );
      
      switch (riskLevel) {
        case 'good':
          if (hasRespiratoryConditions) {
            return 'Great air quality! Safe for outdoor activities, but keep your inhaler handy if you have asthma.';
          }
          if (hasCardiacConditions) {
            return 'Excellent conditions for outdoor exercise. Monitor your heart rate during activities.';
          }
          if (isVulnerable) {
            return 'Perfect air quality for outdoor activities and play time.';
          }
          return 'Excellent air quality! Great time for all outdoor activities.';
          
        case 'moderate':
          if (hasRespiratoryConditions) {
            return 'Generally safe, but those with asthma or respiratory issues should monitor symptoms and reduce prolonged outdoor exertion.';
          }
          if (hasCardiacConditions) {
            return 'Good for light outdoor activities. Avoid intense exercise if you experience any discomfort.';
          }
          if (isVulnerable) {
            return 'Safe for most activities, but limit strenuous outdoor play. Pregnant women and elderly should take breaks indoors.';
          }
          return 'Good air quality with minor concerns for very sensitive individuals.';
          
        case 'unhealthySensitive':
          if (hasRespiratoryConditions) {
            return 'AVOID outdoor activities. Stay indoors with windows closed. Use air purifiers if available. Keep rescue medications accessible.';
          }
          if (hasCardiacConditions) {
            return 'Limit outdoor time and avoid all strenuous activities. Monitor for chest pain or breathing difficulties.';
          }
          if (isVulnerable) {
            return 'Stay indoors. Pregnant women, elderly, and children should avoid going outside. Use air conditioning or air purifiers.';
          }
          return 'Sensitive individuals should stay indoors and limit outdoor activities.';
          
        case 'unhealthy':
        case 'veryUnhealthy':
          if (hasRespiratoryConditions) {
            return 'HEALTH ALERT: Stay indoors immediately. Seal windows and doors. Use N95 masks if you must go outside. Have emergency medications ready.';
          }
          if (hasCardiacConditions) {
            return 'URGENT: Avoid all outdoor exposure. Stay indoors with windows closed. Seek medical attention if experiencing symptoms.';
          }
          if (isVulnerable) {
            return 'CRITICAL: Everyone should stay indoors. Pregnant women, elderly, and children must avoid all outdoor exposure.';
          }
          return 'HEALTH ALERT: Everyone should avoid outdoor activities and stay indoors.';
          
        case 'hazardous':
          return 'EMERGENCY: Hazardous air quality! Stay indoors immediately. Seal all windows and doors. Avoid all outdoor activities. Seek medical attention if experiencing any symptoms. Consider temporary relocation if possible.';
          
        default:
          return 'Monitor air quality regularly and adjust activities accordingly.';
      }
    }
    
    // Fallback to general recommendations
    if (hasHealthConditions) {
      switch (riskLevel) {
        case 'good':
          return 'Safe for outdoor activities, but monitor your symptoms';
        case 'moderate':
          return 'Consider reducing outdoor time and carrying medication';
        case 'unhealthySensitive':
        case 'unhealthy':
          return 'Stay indoors and use air purifiers if available';
        case 'veryUnhealthy':
        case 'hazardous':
          return 'Avoid going outside. Seek medical attention if experiencing symptoms';
        default:
          return 'Monitor air quality regularly';
      }
    }
    
    return this.getAQIRiskInfo(aqi).recommendation;
  }

  private static async checkForAQIAlert(aqiData: AQIData): Promise<void> {
    try {
      const riskInfo = this.getAQIRiskInfo(aqiData.aqi);
      
      await this.notificationService.checkAndSendAQIAlert({
        aqi: aqiData.aqi,
        status: riskInfo.description,
        location: `${aqiData.city}, ${aqiData.country}`,
        mainPollutant: 'PM2.5', // Primary pollutant from IQAir
      });
    } catch (error) {
      if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
        console.error('Error checking for AQI alert:', error);
      }
    }
  }

  static async initializeNotifications(): Promise<boolean> {
    return await this.notificationService.initialize();
  }

  static async sendTestNotification(): Promise<boolean> {
    return await this.notificationService.sendTestNotification();
  }

  static async getNotificationPermissionStatus(): Promise<string> {
    return await this.notificationService.getPermissionStatus();
  }
}
