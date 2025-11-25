import { useState, useEffect } from 'react';
import { AQIService } from '../services/aqiService';
import { AQIData } from '../types';
import { useLocation } from './useLocation';

export const useAQI = () => {
  const [currentAQI, setCurrentAQI] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location } = useLocation();

  useEffect(() => {
    if (location) {
      fetchAQI();
    }
  }, [location]);

  const fetchAQI = async () => {
    if (!location) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const aqiData = await AQIService.getCurrentAQI(location.latitude, location.longitude);
      setCurrentAQI(aqiData);
    } catch (err) {
      console.error('AQI fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AQI data');
    } finally {
      setLoading(false);
    }
  };

  return { 
    currentAQI, 
    loading, 
    error, 
    refetch: fetchAQI 
  };
};