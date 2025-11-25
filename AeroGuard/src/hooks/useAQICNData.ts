import { useState, useEffect, useCallback } from 'react';
import { AQICNService } from '../services/aqicnService';
import { HistoricalAQIService } from '../services/historicalAQIService';
import { 
  AQICNCurrentResponse, 
  WeeklyAQIReport,
  ProcessedHistoricalData 
} from '../types/aqicnTypes';

export interface UseAQICNDataOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  enableHistorical?: boolean;
}

export const useAQICNData = (
  latitude: number,
  longitude: number,
  options: UseAQICNDataOptions = {}
) => {
  const {
    enableAutoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    enableHistorical = true
  } = options;

  // Current data state
  const [currentData, setCurrentData] = useState<AQICNCurrentResponse | null>(null);
  const [currentLoading, setCurrentLoading] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // Historical data state
  const [weeklyReport, setWeeklyReport] = useState<WeeklyAQIReport | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  // Last update tracking
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  /**
   * Fetch current AQI data
   */
  const fetchCurrentData = useCallback(async () => {
    if (!latitude || !longitude) return;

    setCurrentLoading(true);
    setCurrentError(null);

    try {
      const data = await AQICNService.getCurrentAQI(latitude, longitude);
      
      if (data) {
        setCurrentData(data);
        setLastUpdate(new Date());
      } else {
        setCurrentError('Failed to fetch current AQI data');
      }
    } catch (error) {
      setCurrentError(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Error fetching current AQICN data:', error);
    } finally {
      setCurrentLoading(false);
    }
  }, [latitude, longitude]);

  /**
   * Fetch historical data and generate weekly report
   */
  const fetchHistoricalData = useCallback(async () => {
    if (!latitude || !longitude || !enableHistorical) return;

    setHistoricalLoading(true);
    setHistoricalError(null);

    try {
      const report = await HistoricalAQIService.generateWeeklyReport(
        latitude,
        longitude
      );
      
      if (report) {
        setWeeklyReport(report);
      } else {
        setHistoricalError('Failed to generate weekly report');
      }
    } catch (error) {
      setHistoricalError(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Error fetching historical AQICN data:', error);
    } finally {
      setHistoricalLoading(false);
    }
  }, [latitude, longitude, enableHistorical]);

  /**
   * Refresh both current and historical data
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchCurrentData(),
      enableHistorical ? fetchHistoricalData() : Promise.resolve()
    ]);
  }, [fetchCurrentData, fetchHistoricalData, enableHistorical]);

  /**
   * Search for stations by keyword
   */
  const searchStations = useCallback(async (keyword: string) => {
    try {
      const results = await AQICNService.searchStations(keyword);
      return results?.data || [];
    } catch (error) {
      console.error('Error searching stations:', error);
      return [];
    }
  }, []);

  /**
   * Get forecast data
   */
  const getForecast = useCallback(async () => {
    try {
      const forecast = await AQICNService.getForecast(latitude, longitude);
      return forecast;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return null;
    }
  }, [latitude, longitude]);

  // Initial data fetch
  useEffect(() => {
    if (latitude && longitude) {
      refreshAll();
    }
  }, [latitude, longitude]);

  // Auto refresh setup
  useEffect(() => {
    if (!enableAutoRefresh || !latitude || !longitude) return;

    const interval = setInterval(() => {
      fetchCurrentData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, fetchCurrentData]);

  // Utility functions
  const getCurrentAQI = () => currentData?.data?.aqi || 0;
  const getCurrentLocation = () => currentData?.data?.city?.name || 'Unknown';
  const getWeeklyAverage = () => weeklyReport?.insights?.weeklyAverage || 0;
  const getTrend = () => weeklyReport?.insights?.trend || 'stable';

  return {
    // Current data
    currentData,
    currentLoading,
    currentError,
    
    // Historical data
    weeklyReport,
    historicalLoading,
    historicalError,
    
    // Actions
    refreshAll,
    fetchCurrentData,
    fetchHistoricalData,
    searchStations,
    getForecast,
    
    // Utilities
    getCurrentAQI,
    getCurrentLocation,
    getWeeklyAverage,
    getTrend,
    lastUpdate,
    
    // Status
    isLoading: currentLoading || historicalLoading,
    hasError: !!currentError || !!historicalError,
    hasData: !!currentData || !!weeklyReport
  };
};