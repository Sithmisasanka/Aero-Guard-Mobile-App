import { Alert, Share, Platform } from 'react-native';
import { locationContextService } from './locationContextService';

export interface ShareData {
  aqi: number;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  healthRecommendation: string;
  weatherData?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
}

export interface ShareOptions {
  includeLocation: boolean;
  includeWeather: boolean;
  includeRecommendation: boolean;
  includeTimestamp: boolean;
  includeHashtags: boolean;
}

class QuickShareService {
  private static instance: QuickShareService;

  static getInstance(): QuickShareService {
    if (!QuickShareService.instance) {
      QuickShareService.instance = new QuickShareService();
    }
    return QuickShareService.instance;
  }

  /**
   * Share AQI data as text using React Native's built-in Share API
   */
  async shareAQIText(data: ShareData, options: ShareOptions = this.getDefaultOptions()): Promise<void> {
    try {
      const shareText = this.generateShareText(data, options);
      
      const result = await Share.share({
        message: shareText,
        title: 'Air Quality Report - AeroGuard',
      }, {
        dialogTitle: 'Share Air Quality Report',
        subject: `Air Quality Report - ${data.location}`,
      });

      if (result.action === Share.sharedAction) {
        console.log('AQI data shared successfully');
      }
    } catch (error) {
      console.error('Failed to share AQI text:', error);
      Alert.alert('Share Failed', 'Unable to share air quality data. Please try again.');
    }
  }

  /**
   * Quick share with current location context
   */
  async quickShareCurrent(aqi: number, options: ShareOptions = this.getDefaultOptions()): Promise<void> {
    try {
      const locationContext = await locationContextService.getLocationContext();
      
      const shareData: ShareData = {
        aqi,
        location: locationContext?.address || 'Unknown Location',
        coordinates: locationContext?.coordinates || { latitude: 0, longitude: 0 },
        timestamp: new Date(),
        healthRecommendation: this.getHealthRecommendation(aqi),
        weatherData: locationContext?.weatherCorrelation ? {
          temperature: locationContext.weatherCorrelation.temperature,
          humidity: locationContext.weatherCorrelation.humidity,
          windSpeed: locationContext.weatherCorrelation.windSpeed,
        } : undefined,
      };

      await this.shareAQIText(shareData, options);
    } catch (error) {
      console.error('Failed to quick share current AQI:', error);
      Alert.alert('Share Failed', 'Unable to share current air quality data. Please try again.');
    }
  }

  /**
   * Share AQI alert (for urgent situations)
   */
  async shareAQIAlert(aqi: number, location: string, alertType: 'spike' | 'hazardous' | 'improvement'): Promise<void> {
    try {
      const level = this.getAQILevel(aqi);
      let alertText = '';

      switch (alertType) {
        case 'spike':
          alertText = `🚨 AIR QUALITY SPIKE ALERT!\n\n`;
          break;
        case 'hazardous':
          alertText = `⚠️ HAZARDOUS AIR QUALITY WARNING!\n\n`;
          break;
        case 'improvement':
          alertText = `✅ AIR QUALITY IMPROVEMENT!\n\n`;
          break;
      }

      alertText += `${level.emoji} Current AQI: ${aqi} (${level.label})\n`;
      alertText += `📍 Location: ${location}\n`;
      alertText += `🕐 ${new Date().toLocaleString()}\n\n`;
      alertText += `💡 ${this.getHealthRecommendation(aqi)}\n\n`;
      alertText += `📱 Stay informed with AeroGuard\n`;
      alertText += `#AirQualityAlert #Health #Safety`;

      await Share.share({
        message: alertText,
        title: 'Air Quality Alert - AeroGuard',
      });
    } catch (error) {
      console.error('Failed to share AQI alert:', error);
    }
  }

  /**
   * Generate comprehensive shareable text content
   */
  private generateShareText(data: ShareData, options: ShareOptions): string {
    const { aqi, location, timestamp, healthRecommendation, weatherData } = data;
    const level = this.getAQILevel(aqi);
    
    let text = `🌍 Air Quality Report\n\n`;
    text += `${level.emoji} AQI: ${aqi} (${level.label})\n`;
    
    if (options.includeLocation) {
      text += `📍 Location: ${location}\n`;
    }
    
    if (options.includeTimestamp) {
      text += `🕐 Time: ${timestamp.toLocaleString()}\n`;
    }
    
    if (options.includeWeather && weatherData) {
      text += `\n🌤️ Weather Conditions:\n`;
      text += `• Temperature: ${weatherData.temperature}°C\n`;
      text += `• Humidity: ${weatherData.humidity}%\n`;
      text += `• Wind Speed: ${weatherData.windSpeed} km/h\n`;
    }
    
    if (options.includeRecommendation) {
      text += `\n💡 Health Recommendation:\n${healthRecommendation}\n`;
    }
    
    text += `\n📱 Shared via AeroGuard - Your Air Quality Companion\n`;
    text += `Download: [App Store/Play Store Link]`;
    
    if (options.includeHashtags) {
      text += `\n\n#AirQuality #HealthTech #AeroGuard #Environment #Health`;
    }
    
    return text;
  }

  /**
   * Generate short social media text (Twitter-friendly)
   */
  generateSocialText(data: ShareData): string {
    const { aqi, location } = data;
    const level = this.getAQILevel(aqi);
    
    let text = `${level.emoji} Air Quality Update\n`;
    text += `AQI: ${aqi} (${level.label})\n`;
    text += `📍 ${location}\n`;
    text += `${this.getShortRecommendation(aqi)}\n`;
    text += `#AirQuality #Health #AeroGuard`;
    
    return text;
  }

  /**
   * Share weekly air quality summary
   */
  async shareWeeklySummary(weeklyData: { average: number; best: number; worst: number; location: string }): Promise<void> {
    try {
      const bestLevel = this.getAQILevel(weeklyData.best);
      const worstLevel = this.getAQILevel(weeklyData.worst);
      const avgLevel = this.getAQILevel(weeklyData.average);

      let text = `📊 Weekly Air Quality Summary\n\n`;
      text += `📍 ${weeklyData.location}\n`;
      text += `📅 ${new Date().toLocaleDateString()}\n\n`;
      text += `📈 Average AQI: ${weeklyData.average} (${avgLevel.label})\n`;
      text += `${bestLevel.emoji} Best Day: ${weeklyData.best} (${bestLevel.label})\n`;
      text += `${worstLevel.emoji} Worst Day: ${weeklyData.worst} (${worstLevel.label})\n\n`;
      text += `💡 Keep tracking your air quality with AeroGuard!\n\n`;
      text += `#WeeklyReport #AirQuality #Health #AeroGuard`;

      await Share.share({
        message: text,
        title: 'Weekly Air Quality Summary - AeroGuard',
      });
    } catch (error) {
      console.error('Failed to share weekly summary:', error);
      Alert.alert('Share Failed', 'Unable to share weekly summary.');
    }
  }

  /**
   * Share health tips related to current AQI
   */
  async shareHealthTip(aqi: number): Promise<void> {
    try {
      const level = this.getAQILevel(aqi);
      const tip = this.getDetailedHealthTip(aqi);

      let text = `💡 Air Quality Health Tip\n\n`;
      text += `${level.emoji} Current AQI: ${aqi} (${level.label})\n\n`;
      text += `🏥 Health Tip:\n${tip}\n\n`;
      text += `📱 Get more health tips with AeroGuard\n`;
      text += `#HealthTips #AirQuality #Wellness #AeroGuard`;

      await Share.share({
        message: text,
        title: 'Air Quality Health Tip - AeroGuard',
      });
    } catch (error) {
      console.error('Failed to share health tip:', error);
    }
  }

  /**
   * Get AQI level information with colors and emojis
   */
  private getAQILevel(aqi: number): { label: string; emoji: string; color: string } {
    if (aqi <= 50) return { label: 'Good', emoji: '✅', color: '#00E400' };
    if (aqi <= 100) return { label: 'Moderate', emoji: '⚠️', color: '#FFFF00' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', emoji: '🟠', color: '#FF7E00' };
    if (aqi <= 200) return { label: 'Unhealthy', emoji: '🔴', color: '#FF0000' };
    if (aqi <= 300) return { label: 'Very Unhealthy', emoji: '🟣', color: '#8F3F97' };
    return { label: 'Hazardous', emoji: '💀', color: '#7E0023' };
  }

  /**
   * Get health recommendation based on AQI
   */
  private getHealthRecommendation(aqi: number): string {
    if (aqi <= 50) return 'Perfect time for outdoor activities! Air quality is excellent for everyone.';
    if (aqi <= 100) return 'Good time for outdoor activities. Sensitive individuals should be aware but can generally enjoy outdoor activities.';
    if (aqi <= 150) return 'Sensitive individuals (children, elderly, people with respiratory conditions) should limit prolonged outdoor exposure.';
    if (aqi <= 200) return 'Everyone should reduce outdoor activities, especially sensitive groups. Consider wearing a mask outdoors.';
    if (aqi <= 300) return 'Avoid outdoor activities. Stay indoors with windows closed. Use air purifiers if available.';
    return 'Health emergency conditions. Everyone should avoid outdoor exposure. Stay indoors and seek medical advice if experiencing symptoms.';
  }

  /**
   * Get short recommendation for social media
   */
  private getShortRecommendation(aqi: number): string {
    if (aqi <= 50) return 'Great for outdoor activities!';
    if (aqi <= 100) return 'Generally good for most people';
    if (aqi <= 150) return 'Sensitive groups should be cautious';
    if (aqi <= 200) return 'Limit outdoor exposure';
    if (aqi <= 300) return 'Stay indoors recommended';
    return 'Health emergency - stay indoors!';
  }

  /**
   * Get detailed health tip based on AQI level
   */
  private getDetailedHealthTip(aqi: number): string {
    if (aqi <= 50) {
      return 'Perfect air quality! Take advantage by exercising outdoors, opening windows for fresh air, and enjoying nature activities.';
    }
    if (aqi <= 100) {
      return 'Good air quality with minor concerns for very sensitive individuals. A great time for most outdoor activities and sports.';
    }
    if (aqi <= 150) {
      return 'If you have asthma, heart disease, or are elderly/young, consider reducing prolonged outdoor exertion. Everyone else can continue normal activities.';
    }
    if (aqi <= 200) {
      return 'Avoid prolonged outdoor exertion. If you must go outside, consider wearing an N95 mask. Keep windows closed and use air conditioning.';
    }
    if (aqi <= 300) {
      return 'Everyone should avoid outdoor activities. Use air purifiers indoors, keep windows closed, and postpone outdoor exercise until air quality improves.';
    }
    return 'Emergency conditions! Stay indoors, avoid any outdoor exposure, use air purifiers, and seek medical attention if experiencing breathing difficulties.';
  }

  /**
   * Get default sharing options
   */
  private getDefaultOptions(): ShareOptions {
    return {
      includeLocation: true,
      includeWeather: true,
      includeRecommendation: true,
      includeTimestamp: true,
      includeHashtags: true,
    };
  }

  /**
   * Show share options dialog
   */
  showShareOptionsDialog(data: ShareData): void {
    Alert.alert(
      'Share Air Quality Data',
      'Choose sharing format:',
      [
        {
          text: 'Full Report',
          onPress: () => this.shareAQIText(data, this.getDefaultOptions()),
        },
        {
          text: 'Social Media Post',
          onPress: () => Share.share({
            message: this.generateSocialText(data),
            title: 'Air Quality Update',
          }),
        },
        {
          text: 'Health Tip',
          onPress: () => this.shareHealthTip(data.aqi),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Check if sharing is available
   */
  isSharingAvailable(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }
}

export const quickShareService = QuickShareService.getInstance();