// AQICN API Diagnostic Tool
import { AQICN_CONFIG } from '../config/aqicnConfig';

export class AQICNDiagnostics {
  static async testConnection(): Promise<{
    status: 'success' | 'error';
    message: string;
    details?: any;
  }> {
    try {
      console.log('🔍 Testing AQICN API Connection...');
      console.log('API Token:', AQICN_CONFIG.API_TOKEN === 'demo' ? 'DEMO' : 'CONFIGURED');
      console.log('Base URL:', AQICN_CONFIG.BASE_URL);

      // Test current AQI endpoint with demo coordinates (Beijing)
      const testLat = 39.9042;
      const testLng = 116.4074;
      
      const url = `${AQICN_CONFIG.BASE_URL}/feed/geo:${testLat};${testLng}/?token=${AQICN_CONFIG.API_TOKEN}`;
      console.log('Test URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        return {
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: { url, status: response.status }
        };
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.status === 'ok') {
        return {
          status: 'success',
          message: `Connected successfully. Station: ${data.data?.city?.name || 'Unknown'}`,
          details: {
            stationId: data.data?.idx,
            cityName: data.data?.city?.name,
            aqi: data.data?.aqi,
            coordinates: data.data?.city?.geo
          }
        };
      } else {
        return {
          status: 'error',
          message: `API Error: ${data.status}`,
          details: { response: data }
        };
      }
    } catch (error) {
      console.error('AQICN connection test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'error',
        message: `Connection failed: ${errorMessage}`,
        details: { error: String(error) }
      };
    }
  }

  static async testHistoricalAPI(stationId: number = 5724): Promise<{
    status: 'success' | 'error';
    message: string;
    details?: any;
  }> {
    try {
      console.log('🔍 Testing AQICN Historical API...');
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const url = `${AQICN_CONFIG.BASE_URL}/feed/@${stationId}/his/?token=${AQICN_CONFIG.API_TOKEN}&start=${startDate}&end=${endDate}`;
      console.log('Historical URL:', url);

      const response = await fetch(url);
      console.log('Historical response status:', response.status);

      if (!response.ok) {
        return {
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: { url, status: response.status }
        };
      }

      const data = await response.json();
      console.log('Historical response:', data);

      if (data.status === 'ok' && data.data) {
        return {
          status: 'success',
          message: `Historical data retrieved. ${data.data.length} entries found.`,
          details: {
            entries: data.data.length,
            dateRange: `${startDate} to ${endDate}`,
            sampleData: data.data.slice(0, 2)
          }
        };
      } else {
        return {
          status: 'error',
          message: `Historical API Error: ${data.status}`,
          details: { response: data }
        };
      }
    } catch (error) {
      console.error('AQICN historical test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'error',
        message: `Historical test failed: ${errorMessage}`,
        details: { error: String(error) }
      };
    }
  }

  static async runFullDiagnostic(): Promise<void> {
    console.log('🚀 Running AQICN Full Diagnostic...');
    console.log('=' .repeat(50));

    // Test basic connection
    const connectionTest = await this.testConnection();
    console.log('\n📡 Connection Test:');
    console.log(`Status: ${connectionTest.status === 'success' ? '✅' : '❌'}`);
    console.log(`Message: ${connectionTest.message}`);
    if (connectionTest.details) {
      console.log('Details:', connectionTest.details);
    }

    // Test historical API if connection works
    if (connectionTest.status === 'success' && connectionTest.details?.stationId) {
      console.log('\n📊 Historical Data Test:');
      const historicalTest = await this.testHistoricalAPI(connectionTest.details.stationId);
      console.log(`Status: ${historicalTest.status === 'success' ? '✅' : '❌'}`);
      console.log(`Message: ${historicalTest.message}`);
      if (historicalTest.details) {
        console.log('Details:', historicalTest.details);
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Diagnostic complete!');
  }
}

export default AQICNDiagnostics;