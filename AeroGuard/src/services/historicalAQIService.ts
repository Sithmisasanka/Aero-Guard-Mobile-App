import { AQICNService } from './aqicnService';
import { 
  ProcessedHistoricalData, 
  AQIInsights, 
  WeeklyAQIReport 
} from '../types/aqicnTypes';
import { AQI_LEVELS } from '../config/aqicnConfig';

export class HistoricalAQIService {
  private static cache = new Map<string, { data: WeeklyAQIReport; expiry: number }>();
  private static readonly CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

  /**
   * Generate comprehensive weekly AQI report
   */
  static async generateWeeklyReport(
    latitude: number,
    longitude: number,
    locationName?: string
  ): Promise<WeeklyAQIReport | null> {
    const cacheKey = `weekly_report_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get 7-day historical data
      const historicalData = await AQICNService.getWeeklyHistoricalData(latitude, longitude);
      
      if (historicalData.length === 0) {
        console.warn('No historical data available for the location, check AQICN API configuration');
        
        // Return mock data if enabled
        if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
          console.log('Generating mock historical data for demonstration');
          return this.generateMockWeeklyReport(latitude, longitude, locationName || 'Current Location');
        }
        
        return null;
      }

      // Get current data for location name if not provided
      let finalLocationName = locationName;
      if (!finalLocationName) {
        try {
          const currentData = await AQICNService.getCurrentAQI(latitude, longitude);
          finalLocationName = currentData?.data?.city?.name || 'Current Location';
        } catch {
          finalLocationName = 'Current Location';
        }
      }

      // Generate insights
      const insights = this.generateInsights(historicalData);

      // Create report
      const report: WeeklyAQIReport = {
        locationName: finalLocationName,
        coordinates: { latitude, longitude },
        reportPeriod: {
          startDate: historicalData[0]?.date || '',
          endDate: historicalData[historicalData.length - 1]?.date || ''
        },
        dailyData: historicalData,
        insights,
        lastUpdated: new Date().toISOString(),
        dataSource: 'AQICN'
      };

      // Cache the report
      this.setCache(cacheKey, report);
      return report;

    } catch (error) {
      console.warn('Error generating weekly report:', error);
      
      // Return mock data as fallback if logging is enabled
      if (process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true') {
        console.log('Returning mock data due to API error');
        return this.generateMockWeeklyReport(latitude, longitude, locationName || 'Current Location');
      }
      
      return null;
    }
  }

  /**
   * Generate insights from historical data
   */
  private static generateInsights(data: ProcessedHistoricalData[]): AQIInsights {
    if (data.length === 0) {
      return this.getEmptyInsights();
    }

    const validData = data.filter(d => d.aqi > 0);
    const aqiValues = validData.map(d => d.aqi);
    
    // Calculate weekly average
    const weeklyAverage = Math.round(
      aqiValues.reduce((sum, aqi) => sum + aqi, 0) / aqiValues.length
    );

    // Calculate trend
    const { trend, trendPercentage } = this.calculateTrend(aqiValues);

    // Find best and worst days
    const sortedByAQI = [...validData].sort((a, b) => a.aqi - b.aqi);
    const bestDay = {
      date: sortedByAQI[0].date,
      aqi: sortedByAQI[0].aqi
    };
    const worstDay = {
      date: sortedByAQI[sortedByAQI.length - 1].date,
      aqi: sortedByAQI[sortedByAQI.length - 1].aqi
    };

    // Count health impact days
    const healthyDaysCount = validData.filter(d => d.aqi <= 50).length;
    const moderateDaysCount = validData.filter(d => d.aqi > 50 && d.aqi <= 100).length;
    const unhealthyDaysCount = validData.filter(d => d.aqi > 100).length;

    // Determine dominant pollutant
    const dominantPollutant = this.getDominantPollutant(validData);

    // Get pollutant breakdown
    const pollutantBreakdown = this.getPollutantBreakdown(validData);

    return {
      weeklyAverage,
      trend,
      trendPercentage,
      bestDay,
      worstDay,
      dominantPollutant,
      healthyDaysCount,
      moderateDaysCount,
      unhealthyDaysCount,
      pollutantBreakdown
    };
  }

  /**
   * Calculate trend from AQI values
   */
  private static calculateTrend(aqiValues: number[]): { 
    trend: 'improving' | 'worsening' | 'stable'; 
    trendPercentage: number 
  } {
    if (aqiValues.length < 2) {
      return { trend: 'stable', trendPercentage: 0 };
    }

    const halfLength = Math.ceil(aqiValues.length / 2);
    const firstHalf = aqiValues.slice(0, halfLength);
    const secondHalf = aqiValues.slice(-halfLength);

    const firstAvg = firstHalf.reduce((sum, aqi) => sum + aqi, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, aqi) => sum + aqi, 0) / secondHalf.length;

    const percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    const trendPercentage = Math.abs(Math.round(percentageChange));

    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (Math.abs(percentageChange) > 10) {
      trend = percentageChange > 0 ? 'worsening' : 'improving';
    }

    return { trend, trendPercentage };
  }

  /**
   * Determine dominant pollutant from historical data
   */
  private static getDominantPollutant(data: ProcessedHistoricalData[]): string {
    const pollutantCounts: { [key: string]: number } = {
      pm25: 0,
      pm10: 0,
      o3: 0,
      no2: 0,
      so2: 0,
      co: 0
    };

    // Count which pollutant has the highest average values
    data.forEach(day => {
      let maxPollutant = 'pm25';
      let maxValue = day.pm25 || 0;

      if ((day.pm10 || 0) > maxValue) {
        maxPollutant = 'pm10';
        maxValue = day.pm10 || 0;
      }
      if ((day.o3 || 0) > maxValue) {
        maxPollutant = 'o3';
        maxValue = day.o3 || 0;
      }
      if ((day.no2 || 0) > maxValue) {
        maxPollutant = 'no2';
        maxValue = day.no2 || 0;
      }
      if ((day.so2 || 0) > maxValue) {
        maxPollutant = 'so2';
        maxValue = day.so2 || 0;
      }
      if ((day.co || 0) > maxValue) {
        maxPollutant = 'co';
      }

      pollutantCounts[maxPollutant]++;
    });

    // Return the most frequent dominant pollutant
    return Object.entries(pollutantCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  /**
   * Get pollutant breakdown
   */
  private static getPollutantBreakdown(data: ProcessedHistoricalData[]) {
    return {
      pm25: data.map(d => d.pm25 || 0).filter(v => v > 0),
      pm10: data.map(d => d.pm10 || 0).filter(v => v > 0),
      o3: data.map(d => d.o3 || 0).filter(v => v > 0),
      no2: data.map(d => d.no2 || 0).filter(v => v > 0)
    };
  }

  /**
   * Get AQI level information
   */
  static getAQILevel(aqi: number) {
    for (const [level, info] of Object.entries(AQI_LEVELS)) {
      const levelInfo = info as { min: number; max: number; color: string; label: string };
      if (aqi >= levelInfo.min && aqi <= levelInfo.max) {
        return { level, ...levelInfo };
      }
    }
    return { level: 'UNKNOWN', min: 0, max: 0, color: '#808080', label: 'Unknown' };
  }

  /**
   * Get empty insights structure
   */
  private static getEmptyInsights(): AQIInsights {
    return {
      weeklyAverage: 0,
      trend: 'stable',
      trendPercentage: 0,
      bestDay: { date: '', aqi: 0 },
      worstDay: { date: '', aqi: 0 },
      dominantPollutant: 'pm25',
      healthyDaysCount: 0,
      moderateDaysCount: 0,
      unhealthyDaysCount: 0,
      pollutantBreakdown: {
        pm25: [],
        pm10: [],
        o3: [],
        no2: []
      }
    };
  }

  /**
   * Cache management
   */
  private static getFromCache(key: string): WeeklyAQIReport | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private static setCache(key: string, data: WeeklyAQIReport): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL
    });
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate mock data for testing
   * Uses date-based seed for consistent values per date
   */
  static generateMockWeeklyReport(
    latitude: number,
    longitude: number,
    locationName: string = 'Test Location'
  ): WeeklyAQIReport {
    const mockData: ProcessedHistoricalData[] = [];
    const today = new Date();
    
    // Base AQI for Sri Lanka context - typically good to moderate
    const baseAQI = 65;
    const maxVariation = 30;

    // Generate 7 days of mock data with consistent date-based values
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Create date-based seed for consistent values
      const dateSeed = dateString.split('-').reduce((sum, part) => sum + parseInt(part), 0);
      
      // Weekend adjustment (less traffic = better air quality)
      const dayOfWeek = date.getDay();
      const weekendBonus = (dayOfWeek === 0 || dayOfWeek === 6) ? -8 : 0;
      
      // Generate consistent AQI based on date seed
      const variation = (dateSeed % maxVariation) - (maxVariation / 2);
      let aqi = baseAQI + variation + weekendBonus;
      
      // Ensure realistic bounds for Sri Lanka (25-130)
      aqi = Math.max(25, Math.min(130, Math.round(aqi)));
      
      // Generate consistent pollutant values based on AQI
      const pm25 = Math.round(aqi * 0.6 + (dateSeed % 20));
      const pm10 = Math.round(aqi * 0.8 + (dateSeed % 25));
      const o3 = Math.round(aqi * 0.4 + (dateSeed % 15));
      const no2 = Math.round(aqi * 0.3 + (dateSeed % 12));
      
      // Determine dominant pollutant based on highest value
      let dominentpol = 'pm25';
      if (pm10 > pm25 && pm10 > o3) dominentpol = 'pm10';
      else if (o3 > pm25 && o3 > pm10) dominentpol = 'o3';
      
      mockData.push({
        date: dateString,
        aqi: aqi,
        pm25: pm25,
        pm10: pm10,
        o3: o3,
        no2: no2,
        dominentpol: dominentpol
      });
    }

    console.log('📊 Generated consistent mock data for', locationName);
    console.log('AQI values:', mockData.map(d => `${d.date}: ${d.aqi}`).join(', '));

    return {
      locationName,
      coordinates: { latitude, longitude },
      reportPeriod: {
        startDate: mockData[0].date,
        endDate: mockData[mockData.length - 1].date
      },
      dailyData: mockData,
      insights: this.generateInsights(mockData),
      lastUpdated: new Date().toISOString(),
      dataSource: 'AQICN_MOCK'
    };
  }
}