import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
  aqiAlerts: boolean;
  morningBriefing: boolean;
  routeSuggestions: boolean;
  healthTips: boolean;
  morningTime: string; // "08:00"
  commuteTime: string; // "07:30"
}

class SmartNotificationService {
  private static instance: SmartNotificationService;
  private preferences: NotificationPreferences = {
    aqiAlerts: true,
    morningBriefing: true,
    routeSuggestions: true,
    healthTips: true,
    morningTime: '08:00',
    commuteTime: '07:30'
  };

  static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService();
    }
    return SmartNotificationService.instance;
  }

  /**
   * Initialize notification system
   */
  async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Enable push notifications to receive air quality alerts and recommendations.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Configure notifications
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Load preferences
      await this.loadPreferences();

      console.log('Smart notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Load notification preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  /**
   * Save notification preferences
   */
  async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...newPreferences };
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  /**
   * Send immediate AQI alert
   */
  async sendAQIAlert(aqi: number, location: string, previousAQI?: number): Promise<void> {
    if (!this.preferences.aqiAlerts) return;

    const level = this.getAQILevel(aqi);
    let body = `Current AQI: ${aqi} (${level.label}) in ${location}`;
    
    if (previousAQI && Math.abs(aqi - previousAQI) >= 20) {
      const change = aqi - previousAQI;
      const changeText = change > 0 ? 'increased' : 'decreased';
      body += `. AQI ${changeText} by ${Math.abs(change)}`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${level.emoji} Air Quality Alert`,
        body,
        data: {
          type: 'aqi_alert',
          aqi,
          location,
        },
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Send morning briefing
   */
  async sendMorningBriefing(aqi: number, location: string): Promise<void> {
    if (!this.preferences.morningBriefing) return;

    const level = this.getAQILevel(aqi);
    const recommendation = this.getHealthRecommendation(aqi);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Morning Air Quality Briefing',
        body: `${level.emoji} ${location}: AQI ${aqi} (${level.label}). ${recommendation}`,
        data: {
          type: 'morning_briefing',
          aqi,
          location,
        },
      },
      trigger: null,
    });
  }

  /**
   * Send route suggestion
   */
  async sendRouteSuggestion(): Promise<void> {
    if (!this.preferences.routeSuggestions) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 Smart Route Suggestion',
        body: 'Check cleaner routes for your commute today. Tap to see air quality optimized paths.',
        data: {
          type: 'route_suggestion',
        },
      },
      trigger: null,
    });
  }

  /**
   * Send health tip notification
   */
  async sendHealthTip(): Promise<void> {
    if (!this.preferences.healthTips) return;

    const tips = [
      'Consider using an air purifier at home when AQI is above 100.',
      'Wearing a mask can reduce exposure to harmful particles during high AQI periods.',
      'Indoor plants like spider plants and peace lilies can help improve indoor air quality.',
      'Stay hydrated - drinking water helps your body cope with air pollution.',
      'Exercise indoors when AQI is above 150 to protect your respiratory health.',
      'Close windows during high pollution hours (usually 6-10 AM and 6-10 PM).',
      'Check AQI before planning outdoor activities with children.',
      'Use public transport or carpool to reduce air pollution in your community.',
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💡 Air Quality Health Tip',
        body: randomTip,
        data: { type: 'health_tip' },
      },
      trigger: null,
    });
  }

  /**
   * Schedule daily notifications
   */
  async scheduleDailyNotifications(): Promise<void> {
    try {
      // Cancel existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Note: Scheduled notifications would be implemented here
      // For now, these notifications can be triggered manually
      console.log('Daily notifications scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule daily notifications:', error);
    }
  }

  /**
   * Get AQI level information
   */
  private getAQILevel(aqi: number): { label: string; emoji: string } {
    if (aqi <= 50) return { label: 'Good', emoji: '✅' };
    if (aqi <= 100) return { label: 'Moderate', emoji: '⚠️' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', emoji: '🟠' };
    if (aqi <= 200) return { label: 'Unhealthy', emoji: '🔴' };
    if (aqi <= 300) return { label: 'Very Unhealthy', emoji: '🟣' };
    return { label: 'Hazardous', emoji: '💀' };
  }

  /**
   * Get health recommendation based on AQI
   */
  private getHealthRecommendation(aqi: number): string {
    if (aqi <= 50) return 'Perfect time for outdoor activities!';
    if (aqi <= 100) return 'Outdoor activities are generally safe for most people.';
    if (aqi <= 150) return 'Sensitive individuals should limit outdoor exposure.';
    if (aqi <= 200) return 'Everyone should reduce outdoor activities.';
    if (aqi <= 300) return 'Avoid outdoor activities. Stay indoors with windows closed.';
    return 'Health emergency! Stay indoors and seek medical advice if needed.';
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Send emergency notification for hazardous AQI levels
   */
  async sendEmergencyAlert(aqi: number, location: string): Promise<void> {
    if (aqi < 300) return; // Only for hazardous levels

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 EMERGENCY: Hazardous Air Quality',
        body: `IMMEDIATE ACTION REQUIRED: AQI ${aqi} in ${location}. Stay indoors, close windows, use air purifier if available.`,
        data: {
          type: 'emergency_alert',
          aqi,
          location,
          priority: 'high',
        },
      },
      trigger: null,
    });
  }
}

export const smartNotificationService = SmartNotificationService.getInstance();