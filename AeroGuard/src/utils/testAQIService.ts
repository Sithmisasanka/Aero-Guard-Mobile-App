import { AQIService } from '../services/aqiService';
import '../utils/configTest'; // This will log configuration info

async function testAQIFetching() {
  console.log('\n🧪 Testing AQI Data Fetching...');
  console.log('-'.repeat(40));

  // Test coordinates for different Sri Lankan cities
  const testLocations = [
    { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
    { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
    { name: 'Galle', lat: 6.0329, lng: 80.2168 },
  ];

  for (const location of testLocations) {
    console.log(`\n📍 Testing ${location.name} (${location.lat}, ${location.lng}):`);
    
    try {
      const startTime = Date.now();
      const aqiData = await AQIService.getCurrentAQI(location.lat, location.lng);
      const fetchTime = Date.now() - startTime;
      
      if (aqiData) {
        console.log(`✅ Success (${fetchTime}ms)`);
        console.log(`  AQI: ${aqiData.aqi}`);
        console.log(`  Location: ${aqiData.city}, ${aqiData.country}`);
        console.log(`  Station: ${aqiData.station}`);
        console.log(`  Coordinates: (${aqiData.coordinates.latitude}, ${aqiData.coordinates.longitude})`);
        console.log(`  PM2.5: ${aqiData.pollutants.pm25} μg/m³`);
        console.log(`  PM10: ${aqiData.pollutants.pm10} μg/m³`);
        console.log(`  Timestamp: ${aqiData.timestamp}`);
        
        // Check data source
        if (aqiData.station === 'Demo Station') {
          console.log('  📋 Data Source: MOCK DATA');
        } else if (aqiData.station === 'Google Air Quality') {
          console.log('  📋 Data Source: Google Air Quality API');
        } else {
          console.log('  📋 Data Source: IQAir API');
        }
        
        // Validate coordinates match request
        const coordDiff = Math.abs(aqiData.coordinates.latitude - location.lat) + 
                         Math.abs(aqiData.coordinates.longitude - location.lng);
        if (coordDiff < 0.01) {
          console.log('  ✅ Coordinates match request');
        } else {
          console.log('  ⚠️ Coordinates differ from request');
        }
        
      } else {
        console.log('❌ Failed to fetch AQI data');
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }

  // Test city-based lookup
  console.log('\n🏙️ Testing City-based AQI Lookup:');
  try {
    const cityAQI = await AQIService.getAQIByCity('Colombo', undefined, 'Sri Lanka');
    if (cityAQI) {
      console.log('✅ City lookup successful');
      console.log(`  ${cityAQI.city}, ${cityAQI.country} - AQI: ${cityAQI.aqi}`);
    } else {
      console.log('❌ City lookup failed');
    }
  } catch (error) {
    console.log(`❌ City lookup error: ${error}`);
  }

  // Test risk level calculations
  console.log('\n🎯 Testing Risk Level Calculations:');
  const testAQIs = [25, 75, 125, 175, 225, 350];
  testAQIs.forEach(aqi => {
    const riskInfo = AQIService.getAQIRiskInfo(aqi);
    console.log(`  AQI ${aqi}: ${riskInfo.level.toUpperCase()} - ${riskInfo.description}`);
  });

  console.log('\n🎉 AQI validation tests complete!');
}

// Run the test
testAQIFetching().catch(console.error);