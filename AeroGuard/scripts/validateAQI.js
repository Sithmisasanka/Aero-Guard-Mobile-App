#!/usr/bin/env node

// Configuration Test Script
// This script tests the AQI service configuration and validates API connectivity

import { AQIService } from '../src/services/aqiService';
import EnvValidator from '../src/utils/envValidator';

async function runValidation() {
  console.log('🚀 Starting AQI Service Validation...\n');

  // 1. Validate environment configuration
  console.log('📋 Step 1: Environment Configuration');
  EnvValidator.logDiagnostics();
  console.log('\n');

  // 2. Test coordinates
  console.log('🌍 Step 2: Coordinate Validation');
  const testCoords = [
    { lat: 6.9271, lng: 79.8612, name: 'Colombo, Sri Lanka' },
    { lat: 7.2906, lng: 80.6337, name: 'Kandy, Sri Lanka' },
    { lat: 6.0329, lng: 80.2168, name: 'Galle, Sri Lanka' },
  ];

  for (const coord of testCoords) {
    const result = await EnvValidator.testCoordinateValidity(coord.lat, coord.lng);
    console.log(`${coord.name}: ${result.valid ? '✅' : '❌'}`);
    if (result.location) console.log(`  Location: ${result.location}`);
    if (result.issues.length > 0) {
      result.issues.forEach(issue => console.log(`  ⚠️ ${issue}`));
    }
  }
  console.log('\n');

  // 3. Test AQI data fetching
  console.log('📊 Step 3: AQI Data Fetching');
  try {
    const aqiData = await AQIService.getCurrentAQI(6.9271, 79.8612);
    if (aqiData) {
      console.log('✅ AQI data retrieved successfully');
      console.log(`  AQI: ${aqiData.aqi}`);
      console.log(`  Location: ${aqiData.city}, ${aqiData.country}`);
      console.log(`  Coordinates: (${aqiData.coordinates.latitude}, ${aqiData.coordinates.longitude})`);
      console.log(`  Station: ${aqiData.station}`);
      console.log(`  Timestamp: ${aqiData.timestamp}`);
      console.log(`  Pollutants:`, aqiData.pollutants);
      
      // Check if this is mock data
      if (aqiData.station === 'Demo Station') {
        console.log('⚠️ Using mock data - configure API keys for real data');
      }
    } else {
      console.log('❌ Failed to retrieve AQI data');
    }
  } catch (error) {
    console.log('❌ Error fetching AQI data:', error);
  }
  console.log('\n');

  // 4. Test city-based AQI
  console.log('🏙️ Step 4: City-based AQI Fetching');
  try {
    const cityAQI = await AQIService.getAQIByCity('Colombo', undefined, 'Sri Lanka');
    if (cityAQI) {
      console.log('✅ City AQI data retrieved successfully');
      console.log(`  City: ${cityAQI.city}, ${cityAQI.country}`);
      console.log(`  AQI: ${cityAQI.aqi}`);
    } else {
      console.log('❌ Failed to retrieve city AQI data');
    }
  } catch (error) {
    console.log('❌ Error fetching city AQI:', error);
  }
  console.log('\n');

  // 5. Test risk level calculations
  console.log('🎯 Step 5: Risk Level Calculations');
  const testAQIs = [25, 75, 125, 175, 225, 350];
  testAQIs.forEach(aqi => {
    const riskInfo = AQIService.getAQIRiskInfo(aqi);
    console.log(`  AQI ${aqi}: ${riskInfo.level} (${riskInfo.color}) - ${riskInfo.description}`);
  });

  console.log('\n🎉 Validation complete!');
}

// Only run if this is the main script
if (require.main === module) {
  runValidation().catch(console.error);
}