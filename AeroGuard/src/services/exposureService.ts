import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AQIData } from '../types';
import { AQIService } from './aqiService';

export interface ExposureLogEntry {
  timestamp: string;
  latitude: number;
  longitude: number;
  aqi: number;
  city?: string;
}

const EXPOSURE_LOG_KEY = 'exposure_log';

class ExposureService {
  static async logCurrentExposure() {
    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get AQI for current location
      const aqiData: AQIData | null = await AQIService.getCurrentAQI(latitude, longitude);
      const entry: ExposureLogEntry = {
        timestamp: new Date().toISOString(),
        latitude,
        longitude,
        aqi: aqiData?.aqi ?? -1,
        city: aqiData?.city,
      };

      // Save to AsyncStorage
      const logRaw = await AsyncStorage.getItem(EXPOSURE_LOG_KEY);
      const log: ExposureLogEntry[] = logRaw ? JSON.parse(logRaw) : [];
      log.push(entry);
      await AsyncStorage.setItem(EXPOSURE_LOG_KEY, JSON.stringify(log));
      return entry;
    } catch (error) {
      console.error('Error logging exposure:', error);
      return null;
    }
  }

  static async getTodayExposureSummary() {
    try {
      const logRaw = await AsyncStorage.getItem(EXPOSURE_LOG_KEY);
      const log: ExposureLogEntry[] = logRaw ? JSON.parse(logRaw) : [];
      const today = new Date().toISOString().slice(0, 10);
      const todayEntries = log.filter(e => e.timestamp.startsWith(today));
      if (todayEntries.length === 0) return null;
      const avgAQI = todayEntries.reduce((sum, e) => sum + (e.aqi > 0 ? e.aqi : 0), 0) / todayEntries.length;
      return {
        count: todayEntries.length,
        avgAQI: Math.round(avgAQI),
        maxAQI: Math.max(...todayEntries.map(e => e.aqi)),
        minAQI: Math.min(...todayEntries.map(e => e.aqi)),
        entries: todayEntries,
      };
    } catch (error) {
      console.error('Error summarizing exposure:', error);
      return null;
    }
  }

  static async clearExposureLog() {
    await AsyncStorage.removeItem(EXPOSURE_LOG_KEY);
  }
}

export default ExposureService;
