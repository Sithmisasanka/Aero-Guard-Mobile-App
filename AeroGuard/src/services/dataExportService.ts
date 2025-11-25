import { Alert, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationContextService } from './locationContextService';

export interface AQIDataPoint {
  timestamp: Date;
  aqi: number;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  level: string;
  healthRecommendation: string;
  weather?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'summary';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeWeather: boolean;
  includeRecommendations: boolean;
  includeLocation: boolean;
}

class DataExportService {
  private static instance: DataExportService;

  static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  /**
   * Export 7-day AQI data as CSV
   */
  async export7DayCSV(): Promise<void> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const data = await this.generateMock7DayData(startDate, endDate);
      const csvContent = this.generateCSV(data, {
        format: 'csv',
        dateRange: { start: startDate, end: endDate },
        includeWeather: true,
        includeRecommendations: false,
        includeLocation: true,
      });

      await this.shareData(csvContent, '7-Day AQI Report.csv', 'text/csv');
    } catch (error) {
      console.error('Failed to export 7-day CSV:', error);
      Alert.alert('Export Failed', 'Unable to export data. Please try again.');
    }
  }

  /**
   * Export historical data in specified format
   */
  async exportHistoricalData(options: ExportOptions): Promise<void> {
    try {
      const data = await this.generateMockHistoricalData(options);
      
      let content: string;
      let filename: string;
      let mimeType = 'text/plain';

      switch (options.format) {
        case 'csv':
          content = this.generateCSV(data, options);
          filename = `AQI-Report-${this.formatDateForFilename(options.dateRange.start)}-to-${this.formatDateForFilename(options.dateRange.end)}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          content = this.generateJSON(data, options);
          filename = `AQI-Report-${this.formatDateForFilename(options.dateRange.start)}-to-${this.formatDateForFilename(options.dateRange.end)}.json`;
          mimeType = 'application/json';
          break;
        case 'summary':
          content = this.generateSummaryReport(data, options);
          filename = `AQI-Summary-${this.formatDateForFilename(options.dateRange.start)}-to-${this.formatDateForFilename(options.dateRange.end)}.txt`;
          mimeType = 'text/plain';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      await this.shareData(content, filename, mimeType);
    } catch (error) {
      console.error('Failed to export historical data:', error);
      Alert.alert('Export Failed', 'Unable to export data. Please try again.');
    }
  }

  /**
   * Generate CSV content from data
   */
  private generateCSV(data: AQIDataPoint[], options: ExportOptions): string {
    const headers = ['Date', 'Time', 'AQI', 'Level'];
    
    if (options.includeLocation) {
      headers.push('Location', 'Latitude', 'Longitude');
    }
    
    if (options.includeWeather) {
      headers.push('Temperature (°C)', 'Humidity (%)', 'Wind Speed (km/h)');
    }
    
    if (options.includeRecommendations) {
      headers.push('Health Recommendation');
    }

    let csvContent = headers.join(',') + '\n';

    data.forEach(point => {
      const row = [
        point.timestamp.toLocaleDateString(),
        point.timestamp.toLocaleTimeString(),
        point.aqi.toString(),
        `"${point.level}"`,
      ];

      if (options.includeLocation) {
        row.push(
          `"${point.location}"`,
          point.coordinates.latitude.toString(),
          point.coordinates.longitude.toString(),
        );
      }

      if (options.includeWeather && point.weather) {
        row.push(
          point.weather.temperature.toString(),
          point.weather.humidity.toString(),
          point.weather.windSpeed.toString(),
        );
      }

      if (options.includeRecommendations) {
        row.push(`"${point.healthRecommendation}"`);
      }

      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  }

  /**
   * Generate JSON content from data
   */
  private generateJSON(data: AQIDataPoint[], options: ExportOptions): string {
    const exportData = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: options.dateRange.start.toISOString(),
          end: options.dateRange.end.toISOString(),
        },
        totalDataPoints: data.length,
        format: 'json',
        includeWeather: options.includeWeather,
        includeRecommendations: options.includeRecommendations,
        includeLocation: options.includeLocation,
      },
      data: data.map(point => ({
        timestamp: point.timestamp.toISOString(),
        aqi: point.aqi,
        level: point.level,
        ...(options.includeLocation && {
          location: point.location,
          coordinates: point.coordinates,
        }),
        ...(options.includeWeather && point.weather && {
          weather: point.weather,
        }),
        ...(options.includeRecommendations && {
          healthRecommendation: point.healthRecommendation,
        }),
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate summary report
   */
  private generateSummaryReport(data: AQIDataPoint[], options: ExportOptions): string {
    if (data.length === 0) {
      return 'No data available for the selected period.';
    }

    const aqiValues = data.map(d => d.aqi);
    const avgAQI = Math.round(aqiValues.reduce((sum, aqi) => sum + aqi, 0) / aqiValues.length);
    const minAQI = Math.min(...aqiValues);
    const maxAQI = Math.max(...aqiValues);

    // Count days by AQI level
    const levelCounts = data.reduce((counts, point) => {
      counts[point.level] = (counts[point.level] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    let report = `AQI Summary Report\n`;
    report += `=====================\n\n`;
    report += `Report Period: ${options.dateRange.start.toLocaleDateString()} to ${options.dateRange.end.toLocaleDateString()}\n`;
    report += `Total Data Points: ${data.length}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    report += `Statistics:\n`;
    report += `-----------\n`;
    report += `Average AQI: ${avgAQI} (${this.getAQILevel(avgAQI)})\n`;
    report += `Best Day: ${minAQI} (${this.getAQILevel(minAQI)})\n`;
    report += `Worst Day: ${maxAQI} (${this.getAQILevel(maxAQI)})\n\n`;

    report += `Air Quality Distribution:\n`;
    report += `-------------------------\n`;
    Object.entries(levelCounts).forEach(([level, count]) => {
      const percentage = Math.round((count / data.length) * 100);
      report += `${level}: ${count} readings (${percentage}%)\n`;
    });

    if (options.includeLocation && data.length > 0) {
      report += `\nLocation: ${data[0].location}\n`;
    }

    report += `\nHealth Insights:\n`;
    report += `----------------\n`;
    if (avgAQI <= 50) {
      report += `Excellent air quality period! Great time for outdoor activities.\n`;
    } else if (avgAQI <= 100) {
      report += `Generally good air quality. Suitable for most outdoor activities.\n`;
    } else if (avgAQI <= 150) {
      report += `Moderate air quality. Sensitive individuals should be cautious.\n`;
    } else {
      report += `Poor air quality period. Limit outdoor exposure when possible.\n`;
    }

    report += `\n---\nGenerated by AeroGuard - Your Air Quality Companion`;

    return report;
  }

  /**
   * Generate mock 7-day data
   */
  private async generateMock7DayData(startDate: Date, endDate: Date): Promise<AQIDataPoint[]> {
    const data: AQIDataPoint[] = [];
    const locationContext = await locationContextService.getLocationContext();
    
    const location = locationContext?.address || 'Unknown Location';
    const coordinates = locationContext?.coordinates || { latitude: 6.9271, longitude: 79.8612 };

    // Generate hourly data for 7 days
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const aqi = this.generateRealisticAQI(currentDate);
      const level = this.getAQILevel(aqi);

      data.push({
        timestamp: new Date(currentDate),
        aqi,
        location,
        coordinates,
        level,
        healthRecommendation: this.getHealthRecommendation(aqi),
        weather: {
          temperature: Math.round(25 + Math.random() * 10), // 25-35°C
          humidity: Math.round(60 + Math.random() * 30), // 60-90%
          windSpeed: Math.round(5 + Math.random() * 15), // 5-20 km/h
        },
      });

      currentDate.setHours(currentDate.getHours() + 1);
    }

    return data;
  }

  /**
   * Generate mock historical data
   */
  private async generateMockHistoricalData(options: ExportOptions): Promise<AQIDataPoint[]> {
    return this.generateMock7DayData(options.dateRange.start, options.dateRange.end);
  }

  /**
   * Generate realistic AQI values with daily patterns
   */
  private generateRealisticAQI(date: Date): number {
    const hour = date.getHours();
    const baseAQI = 80;
    
    // Rush hour spikes
    let modifier = 0;
    if (hour >= 7 && hour <= 9) modifier = 20; // Morning rush
    if (hour >= 17 && hour <= 19) modifier = 25; // Evening rush
    if (hour >= 22 || hour <= 5) modifier = -15; // Night time lower
    
    // Add random variation
    modifier += (Math.random() - 0.5) * 30;
    
    return Math.max(15, Math.min(200, baseAQI + modifier));
  }

  /**
   * Get AQI level label
   */
  private getAQILevel(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  /**
   * Get health recommendation
   */
  private getHealthRecommendation(aqi: number): string {
    if (aqi <= 50) return 'Great for outdoor activities';
    if (aqi <= 100) return 'Good for most people';
    if (aqi <= 150) return 'Sensitive groups should be cautious';
    if (aqi <= 200) return 'Everyone should limit outdoor exposure';
    if (aqi <= 300) return 'Stay indoors recommended';
    return 'Health emergency - avoid outdoor exposure';
  }

  /**
   * Format date for filename
   */
  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Share data using React Native's Share API
   */
  private async shareData(content: string, filename: string, mimeType: string): Promise<void> {
    try {
      await Share.share({
        message: content,
        title: filename,
      }, {
        dialogTitle: `Export: ${filename}`,
        subject: filename,
      });
    } catch (error) {
      console.error('Failed to share data:', error);
      throw error;
    }
  }

  /**
   * Show export options dialog
   */
  showExportDialog(): void {
    Alert.alert(
      'Export Air Quality Data',
      'Choose export format:',
      [
        {
          text: '7-Day CSV Report',
          onPress: () => this.export7DayCSV(),
        },
        {
          text: '7-Day Summary',
          onPress: () => this.exportHistoricalData({
            format: 'summary',
            dateRange: {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: new Date(),
            },
            includeWeather: true,
            includeRecommendations: true,
            includeLocation: true,
          }),
        },
        {
          text: '7-Day JSON Data',
          onPress: () => this.exportHistoricalData({
            format: 'json',
            dateRange: {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: new Date(),
            },
            includeWeather: true,
            includeRecommendations: true,
            includeLocation: true,
          }),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Export current AQI reading
   */
  async exportCurrentReading(aqi: number): Promise<void> {
    try {
      const locationContext = await locationContextService.getLocationContext();
      
      const data: AQIDataPoint = {
        timestamp: new Date(),
        aqi,
        location: locationContext?.address || 'Unknown Location',
        coordinates: locationContext?.coordinates || { latitude: 6.9271, longitude: 79.8612 },
        level: this.getAQILevel(aqi),
        healthRecommendation: this.getHealthRecommendation(aqi),
        weather: locationContext?.weatherCorrelation ? {
          temperature: locationContext.weatherCorrelation.temperature,
          humidity: locationContext.weatherCorrelation.humidity,
          windSpeed: locationContext.weatherCorrelation.windSpeed,
        } : undefined,
      };

      const content = this.generateJSON([data], {
        format: 'json',
        dateRange: { start: new Date(), end: new Date() },
        includeWeather: true,
        includeRecommendations: true,
        includeLocation: true,
      });

      await this.shareData(
        content, 
        `AQI-Reading-${this.formatDateForFilename(new Date())}.json`,
        'application/json'
      );
    } catch (error) {
      console.error('Failed to export current reading:', error);
      Alert.alert('Export Failed', 'Unable to export current reading.');
    }
  }
}

export const dataExportService = DataExportService.getInstance();