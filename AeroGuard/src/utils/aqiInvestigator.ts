// AQI Data Investigation Tool
import { AQIService } from '../services/aqiService';
import Constants from 'expo-constants';

export class AQIInvestigator {
  static async investigateCurrentAQI(latitude: number = 6.9271, longitude: number = 79.8612) {
    console.log('🔍 Investigating AQI Data...');
    console.log('=' .repeat(50));
    
    // Check environment configuration
      import Constants from 'expo-constants';
      const extra = (Constants.expoConfig as Record<string, any>)?.extra ?? {};
      console.log('USE_MOCK_DATA:', extra.EXPO_PUBLIC_USE_MOCK_DATA);
      console.log('IQAIR_API_KEY:', extra.EXPO_PUBLIC_IQAIR_API_KEY ? 'CONFIGURED' : 'MISSING');
      console.log('GOOGLE_AIR_QUALITY_KEY:', extra.EXPO_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY ? 'CONFIGURED' : 'MISSING');
    
    try {
      // Get current AQI data
      const aqiData = await AQIService.getCurrentAQI(latitude, longitude);
      
      if (aqiData) {
        console.log('\n📊 Current AQI Data:');
        console.log('AQI Value:', aqiData.aqi);
        console.log('Station:', aqiData.station);
        console.log('City:', aqiData.city);
        console.log('Country:', aqiData.country);
        console.log('Coordinates:', `${aqiData.coordinates.latitude}, ${aqiData.coordinates.longitude}`);
        console.log('Timestamp:', aqiData.timestamp);
        
        console.log('\n🧪 Pollutant Concentrations:');
        console.log('PM2.5:', aqiData.pollutants.pm25, 'μg/m³');
        console.log('PM10:', aqiData.pollutants.pm10, 'μg/m³');
        console.log('O3:', aqiData.pollutants.o3, 'μg/m³');
        console.log('NO2:', aqiData.pollutants.no2, 'μg/m³');
        console.log('SO2:', aqiData.pollutants.so2, 'μg/m³');
        console.log('CO:', aqiData.pollutants.co, 'mg/m³');
        
        // Determine data source
        console.log('\n🔗 Data Source Analysis:');
        if (aqiData.station === 'Demo Station') {
          console.log('❌ USING MOCK DATA - AQI should be 65, but showing:', aqiData.aqi);
          console.log('⚠️ This indicates a bug in the mock data generation!');
        } else if (aqiData.station === 'Google Air Quality') {
          console.log('✅ Using Google Air Quality API');
          console.log('🔍 High AQI might be due to:');
          console.log('   - Real air pollution event');
          console.log('   - Incorrect PM2.5 to AQI conversion');
          console.log('   - API data error');
        } else {
          console.log('✅ Using IQAir API');
          console.log('🔍 High AQI might be due to:');
          console.log('   - Real air quality conditions');
          console.log('   - Different measurement standards');
          console.log('   - API data anomaly');
        }
        
        // AQI Level Analysis
        const riskInfo = AQIService.getAQIRiskInfo(aqiData.aqi);
        console.log('\n⚠️ AQI Level Analysis:');
        console.log('Level:', riskInfo.level);
        console.log('Color:', riskInfo.color);
        console.log('Description:', riskInfo.description);
        console.log('Recommendation:', riskInfo.recommendation);
        
        // Validate if AQI makes sense
        if (aqiData.aqi > 150) {
          console.log('\n🚨 HIGH AQI ALERT (>150):');
          console.log('This indicates UNHEALTHY air quality conditions!');
          
          if (aqiData.station === 'Demo Station') {
            console.log('❌ BUG: Mock data should never show AQI > 150');
            console.log('🔧 Action: Fix mock data generation');
          } else {
            console.log('✅ Real data: This could be accurate but concerning');
            console.log('🔍 Check if there are local air quality issues:');
            console.log('   - Forest fires, industrial pollution, dust storms');
            console.log('   - Vehicle emissions, construction activities');
            console.log('   - Weather conditions trapping pollutants');
          }
        }
        
      } else {
        console.log('❌ No AQI data returned - this should not happen!');
      }
      
    } catch (error) {
      console.error('❌ Error investigating AQI:', error);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Investigation complete!');
  }
  
  static async compareDataSources(latitude: number = 6.9271, longitude: number = 79.8612) {
    console.log('🔄 Comparing Different Data Sources...');
    
    // Test with mock data forced
    const originalMockSetting = process.env.EXPO_PUBLIC_USE_MOCK_DATA;
    
    // Force mock data
    (process.env.EXPO_PUBLIC_USE_MOCK_DATA as any) = 'true';
    const mockData = await AQIService.getCurrentAQI(latitude, longitude);
    
    // Restore original setting
    (process.env.EXPO_PUBLIC_USE_MOCK_DATA as any) = originalMockSetting;
    const realData = await AQIService.getCurrentAQI(latitude, longitude);
    
    console.log('\n📊 Data Source Comparison:');
    console.log('Mock Data AQI:', mockData?.aqi || 'N/A');
    console.log('Real Data AQI:', realData?.aqi || 'N/A');
    
    if (mockData?.aqi !== realData?.aqi) {
      console.log('✅ Different sources confirmed');
      if (realData?.aqi && realData.aqi > 150) {
        console.log('⚠️ Real API is returning high AQI values');
      }
    } else {
      console.log('⚠️ Same values - might be using mock data');
    }
  }
}

export default AQIInvestigator;