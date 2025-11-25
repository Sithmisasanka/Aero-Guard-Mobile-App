// Simple Node.js test script for AQI service validation
const fs = require('fs');
const path = require('path');

// Parse .env file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found at:', envPath);
    console.log('Looking in current directory...');
    const currentPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(currentPath)) {
      console.log('✅ Found .env at:', currentPath);
      return parseEnvFile(currentPath);
    }
    return {};
  }

  return parseEnvFile(envPath);
}

function parseEnvFile(filePath) {
  const envContent = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

// Simple AQI validation
async function validateAQIConfiguration() {
  console.log('🔍 AQI Configuration Validation Report');
  console.log('=' .repeat(50));

  const env = loadEnvFile();
  
  // Environment Variables Check
  console.log('\n📋 Environment Variables:');
  console.log('IQAIR_API_KEY:', env.EXPO_PUBLIC_IQAIR_API_KEY ? 'CONFIGURED' : 'MISSING');
  console.log('GOOGLE_AIR_QUALITY_KEY:', env.EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY ? 'CONFIGURED' : 'MISSING');
  console.log('USE_MOCK_DATA:', env.EXPO_PUBLIC_USE_MOCK_DATA);
  console.log('ENABLE_LOGGING:', env.EXPO_PUBLIC_ENABLE_LOGGING);

  // Default Location Check
  console.log('\n🌍 Default Location:');
  console.log('City:', env.EXPO_PUBLIC_DEFAULT_CITY);
  console.log('Country:', env.EXPO_PUBLIC_DEFAULT_COUNTRY);
  console.log('Latitude:', env.EXPO_PUBLIC_DEFAULT_LAT);
  console.log('Longitude:', env.EXPO_PUBLIC_DEFAULT_LNG);

  // API Configuration Analysis
  console.log('\n📊 Data Source Analysis:');
  const iqairKey = env.EXPO_PUBLIC_IQAIR_API_KEY;
  const googleKey = env.EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY;
  const useMock = env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';

  if (useMock) {
    console.log('⚠️ App is configured to use MOCK DATA');
  } else if (iqairKey && iqairKey !== 'YOUR_IQAIR_API_KEY') {
    if (googleKey) {
      console.log('✅ Primary: Google Air Quality, Fallback: IQAir');
    } else {
      console.log('✅ Using IQAir API only');
    }
  } else if (googleKey) {
    console.log('✅ Using Google Air Quality API only');
  } else {
    console.log('⚠️ No valid API keys - app will use mock data');
  }

  // Coordinate Validation
  console.log('\n🎯 Coordinate Validation:');
  const lat = parseFloat(env.EXPO_PUBLIC_DEFAULT_LAT || '6.9271');
  const lng = parseFloat(env.EXPO_PUBLIC_DEFAULT_LNG || '79.8612');

  console.log(`Coordinates: (${lat}, ${lng})`);

  // Basic validation
  if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    console.log('✅ Coordinates are within valid range');
  } else {
    console.log('❌ Invalid coordinates');
  }

  // Sri Lanka bounds check
  const isInSriLanka = lat >= 5.9 && lat <= 9.9 && lng >= 79.7 && lng <= 81.9;
  if (isInSriLanka) {
    console.log('✅ Coordinates are within Sri Lanka bounds');
  } else {
    console.log('⚠️ Coordinates are outside Sri Lanka bounds');
  }

  // Test API connectivity
  console.log('\n🧪 Testing API Connectivity:');
  
  // Test IQAir API
  if (iqairKey && iqairKey !== 'YOUR_IQAIR_API_KEY') {
    try {
      console.log('Testing IQAir API...');
      const response = await fetch(
        `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lng}&key=${iqairKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          console.log('✅ IQAir API: Working');
          console.log(`  Location: ${data.data.city}, ${data.data.country}`);
          console.log(`  AQI: ${data.data.current.pollution.aqius}`);
        } else {
          console.log('❌ IQAir API: Error in response -', data.data?.message || 'Unknown error');
        }
      } else {
        console.log(`❌ IQAir API: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log('❌ IQAir API: Network error -', error.message);
    }
  }

  // Test Google Air Quality API
  if (googleKey) {
    try {
      console.log('Testing Google Air Quality API...');
      const response = await fetch(
        `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: { latitude: lat, longitude: lng },
            extraComputations: ['POLLUTANT_CONCENTRATION'],
            languageCode: 'en'
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Google Air Quality API: Working');
        if (data.currentConditions && data.currentConditions.length > 0) {
          const aqi = data.currentConditions[0].indexes?.[0]?.aqi || 'N/A';
          console.log(`  AQI: ${aqi}`);
        }
      } else {
        console.log(`❌ Google Air Quality API: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Google Air Quality API: Network error -', error.message);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Configuration validation complete');
}

// Run the validation
validateAQIConfiguration().catch(console.error);