import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface AQINotificationData {
  aqi: number;
  status: string;
  location: string;
  mainPollutant: string;
  timestamp: string;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private pushToken: string | null = null;
  private lastNotificationTime: number = 0;
  private readonly NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return false;
      }

      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get push token
      this.pushToken = await this.getPushToken();
      
      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('air-quality-alerts', {
          name: 'Air Quality Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
          sound: 'default',
        });
      }

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  }

  private async getPushToken(): Promise<string> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      console.log('Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      throw error;
    }
  }

  async checkAndSendAQIAlert(aqiData: {
    aqi: number;
    status: string;
    location?: string;
    mainPollutant?: string;
  }): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Get user health profile for personalized alerts
    const userProfile = await this.getUserHealthProfile();
    const adjustedThreshold = this.getPersonalizedThreshold(aqiData.aqi, userProfile);

    // Check if AQI exceeds personalized threshold
    if (aqiData.aqi < adjustedThreshold) {
      return false;
    }

    // Check cooldown to avoid spam
    const now = Date.now();
    if (now - this.lastNotificationTime < this.NOTIFICATION_COOLDOWN) {
      console.log('Notification cooldown active, skipping alert');
      return false;
    }

    // Check if user has disabled notifications for this AQI level
    const userPrefs = await this.getUserNotificationPreferences();
    if (!this.shouldSendNotification(aqiData.aqi, userPrefs)) {
      return false;
    }

    try {
      const { title, body, healthAdvice } = this.generatePersonalizedNotificationContent(aqiData, userProfile);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            aqi: aqiData.aqi,
            status: aqiData.status,
            location: aqiData.location || 'Unknown',
            mainPollutant: aqiData.mainPollutant || 'Multiple',
            timestamp: new Date().toISOString(),
            healthAdvice,
            userHealthConditions: userProfile?.healthConditions?.map((c: any) => c.name) || [],
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });

      this.lastNotificationTime = now;
      console.log(`Personalized AQI alert sent for level ${aqiData.aqi} (threshold: ${adjustedThreshold})`);
      return true;
    } catch (error) {
      console.error('Error sending AQI notification:', error);
      return false;
    }
  }

  private async getUserHealthProfile(): Promise<any> {
    try {
      const profile = await AsyncStorage.getItem('userProfile');
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user health profile:', error);
      return null;
    }
  }

  private getPersonalizedThreshold(aqi: number, userProfile: any): number {
    // Default threshold for general population
    let threshold = 151; // Unhealthy level
    
    if (!userProfile || !userProfile.healthConditions || userProfile.healthConditions.length === 0) {
      return threshold;
    }

    // Check for high-risk health conditions
    const conditions = userProfile.healthConditions.map((c: any) => c.id);
    const hasRespiratoryConditions = conditions.some((c: string) => 
      ['asthma', 'copd', 'respiratoryIssues', 'allergies'].includes(c)
    );
    const hasCardiacConditions = conditions.includes('heartDisease');
    const isVulnerable = conditions.some((c: string) => 
      ['pregnancy', 'elderlyAge', 'childUnder12'].includes(c)
    );

    // Lower threshold for people with health conditions
    if (hasRespiratoryConditions || hasCardiacConditions) {
      threshold = 101; // Unhealthy for Sensitive Groups
    } else if (isVulnerable) {
      threshold = 126; // Between Unhealthy for Sensitive and Unhealthy
    }

    // Consider severity of conditions
    const hasSevereConditions = userProfile.healthConditions.some((c: any) => 
      c.severity === 'severe' && ['asthma', 'copd', 'heartDisease'].includes(c.id)
    );
    
    if (hasSevereConditions) {
      threshold = Math.max(51, threshold - 25); // Even lower threshold for severe conditions
    }

    return threshold;
  }

  private generatePersonalizedNotificationContent(aqiData: {
    aqi: number;
    status: string;
    location?: string;
    mainPollutant?: string;
  }, userProfile: any) {
    const location = aqiData.location || 'your area';
    let title: string;
    let body: string;
    let healthAdvice: string[];

    // Check for specific health conditions
    const conditions = userProfile?.healthConditions?.map((c: any) => c.id) || [];
    const hasRespiratoryConditions = conditions.some((c: string) => 
      ['asthma', 'copd', 'respiratoryIssues', 'allergies'].includes(c)
    );
    const hasCardiacConditions = conditions.includes('heartDisease');
    const isVulnerable = conditions.some((c: string) => 
      ['pregnancy', 'elderlyAge', 'childUnder12'].includes(c)
    );

    if (aqiData.aqi >= 301) {
      // Hazardous
      title = '🚨 EMERGENCY: Hazardous Air Quality';
      if (hasRespiratoryConditions) {
        body = `CRITICAL ALERT: Air quality in ${location} is HAZARDOUS (AQI ${aqiData.aqi}). Your respiratory condition puts you at extreme risk.`;
        healthAdvice = [
          'EMERGENCY: Stay indoors immediately and seal all windows/doors',
          'Have rescue medications and inhaler readily available',
          'Use N95 or P100 masks if you must go outside',
          'Consider emergency medical attention if experiencing symptoms'
        ];
      } else {
        body = `HAZARDOUS air quality in ${location} (AQI ${aqiData.aqi}). Immediate action required.`;
        healthAdvice = [
          'Stay indoors immediately',
          'Seal windows and doors',
          'Avoid all outdoor activities',
          'Use air purifiers if available'
        ];
      }
    } else if (aqiData.aqi >= 201) {
      // Very Unhealthy
      title = '⚠️ URGENT: Very Unhealthy Air Quality';
      if (hasRespiratoryConditions) {
        body = `URGENT: Air quality in ${location} is very unhealthy (AQI ${aqiData.aqi}). Your respiratory condition requires immediate precautions.`;
        healthAdvice = [
          'Stay indoors with windows and doors closed',
          'Keep rescue inhaler or medications accessible',
          'Use air purifiers if available',
          'Avoid all outdoor activities'
        ];
      } else {
        body = `Very unhealthy air quality in ${location} (AQI ${aqiData.aqi}). Everyone should avoid outdoor activities.`;
        healthAdvice = [
          'Stay indoors with windows closed',
          'Avoid outdoor exercise and activities',
          'Use air purifiers if available',
          'Wear N95 mask if going outside is necessary'
        ];
      }
    } else if (aqiData.aqi >= 151) {
      // Unhealthy
      title = '⚠️ Health Alert: Unhealthy Air Quality';
      if (hasRespiratoryConditions) {
        body = `Health Alert: Air quality in ${location} is unhealthy (AQI ${aqiData.aqi}). Your respiratory condition requires extra caution.`;
        healthAdvice = [
          'Avoid outdoor activities and exercise',
          'Stay indoors as much as possible',
          'Keep windows closed and use air conditioning',
          'Have your inhaler or medications ready'
        ];
      } else {
        body = `Unhealthy air quality in ${location} (AQI ${aqiData.aqi}). Limit outdoor exposure.`;
        healthAdvice = [
          'Limit outdoor activities, especially strenuous exercise',
          'Close windows and use air conditioning if available',
          'Consider wearing a mask when outside'
        ];
      }
    } else {
      // Unhealthy for Sensitive Groups (101-150)
      title = '⚠️ Air Quality Alert for Sensitive Individuals';
      if (hasRespiratoryConditions) {
        body = `Air quality alert: AQI in ${location} is ${aqiData.aqi}. Your respiratory condition makes you more sensitive to air pollution.`;
        healthAdvice = [
          'Consider limiting prolonged outdoor activities',
          'Keep rescue medications accessible',
          'Monitor your breathing and symptoms'
        ];
      } else {
        body = `Air quality alert: AQI in ${location} is ${aqiData.aqi}. Sensitive individuals should take precautions.`;
        healthAdvice = [
          'Generally safe for most people',
          'Sensitive individuals should limit prolonged outdoor exertion'
        ];
      }
    }

    return { title, body, healthAdvice };
  }

  private async getUserNotificationPreferences(): Promise<{
    enabled: boolean;
    minAQI: number;
    quietHours?: { start: string; end: string };
  }> {
    try {
      const prefs = await AsyncStorage.getItem('notification_preferences');
      if (prefs) {
        return JSON.parse(prefs);
      }
    } catch (error) {
      console.error('Error getting notification preferences:', error);
    }
    
    // Default preferences
    return {
      enabled: true,
      minAQI: 151, // Only alert for unhealthy and above
    };
  }

  private shouldSendNotification(aqi: number, prefs: any): boolean {
    if (!prefs.enabled) return false;
    if (aqi < prefs.minAQI) return false;
    
    // Check quiet hours if configured
    if (prefs.quietHours) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime >= prefs.quietHours.start && currentTime <= prefs.quietHours.end) {
        return false;
      }
    }
    
    return true;
  }

  async updateNotificationPreferences(prefs: {
    enabled: boolean;
    minAQI: number;
    quietHours?: { start: string; end: string };
  }): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(prefs));
      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  async sendTestNotification(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Air Quality Alert',
          body: 'This is a test notification from AeroGuard. Your notification system is working!',
          data: { test: true },
        },
        trigger: null,
      });
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }
}

export default NotificationService;