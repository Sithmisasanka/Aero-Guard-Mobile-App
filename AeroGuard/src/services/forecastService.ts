import { AQIData } from '../types';
import * as Location from 'expo-location';

export interface ForecastData {
  date: string;
  aqi: number;
  status: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  primary_pollutant: string;
}

export interface AQIForecast {
  location: {
    city: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  current: AQIData;
  hourly: ForecastData[];
  daily: ForecastData[];
  lastUpdated: string;
}

class ForecastService {
  private static instance: ForecastService;

  public static getInstance(): ForecastService {
    if (!ForecastService.instance) {
      ForecastService.instance = new ForecastService();
    }
    return ForecastService.instance;
  }

  async getAQIForecast(latitude: number, longitude: number): Promise<AQIForecast | null> {
    try {
      // Use Open-Meteo Air Quality API (free, no key) for real forecasts
      if (process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true') {
        return this.generateMockForecast(latitude, longitude);
      }
      const forecast = await this.fetchOpenMeteoForecast(latitude, longitude);
      if (forecast) return forecast;
      // Fallback to mock if API fails
      return this.generateMockForecast(latitude, longitude);
    } catch (error) {
      console.error('Error fetching AQI forecast:', error);
      return null;
    }
  }

  private async fetchOpenMeteoForecast(latitude: number, longitude: number): Promise<AQIForecast | null> {
    try {
      const tz = 'auto';
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide&daily=us_aqi_max&timezone=${tz}`;
      const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=${tz}`;

      const [aqRes, wxRes] = await Promise.all([
        fetch(aqUrl),
        fetch(wxUrl),
      ]);
      if (!aqRes.ok) throw new Error(`Open-Meteo AQ error ${aqRes.status}`);
      if (!wxRes.ok) throw new Error(`Open-Meteo WX error ${wxRes.status}`);

      const aqJson = await aqRes.json();
      const wxJson = await wxRes.json();

      const hTimes: string[] = aqJson.hourly?.time || [];
      const hAQI: number[] = aqJson.hourly?.us_aqi || [];
      const hPM25: number[] = aqJson.hourly?.pm2_5 || [];
      const hPM10: number[] = aqJson.hourly?.pm10 || [];
      const hO3: number[] = aqJson.hourly?.ozone || [];
      const hNO2: number[] = aqJson.hourly?.nitrogen_dioxide || [];
      const hSO2: number[] = aqJson.hourly?.sulphur_dioxide || [];
      const hCOug: number[] = aqJson.hourly?.carbon_monoxide || [];

      const wTimes: string[] = wxJson.hourly?.time || [];
      const wTemp: number[] = wxJson.hourly?.temperature_2m || [];
      const wHum: number[] = wxJson.hourly?.relative_humidity_2m || [];
      const wWind: number[] = wxJson.hourly?.wind_speed_10m || [];

      // Build a map from weather time -> index for alignment
      const wIndex = new Map<string, number>();
      wTimes.forEach((t: string, i: number) => wIndex.set(t, i));

      const now = new Date();
      // Select the next 24 hourly entries from now
      const startIdx = hTimes.findIndex((t) => new Date(t) >= now);
      const first = startIdx >= 0 ? startIdx : 0;
      const last = Math.min(first + 24, hTimes.length);

      const hourly: ForecastData[] = [];
      for (let i = first; i < last; i++) {
        const t = hTimes[i];
        const wxi = wIndex.get(t) ?? i; // best-effort alignment
        const aqi = Math.max(0, Math.min(500, Math.round(hAQI[i] || 0)));
        const pm25 = hPM25[i] || 0;
        const pm10 = hPM10[i] || 0;
        const o3 = hO3[i] || 0;
        const no2 = hNO2[i] || 0;
        const so2 = hSO2[i] || 0;
        const coug = hCOug[i] || 0;
        const primary = this.pickPrimaryPollutant({ pm25, pm10, o3, no2, so2, co: coug });
        hourly.push({
          date: t,
          aqi,
          status: this.getAQIStatus(aqi),
          temperature: Math.round(wTemp[wxi] ?? 0),
          humidity: Math.round(wHum[wxi] ?? 0),
          windSpeed: Math.round(wWind[wxi] ?? 0),
          primary_pollutant: primary,
        });
      }

      // Daily next 7 days (prefer API daily data; fall back to aggregating hourly)
      const dTimes: string[] = aqJson.daily?.time || [];
      const dAQImax: number[] = aqJson.daily?.us_aqi_max || [];
      let daily: ForecastData[] = [];
      for (let i = 0; i < dTimes.length && daily.length < 7; i++) {
        const aqi = Math.max(0, Math.min(500, Math.round(dAQImax[i] || 0)));
        daily.push({
          date: dTimes[i],
          aqi,
          status: this.getAQIStatus(aqi),
          temperature: 0,
          humidity: 0,
          windSpeed: 0,
          primary_pollutant: 'PM2.5',
        });
      }

      // If API did not return daily data, compute it from hourly by grouping by local day
      if (daily.length === 0) {
        const byDay = new Map<string, number>(); // date(YYYY-MM-DD) -> max AQI
        for (let i = first; i < last; i++) {
          const t = hTimes[i];
          if (!t) continue;
          const dayKey = t.slice(0, 10); // YYYY-MM-DD
          const val = Math.max(0, Math.min(500, Math.round(hAQI[i] || 0)));
          const prev = byDay.get(dayKey) ?? -Infinity;
          if (val > prev) byDay.set(dayKey, val);
        }
        // Ensure we cover the next 7 calendar days from 'now' even if current day has limited hours
        const today = new Date();
        const fallbackDaily: ForecastData[] = [];
        for (let d = 1; d <= 7; d++) {
          const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
          const key = date.toISOString().slice(0, 10);
          const aqi = byDay.get(key) ?? (hAQI.length ? Math.max(0, Math.min(500, Math.round(hAQI[Math.min(first + d, hAQI.length - 1)] || 0))) : 0);
          fallbackDaily.push({
            date: key,
            aqi,
            status: this.getAQIStatus(aqi),
            temperature: 0,
            humidity: 0,
            windSpeed: 0,
            primary_pollutant: 'PM2.5',
          });
        }
        daily = fallbackDaily;
      }

      // Current conditions approximated by the first hourly item
      const curr = hourly[0] || {
        date: new Date().toISOString(),
        aqi: 0,
        status: 'Unknown',
        temperature: 0,
        humidity: 0,
        windSpeed: 0,
        primary_pollutant: 'PM2.5',
      };

      // Reverse geocode for human label
      let city = 'Current Location';
      let country = '';
      try {
        const rg = await Location.reverseGeocodeAsync({ latitude, longitude });
        const g = rg?.[0];
        if (g) {
          city = (g.city || (g as any).district || g.subregion || g.region || g.name || city) as string;
          country = (g.country || g.isoCountryCode || country) as string;
        }
      } catch {}

      const currentAQI: AQIData = {
        aqi: curr.aqi,
        city,
        country,
        station: 'Open-Meteo Air Quality',
        timestamp: new Date().toISOString(),
        coordinates: { latitude, longitude },
        pollutants: {
          pm25: hPM25[first] || 0,
          pm10: hPM10[first] || 0,
          o3: hO3[first] || 0,
          no2: hNO2[first] || 0,
          so2: hSO2[first] || 0,
          // Convert CO from μg/m³ to mg/m³ to match UI label
          co: (hCOug[first] || 0) / 1000,
        },
      };

      return {
        location: {
          city,
          country,
          coordinates: { latitude, longitude },
        },
        current: currentAQI,
        hourly,
        daily,
        lastUpdated: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('Open-Meteo forecast fallback to mock:', e);
      return null;
    }
  }

  private generateMockForecast(latitude: number, longitude: number): AQIForecast {
    const now = new Date();
    const currentAQI = 65 + Math.floor(Math.random() * 40); // Base AQI with some variation
    
    // Generate hourly forecast for next 24 hours
    const hourly: ForecastData[] = [];
    for (let i = 1; i <= 24; i++) {
      const forecastTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const variation = Math.floor(Math.random() * 30) - 15; // ±15 AQI variation
      const forecastAQI = Math.max(0, Math.min(300, currentAQI + variation));
      
      hourly.push({
        date: forecastTime.toISOString(),
        aqi: forecastAQI,
        status: this.getAQIStatus(forecastAQI),
        temperature: 25 + Math.floor(Math.random() * 10), // 25-35°C
        humidity: 60 + Math.floor(Math.random() * 30), // 60-90%
        windSpeed: 5 + Math.floor(Math.random() * 15), // 5-20 km/h
        primary_pollutant: 'PM2.5',
      });
    }

    // Generate daily forecast for next 7 days
    const daily: ForecastData[] = [];
    for (let i = 1; i <= 7; i++) {
      const forecastDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dailyVariation = Math.floor(Math.random() * 50) - 25; // ±25 AQI variation
      const forecastAQI = Math.max(0, Math.min(300, currentAQI + dailyVariation));
      
      daily.push({
        date: forecastDate.toISOString(),
        aqi: forecastAQI,
        status: this.getAQIStatus(forecastAQI),
        temperature: 27 + Math.floor(Math.random() * 8), // 27-35°C
        humidity: 65 + Math.floor(Math.random() * 25), // 65-90%
        windSpeed: 8 + Math.floor(Math.random() * 12), // 8-20 km/h
        primary_pollutant: this.getPrimaryPollutant(forecastAQI),
      });
    }

    return {
      location: {
        city: 'Current Location',
        country: 'Sri Lanka',
        coordinates: { latitude, longitude },
      },
      current: {
        aqi: currentAQI,
        city: 'Current Location',
        country: 'Sri Lanka',
        station: 'Mock Station',
        timestamp: now.toISOString(),
        coordinates: { latitude, longitude },
        pollutants: {
          pm25: Math.floor(currentAQI * 0.6),
          pm10: Math.floor(currentAQI * 0.8),
          o3: Math.floor(currentAQI * 0.5),
          no2: Math.floor(currentAQI * 0.4),
          so2: Math.floor(currentAQI * 0.2),
          co: Math.floor(currentAQI * 0.15) / 1000, // mg/m³ placeholder
        },
      },
      hourly,
      daily,
      lastUpdated: now.toISOString(),
    };
  }

  getAQIStatus(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  private getPrimaryPollutant(aqi: number): string {
    // Simulate different primary pollutants based on AQI level
    if (aqi > 150) {
      const pollutants = ['PM2.5', 'PM10', 'O3'];
      return pollutants[Math.floor(Math.random() * pollutants.length)];
    }
    return 'PM2.5';
  }

  private pickPrimaryPollutant(values: { pm25: number; pm10: number; o3: number; no2: number; so2: number; co: number; }): string {
    const entries: Array<[string, number]> = [
      ['PM2.5', values.pm25],
      ['PM10', values.pm10],
      ['O3', values.o3],
      ['NO2', values.no2],
      ['SO2', values.so2],
      ['CO', values.co],
    ];
    entries.sort((a, b) => (b[1] || 0) - (a[1] || 0));
    return entries[0][0];
  }

  getAQIColor(aqi: number): string {
    if (aqi <= 50) return '#4CAF50';
    if (aqi <= 100) return '#FFEB3B';
    if (aqi <= 150) return '#FF9800';
    if (aqi <= 200) return '#F44336';
    if (aqi <= 300) return '#9C27B0';
    return '#8D4E85';
  }

  formatForecastTime(dateString: string, type: 'hourly' | 'daily'): string {
    const date = new Date(dateString);
    
    if (type === 'hourly') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        hour12: true 
      });
    } else {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      }
      
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  getHealthRecommendation(aqi: number): string {
    if (aqi <= 50) {
      return 'Great air quality! Perfect time for outdoor activities and exercise.';
    } else if (aqi <= 100) {
      return 'Good air quality. You can enjoy outdoor activities with minimal concern.';
    } else if (aqi <= 150) {
      return 'Sensitive individuals should consider limiting prolonged outdoor exertion.';
    } else if (aqi <= 200) {
      return 'Everyone should limit outdoor activities. Consider wearing a mask if going outside.';
    } else if (aqi <= 300) {
      return 'Avoid outdoor activities. Stay indoors with windows closed.';
    } else {
      return 'Health alert! Avoid all outdoor activities and stay indoors.';
    }
  }

  getActivityRecommendation(aqi: number): { activity: string; recommendation: string }[] {
    const recommendations = [];

    if (aqi <= 50) {
      recommendations.push(
        { activity: 'Running/Jogging', recommendation: 'Excellent conditions' },
        { activity: 'Cycling', recommendation: 'Perfect for outdoor cycling' },
        { activity: 'Children\'s Play', recommendation: 'Safe for all outdoor activities' }
      );
    } else if (aqi <= 100) {
      recommendations.push(
        { activity: 'Light Exercise', recommendation: 'Good for moderate activities' },
        { activity: 'Walking', recommendation: 'Safe for extended walks' },
        { activity: 'Outdoor Sports', recommendation: 'Generally safe' }
      );
    } else if (aqi <= 150) {
      recommendations.push(
        { activity: 'Indoor Exercise', recommendation: 'Recommended over outdoor' },
        { activity: 'Short Walks', recommendation: 'Keep outdoor time brief' },
        { activity: 'Mask Usage', recommendation: 'Consider for sensitive individuals' }
      );
    } else if (aqi <= 200) {
      recommendations.push(
        { activity: 'Indoor Activities', recommendation: 'Strongly recommended' },
        { activity: 'Air Purifiers', recommendation: 'Use if available' },
        { activity: 'Limit Exposure', recommendation: 'Avoid prolonged outdoor time' }
      );
    } else {
      recommendations.push(
        { activity: 'Stay Indoors', recommendation: 'Essential for health' },
        { activity: 'Seal Windows', recommendation: 'Keep indoor air clean' },
        { activity: 'Medical Attention', recommendation: 'If experiencing symptoms' }
      );
    }

    return recommendations;
  }
}

export default ForecastService;