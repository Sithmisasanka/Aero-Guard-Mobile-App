# Realtime AQI Data Implementation Guide

This guide explains how to implement and use realtime AQI (Air Quality Index) data in your AeroGuard Mobile app.

## Overview

The realtime AQI system provides automatic, periodic updates of air quality data with the following features:

- **Automatic Polling**: Updates every 30 seconds by default
- **Smart Updates**: Only triggers UI updates when data actually changes
- **Connection Monitoring**: Tracks connection status and retry logic
- **Error Handling**: Graceful degradation with retry mechanisms
- **Location-Based**: Uses device GPS for accurate local data
- **Background Updates**: Continues updating even when app is in background

## Architecture

### Core Components

1. **RealtimeAQIService** (`src/services/realtimeAQIService.ts`)
   - Singleton service managing realtime data fetching
   - Handles polling, retries, and connection state
   - Provides React hook for easy integration

2. **useRealtimeAQI Hook**
   - React hook for component integration
   - Manages state and callbacks automatically
   - Provides refresh functionality

3. **ModernAQIDisplay Component**
   - Updated to use realtime service
   - Shows connection status indicator
   - Handles location updates

## Implementation Details

### RealtimeAQIService Class

```typescript
class RealtimeAQIService {
  // Configuration options
  private pollInterval: number = 30000; // 30 seconds
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // 5 seconds

  // Core methods
  startPolling(): void     // Start automatic updates
  stopPolling(): void      // Stop automatic updates
  refreshData(): void      // Manual refresh
  updateLocation(): void   // Update GPS coordinates
  getStatus(): object      // Get connection status
}
```

### React Hook Usage

```typescript
const {
  data,           // Current AQI data
  error,          // Error state
  isConnected,    // Connection status
  refresh,        // Manual refresh function
  getStatus       // Detailed status info
} = useRealtimeAQI(latitude, longitude, config);
```

## Configuration Options

### Poll Intervals

```typescript
const config = {
  pollInterval: 60000,    // 1 minute updates
  maxRetries: 5,          // Retry up to 5 times
  retryDelay: 10000       // 10 second retry delay
};
```

### Recommended Settings

- **Development**: 30-60 seconds (frequent for testing)
- **Production**: 5-10 minutes (balance between freshness and API limits)
- **Battery Saving**: 15-30 minutes (for background operation)

## Component Integration

### Basic Usage

```typescript
import { useRealtimeAQI } from '../services/realtimeAQIService';

export const AQIDisplay: React.FC = () => {
  const { data, error, isConnected, refresh } = useRealtimeAQI(
    6.9271,    // latitude
    79.8612,   // longitude
    {
      pollInterval: 30000,  // 30 seconds
      maxRetries: 3
    }
  );

  if (!data) return <ActivityIndicator />;

  return (
    <View>
      <Text>AQI: {data.aqi}</Text>
      <Text>Status: {isConnected ? 'Live' : 'Offline'}</Text>
      <TouchableOpacity onPress={refresh}>
        <Text>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Advanced Usage with Location

```typescript
export const SmartAQIDisplay: React.FC = () => {
  const [location, setLocation] = useState({ lat: 6.9271, lng: 79.8612 });

  const { data, error, isConnected, refresh, getStatus } = useRealtimeAQI(
    location.lat,
    location.lng,
    {
      pollInterval: 60000,  // 1 minute
      maxRetries: 3,
      retryDelay: 5000
    }
  );

  // Update location when user moves
  useEffect(() => {
    // Location tracking logic here
    setLocation(newLocation);
  }, [newLocation]);

  const status = getStatus();

  return (
    <View>
      <Text>Connection: {status.connectionState}</Text>
      <Text>Last Update: {status.lastUpdate?.toLocaleTimeString()}</Text>
      <Text>Retries: {status.retryCount}</Text>
    </View>
  );
};
```

## Connection States

### Status Types

```typescript
type ConnectionState = 'connected' | 'connecting' | 'disconnected';

interface ServiceStatus {
  isPolling: boolean;
  lastUpdate: Date | null;
  retryCount: number;
  connectionState: ConnectionState;
}
```

### Status Indicators

- **🟢 Connected**: Green indicator, realtime updates active
- **🟡 Connecting**: Yellow indicator, attempting to connect/retry
- **🔴 Disconnected**: Red indicator, offline or error state

## Error Handling

### Automatic Retry Logic

1. **Connection Failure**: Retry up to `maxRetries` times
2. **API Errors**: Exponential backoff with `retryDelay`
3. **Network Issues**: Graceful degradation to cached data
4. **Location Errors**: Fallback to default coordinates

### Error States

```typescript
// Hook returns error object
const { error } = useRealtimeAQI(latitude, longitude);

if (error) {
  console.error('Realtime AQI Error:', error.message);
  // Show user-friendly error message
}
```

## Performance Optimization

### Memory Management

- **Singleton Pattern**: Single service instance across app
- **Automatic Cleanup**: Stops polling when component unmounts
- **Smart Updates**: Only updates UI when data changes

### Battery Optimization

```typescript
// Reduce polling frequency for battery saving
const batteryConfig = {
  pollInterval: 900000,  // 15 minutes
  maxRetries: 2
};
```

### Network Optimization

- **Conditional Updates**: Only fetch when data has changed
- **Background Updates**: Continue polling in background
- **Offline Support**: Cache last known data

## API Integration

### IQAir API Configuration

```typescript
// Environment variables
EXPO_PUBLIC_IQAIR_API_KEY=your_api_key_here
EXPO_PUBLIC_DEFAULT_LAT=6.9271
EXPO_PUBLIC_DEFAULT_LNG=79.8612
```

### API Rate Limits

- **Free Tier**: 10,000 calls/month
- **Production**: Consider paid plans for higher limits
- **Caching**: Implement local caching to reduce API calls

## Testing

### Unit Tests

```typescript
describe('RealtimeAQIService', () => {
  it('should start polling on initialization', () => {
    const service = RealtimeAQIService.getInstance(6.9271, 79.8612);
    service.startPolling();
    expect(service.getStatus().isPolling).toBe(true);
  });

  it('should handle connection failures gracefully', () => {
    // Test retry logic
  });
});
```

### Integration Tests

```typescript
describe('useRealtimeAQI Hook', () => {
  it('should provide realtime data updates', () => {
    const { result } = renderHook(() =>
      useRealtimeAQI(6.9271, 79.8612)
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.isConnected).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

1. **No Updates**
   - Check API key configuration
   - Verify network connectivity
   - Check Firebase Console for API limits

2. **High Battery Usage**
   - Increase poll interval
   - Reduce retry attempts
   - Check for memory leaks

3. **Connection Errors**
   - Verify API endpoint URLs
   - Check network permissions
   - Review error logs for specific issues

### Debug Information

```typescript
// Get detailed status
const status = getStatus();
console.log('Realtime Status:', {
  polling: status.isPolling,
  lastUpdate: status.lastUpdate,
  retries: status.retryCount,
  state: status.connectionState
});
```

## Deployment Considerations

### Production Configuration

```typescript
const productionConfig = {
  pollInterval: 300000,  // 5 minutes
  maxRetries: 3,
  retryDelay: 10000
};
```

### Monitoring

- **Firebase Analytics**: Track user engagement with realtime features
- **Error Reporting**: Monitor connection failures and API errors
- **Performance**: Track update frequency and battery impact

## Future Enhancements

### Planned Features

1. **WebSocket Support**: Real-time push notifications
2. **Background Updates**: iOS/Android background processing
3. **Offline Queue**: Queue updates for when connection returns
4. **Smart Intervals**: Adjust polling based on AQI changes
5. **Push Notifications**: Alert users to AQI changes

### API Improvements

1. **Multiple Providers**: Support for additional AQI APIs
2. **Historical Data**: Cache and display trends
3. **Forecast Data**: Show predicted AQI values
4. **Regional Coverage**: Support for multiple locations

## Support

For issues with realtime AQI implementation:

1. Check the console logs for detailed error messages
2. Verify API key and network connectivity
3. Review Firebase Console for usage limits
4. Test with mock data to isolate API issues

The realtime system is designed to be robust and handle various network conditions gracefully while providing users with the most current air quality information available.
