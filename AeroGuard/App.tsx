import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/components/AppNavigator';
import { AQIService } from './src/services/aqiService';

export default function App() {
  useEffect(() => {
    // Initialize notification service on app startup
    const initializeNotifications = async () => {
      try {
        const initialized = await AQIService.initializeNotifications();
        if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
          console.log('Notifications initialized:', initialized);
        }
      } catch (error) {
        if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
          console.error('Failed to initialize notifications:', error);
        }
      }
    };

    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
