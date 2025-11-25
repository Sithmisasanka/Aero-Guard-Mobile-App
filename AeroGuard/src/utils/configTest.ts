// Simple AQI Configuration Test
console.log('🔍 AQI Configuration Validation Report');
console.log('=' .repeat(50));

// Environment Variables Check
console.log('\n📋 Environment Variables:');
console.log('IQAIR_API_KEY:', process.env.EXPO_PUBLIC_IQAIR_API_KEY ? 'CONFIGURED' : 'MISSING');
console.log('GOOGLE_AIR_QUALITY_KEY:', process.env.EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY ? 'CONFIGURED' : 'MISSING');
console.log('USE_MOCK_DATA:', process.env.EXPO_PUBLIC_USE_MOCK_DATA);
console.log('ENABLE_LOGGING:', process.env.EXPO_PUBLIC_ENABLE_LOGGING);

// Simple AQI Configuration Test
import Constants from 'expo-constants';
const extra = (Constants.expoConfig as Record<string, any>)?.extra ?? {};

console.log('\ud83d\udd0d AQI Configuration Validation Report');
console.log('=' .repeat(50));

// Environment Variables Check
console.log('\n\ud83d\udccb Environment Variables:');
console.log('IQAIR_API_KEY:', extra.EXPO_PUBLIC_IQAIR_API_KEY ? 'CONFIGURED' : 'MISSING');
console.log('GOOGLE_AIR_QUALITY_KEY:', extra.EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY ? 'CONFIGURED' : 'MISSING');
console.log('USE_MOCK_DATA:', extra.EXPO_PUBLIC_USE_MOCK_DATA);
console.log('ENABLE_LOGGING:', extra.EXPO_PUBLIC_ENABLE_LOGGING);

// Default Location Check
console.log('\n\ud83c\udf0d Default Location:');
console.log('City:', extra.EXPO_PUBLIC_DEFAULT_CITY);
console.log('Country:', extra.EXPO_PUBLIC_DEFAULT_COUNTRY);
console.log('Latitude:', extra.EXPO_PUBLIC_DEFAULT_LAT);
console.log('Longitude:', extra.EXPO_PUBLIC_DEFAULT_LNG);

// API Configuration Analysis
console.log('\n\ud83d\udcca Data Source Analysis:');
const iqairKey = extra.EXPO_PUBLIC_IQAIR_API_KEY;
const googleKey = extra.EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY;
const useMock = extra.EXPO_PUBLIC_USE_MOCK_DATA === 'true';

if (useMock) {
  console.log('\u26a0\ufe0f App is configured to use MOCK DATA');
} else if (iqairKey && iqairKey !== 'YOUR_IQAIR_API_KEY') {
  if (googleKey) {
    console.log('\u2705 Primary: Google Air Quality, Fallback: IQAir');
  } else {
    console.log('\u2705 Using IQAir API only');
  }
} else if (googleKey) {
  console.log('\u2705 Using Google Air Quality API only');
} else {
  console.log('\u26a0\ufe0f No valid API keys - app will use mock data');
}

// Coordinate Validation
console.log('\n\ud83c\udfaf Coordinate Validation:');
const lat = parseFloat(extra.EXPO_PUBLIC_DEFAULT_LAT || '6.9271');
const lng = parseFloat(extra.EXPO_PUBLIC_DEFAULT_LNG || '79.8612');

console.log(`Coordinates: (${lat}, ${lng})`);

// Basic validation
if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
  console.log('\u2705 Coordinates are within valid range');
} else {
  console.log('\u274c Invalid coordinates');
}

// Sri Lanka bounds check
const isInSriLanka = lat >= 5.9 && lat <= 9.9 && lng >= 79.7 && lng <= 81.9;
if (isInSriLanka) {
  console.log('\u2705 Coordinates are within Sri Lanka bounds');
} else {
  console.log('\u26a0\ufe0f Coordinates are outside Sri Lanka bounds');
}

console.log('\n' + '=' .repeat(50));
console.log('\u2705 Configuration validation complete');

export {};