import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback to default location
        setLocation({
          city: 'Colombo',
          country: 'Sri Lanka',
          latitude: 6.9271,
          longitude: 79.8612,
        });
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocoding to get city and country
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const { city, country } = reverseGeocode[0];
        setLocation({
          city: city || 'Unknown City',
          country: country || 'Unknown Country',
          latitude,
          longitude,
        });
      } else {
        setLocation({
          city: 'Current Location',
          country: '',
          latitude,
          longitude,
        });
      }
    } catch (err) {
      console.error('Location error:', err);
      setError('Unable to get location');
      // Fallback to default location
      setLocation({
        city: 'Colombo',
        country: 'Sri Lanka',
        latitude: 6.9271,
        longitude: 79.8612,
      });
    } finally {
      setLoading(false);
    }
  };

  return { location, loading, error, refreshLocation: getLocation };
};