export const AQICN_CONFIG = {
  BASE_URL: 'https://api.waqi.info',
  API_TOKEN: process.env.EXPO_PUBLIC_AQICN_API_TOKEN || 'demo',
  ENDPOINTS: {
    CURRENT: '/feed',
    HISTORICAL: '/api/feed',
    SEARCH: '/search',
    MAP: '/map/bounds'
  },
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 1000,
    DELAY_BETWEEN_REQUESTS: 100, // milliseconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000
  },
  CACHE: {
    CURRENT_DATA_TTL: 5 * 60 * 1000, // 5 minutes
    HISTORICAL_DATA_TTL: 2 * 60 * 60 * 1000, // 2 hours
    SEARCH_RESULTS_TTL: 30 * 60 * 1000 // 30 minutes
  },
  FEATURES: {
    ENABLE_HISTORICAL: true,
    ENABLE_FORECAST: true,
    ENABLE_SEARCH: true,
    MAX_HISTORICAL_DAYS: 30
  }
};

export const AQI_LEVELS = {
  GOOD: { min: 0, max: 50, color: '#00E400', label: 'Good' },
  MODERATE: { min: 51, max: 100, color: '#FFFF00', label: 'Moderate' },
  UNHEALTHY_SENSITIVE: { min: 101, max: 150, color: '#FF7E00', label: 'Unhealthy for Sensitive Groups' },
  UNHEALTHY: { min: 151, max: 200, color: '#FF0000', label: 'Unhealthy' },
  VERY_UNHEALTHY: { min: 201, max: 300, color: '#8F3F97', label: 'Very Unhealthy' },
  HAZARDOUS: { min: 301, max: 500, color: '#7E0023', label: 'Hazardous' }
};

export const POLLUTANT_INFO = {
  pm25: { name: 'PM2.5', unit: 'μg/m³', description: 'Fine Particulate Matter' },
  pm10: { name: 'PM10', unit: 'μg/m³', description: 'Coarse Particulate Matter' },
  o3: { name: 'O₃', unit: 'μg/m³', description: 'Ozone' },
  no2: { name: 'NO₂', unit: 'μg/m³', description: 'Nitrogen Dioxide' },
  so2: { name: 'SO₂', unit: 'μg/m³', description: 'Sulfur Dioxide' },
  co: { name: 'CO', unit: 'mg/m³', description: 'Carbon Monoxide' }
};