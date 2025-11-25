import { LatLng } from 'react-native-maps';

export interface AQIHeatmapPoint {
  coordinate: LatLng;
  aqi: number;
  intensity: number; // 0-1 scale for heatmap
  timestamp: Date;
}

export interface HeatmapConfig {
  radius: number;
  opacity: number;
  maxIntensity: number;
  gradient: { [key: number]: string };
}

export interface TimeFilter {
  hour: number;
  day: number; // 0-6 (Sunday to Saturday)
  month: number; // 1-12
}

class AQIHeatmapService {
  private readonly defaultConfig: HeatmapConfig = {
    radius: 20,
    opacity: 0.6,
    maxIntensity: 150, // Max AQI value for scaling
    gradient: {
      0.0: 'rgba(0, 255, 0, 0)', // Transparent green
      0.2: 'rgba(0, 255, 0, 0.8)', // Green (Good)
      0.4: 'rgba(255, 255, 0, 0.8)', // Yellow (Moderate)
      0.6: 'rgba(255, 165, 0, 0.8)', // Orange (Unhealthy for Sensitive)
      0.8: 'rgba(255, 0, 0, 0.8)', // Red (Unhealthy)
      1.0: 'rgba(128, 0, 128, 0.8)', // Purple (Very Unhealthy)
    },
  };

  /**
   * Generate AQI heatmap data for a given region
   */
  async generateHeatmapData(
    bounds: {
      northeast: LatLng;
      southwest: LatLng;
    },
    gridSize: number = 20,
    timeFilter?: TimeFilter
  ): Promise<AQIHeatmapPoint[]> {
    const heatmapPoints: AQIHeatmapPoint[] = [];
    
    const latStep = (bounds.northeast.latitude - bounds.southwest.latitude) / gridSize;
    const lngStep = (bounds.northeast.longitude - bounds.southwest.longitude) / gridSize;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const lat = bounds.southwest.latitude + (i * latStep);
        const lng = bounds.southwest.longitude + (j * lngStep);
        
        const coordinate = { latitude: lat, longitude: lng };
        const aqi = await this.getAQIForLocation(coordinate, timeFilter);
        
        heatmapPoints.push({
          coordinate,
          aqi,
          intensity: this.normalizeAQI(aqi),
          timestamp: new Date(),
        });
      }
    }

    return heatmapPoints;
  }

  /**
   * Get historical AQI data for time-based filtering
   */
  async getHistoricalAQIData(
    coordinate: LatLng,
    startDate: Date,
    endDate: Date
  ): Promise<{ timestamp: Date; aqi: number }[]> {
    // In a real implementation, this would fetch from a historical AQI database
    // For now, generate mock historical data
    const historicalData: { timestamp: Date; aqi: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const baseAQI = await this.getAQIForLocation(coordinate);
      // Add some temporal variation
      const timeVariation = Math.sin((currentDate.getHours() / 24) * Math.PI * 2) * 10;
      const seasonalVariation = Math.cos((currentDate.getMonth() / 12) * Math.PI * 2) * 5;
      
      historicalData.push({
        timestamp: new Date(currentDate),
        aqi: Math.max(10, Math.min(150, baseAQI + timeVariation + seasonalVariation)),
      });

      currentDate.setHours(currentDate.getHours() + 1);
    }

    return historicalData;
  }

  /**
   * Generate pollution forecast heatmap
   */
  async generateForecastHeatmap(
    bounds: {
      northeast: LatLng;
      southwest: LatLng;
    },
    forecastHours: number = 24,
    gridSize: number = 15
  ): Promise<AQIHeatmapPoint[][]> {
    const forecastMaps: AQIHeatmapPoint[][] = [];

    for (let hour = 0; hour < forecastHours; hour++) {
      const forecastTime = new Date();
      forecastTime.setHours(forecastTime.getHours() + hour);

      const heatmapData = await this.generateHeatmapData(
        bounds,
        gridSize,
        {
          hour: forecastTime.getHours(),
          day: forecastTime.getDay(),
          month: forecastTime.getMonth() + 1,
        }
      );

      forecastMaps.push(heatmapData);
    }

    return forecastMaps;
  }

  /**
   * Get AQI for a specific location with optional time filtering
   */
  private async getAQIForLocation(
    coordinate: LatLng,
    timeFilter?: TimeFilter
  ): Promise<number> {
    // Base AQI calculation based on location
    let baseAQI = 50;

    // Geographic variation (simulate urban vs rural areas)
    const urbanFactor = Math.sin(coordinate.latitude * 50) * Math.cos(coordinate.longitude * 50);
    baseAQI += urbanFactor * 20;

    // Industrial areas simulation
    const industrialFactor = Math.sin(coordinate.latitude * 100) * Math.sin(coordinate.longitude * 100);
    if (industrialFactor > 0.7) {
      baseAQI += 30; // Higher pollution near industrial areas
    }

    // Traffic density simulation
    const trafficFactor = Math.abs(Math.sin(coordinate.latitude * 200)) * Math.abs(Math.cos(coordinate.longitude * 200));
    baseAQI += trafficFactor * 15;

    // Time-based variations
    if (timeFilter) {
      // Rush hour effect (7-9 AM, 5-7 PM)
      if ((timeFilter.hour >= 7 && timeFilter.hour <= 9) || 
          (timeFilter.hour >= 17 && timeFilter.hour <= 19)) {
        baseAQI += 15;
      }

      // Weekend effect (lower pollution)
      if (timeFilter.day === 0 || timeFilter.day === 6) {
        baseAQI -= 10;
      }

      // Seasonal variation
      if (timeFilter.month >= 11 || timeFilter.month <= 2) {
        baseAQI += 10; // Winter pollution
      }
    }

    // Add some randomness
    baseAQI += (Math.random() - 0.5) * 10;

    return Math.max(10, Math.min(150, Math.round(baseAQI)));
  }

  /**
   * Normalize AQI value to 0-1 scale for heatmap intensity
   */
  private normalizeAQI(aqi: number): number {
    return Math.min(1, aqi / this.defaultConfig.maxIntensity);
  }

  /**
   * Get color for AQI value based on EPA standards
   */
  getAQIColor(aqi: number): string {
    if (aqi <= 50) return '#00E400'; // Green (Good)
    if (aqi <= 100) return '#FFFF00'; // Yellow (Moderate)
    if (aqi <= 150) return '#FF7E00'; // Orange (Unhealthy for Sensitive)
    if (aqi <= 200) return '#FF0000'; // Red (Unhealthy)
    if (aqi <= 300) return '#8F3F97'; // Purple (Very Unhealthy)
    return '#7E0023'; // Maroon (Hazardous)
  }

  /**
   * Get AQI category label
   */
  getAQICategory(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  /**
   * Generate heatmap overlay data for react-native-maps
   */
  generateHeatmapOverlay(
    heatmapPoints: AQIHeatmapPoint[],
    config: Partial<HeatmapConfig> = {}
  ): any[] {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    return heatmapPoints.map(point => ({
      coordinate: point.coordinate,
      weight: point.intensity,
      radius: finalConfig.radius,
      opacity: finalConfig.opacity,
      color: this.getAQIColor(point.aqi),
    }));
  }

  /**
   * Filter heatmap data by AQI range
   */
  filterByAQIRange(
    heatmapPoints: AQIHeatmapPoint[],
    minAQI: number,
    maxAQI: number
  ): AQIHeatmapPoint[] {
    return heatmapPoints.filter(point => 
      point.aqi >= minAQI && point.aqi <= maxAQI
    );
  }

  /**
   * Get average AQI for a region
   */
  getRegionAverageAQI(heatmapPoints: AQIHeatmapPoint[]): number {
    if (heatmapPoints.length === 0) return 0;
    
    const totalAQI = heatmapPoints.reduce((sum, point) => sum + point.aqi, 0);
    return Math.round(totalAQI / heatmapPoints.length);
  }

  /**
   * Find hotspots (areas with high pollution)
   */
  findPollutionHotspots(
    heatmapPoints: AQIHeatmapPoint[],
    threshold: number = 100
  ): AQIHeatmapPoint[] {
    return heatmapPoints
      .filter(point => point.aqi >= threshold)
      .sort((a, b) => b.aqi - a.aqi);
  }

  /**
   * Calculate pollution exposure along a route
   */
  calculateRouteExposure(
    routeCoordinates: LatLng[],
    heatmapPoints: AQIHeatmapPoint[],
    proximityThreshold: number = 0.001 // degrees (~100m)
  ): number {
    let totalExposure = 0;
    let exposurePoints = 0;

    for (const routePoint of routeCoordinates) {
      // Find nearby heatmap points
      const nearbyPoints = heatmapPoints.filter(heatPoint => {
        const distance = this.calculateDistance(routePoint, heatPoint.coordinate);
        return distance <= proximityThreshold;
      });

      if (nearbyPoints.length > 0) {
        const avgAQI = nearbyPoints.reduce((sum, point) => sum + point.aqi, 0) / nearbyPoints.length;
        totalExposure += avgAQI;
        exposurePoints++;
      }
    }

    return exposurePoints > 0 ? Math.round(totalExposure / exposurePoints) : 50;
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const latDiff = point1.latitude - point2.latitude;
    const lngDiff = point1.longitude - point2.longitude;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  /**
   * Get heatmap configuration for different pollution levels
   */
  getHeatmapConfig(level: 'low' | 'medium' | 'high'): HeatmapConfig {
    switch (level) {
      case 'low':
        return {
          ...this.defaultConfig,
          opacity: 0.4,
          radius: 15,
        };
      case 'medium':
        return this.defaultConfig;
      case 'high':
        return {
          ...this.defaultConfig,
          opacity: 0.8,
          radius: 25,
        };
      default:
        return this.defaultConfig;
    }
  }
}

export default new AQIHeatmapService();