# Location-Based AQI Data with Fallback Support

This guide explains how the AeroGuard app handles location services and provides fallback support when location data cannot be obtained.

## Overview

The app implements a robust location system that:

- **Requests user location** for accurate, local AQI data
- **Handles permission states** gracefully (granted/denied/unavailable)
- **Provides fallback to mock data** when location is unavailable
- **Shows clear warnings** to users about data source
- **Allows manual retry** for location requests

## Location Permission Flow

### 1. Initial Location Request

```typescript
// Check if location services are available
const isLocationAvailable = await Location.hasServicesEnabledAsync();

// Request foreground location permissions
const { status } = await Location.requestForegroundPermissionsAsync();
```

### 2. Permission States

- **`granted`**: Location access approved, get current position
- **`denied`**: Location access denied, use default coordinates
- **`unavailable`**: Location services disabled, use default coordinates

### 3. Location Accuracy

```typescript
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced, // Good balance of speed vs accuracy
});
```

## Data Source Indicators

### Location Status Display

The app shows different indicators based on location status:

```typescript
const locationStatus = 'granted' | 'denied' | 'unavailable' | 'loading';
```

### UI Indicators

1. **Location Text**: Shows city/country with data source
   ```
   Colombo, Sri Lanka (Default)  // When using mock data
   Colombo, Sri Lanka           // When using real location
   ```

2. **Warning Banner**: Appears when using fallback data
   ```
   📍 Using Default Location Data
   Unable to access your location. Showing air quality data for Colombo, Sri Lanka.
   [Try Again Button]
   ```

3. **Status Indicator**: Shows connection state
   ```
   🟢 Live     // Connected and receiving data
   🟡 Connecting...  // Attempting to connect
   🔴 Offline  // Disconnected
   ```

## Mock Data Configuration

### Environment Variables

```bash
# Default location (fallback when GPS unavailable)
EXPO_PUBLIC_DEFAULT_LAT=6.9271
EXPO_PUBLIC_DEFAULT_LNG=79.8612
EXPO_PUBLIC_DEFAULT_CITY=Colombo
EXPO_PUBLIC_DEFAULT_COUNTRY=Sri Lanka

# Force mock data mode (for development/testing)
EXPO_PUBLIC_USE_MOCK_DATA=true
```

### Mock Data Structure

```typescript
const MOCK_AQI_DATA = {
  aqi: 65,
  city: 'Colombo',
  country: 'Sri Lanka',
  station: 'Demo Station',
  timestamp: new Date().toISOString(),
  coordinates: {
    latitude: 6.9271,
    longitude: 79.8612,
  },
  pollutants: {
    pm25: 65,
    pm10: 45,
    o3: 30,
    no2: 25,
    so2: 10,
    co: 15,
  },
};
```

## Error Handling Scenarios

### 1. Location Services Disabled

**User Experience**:
- Warning banner appears
- "Location services are disabled" message
- Uses default Colombo location
- "Try Again" button available

**Code Handling**:
```typescript
if (!isLocationAvailable) {
  setLocationStatus('unavailable');
  setLocationError('Location services are disabled on this device');
  setIsUsingMockData(true);
}
```

### 2. Permission Denied

**User Experience**:
- Warning banner with explanation
- "Location permission denied" message
- Uses default location
- "Try Again" button to re-request permission

**Code Handling**:
```typescript
if (status === 'denied') {
  setLocationStatus('denied');
  setLocationError('Location permission denied. Using default location.');
  setIsUsingMockData(true);
}
```

### 3. Location Timeout/Network Error

**User Experience**:
- Automatic retry with backoff
- Fallback to default location
- Clear error messaging

**Code Handling**:
```typescript
} catch (locationError: any) {
  setLocationStatus('unavailable');
  setLocationError(`Unable to get location: ${locationError.message}`);
  setIsUsingMockData(true);
}
```

## User Interface States

### Loading State

Shows spinner with location status:
```
Loading air quality data...
Getting your location...
```

### Permission Request State

Shows permission request button:
```
Location permission is required for accurate AQI data
[Grant Location Permission Button]
```

### Error State

Shows detailed error with retry option:
```
Unable to load air quality data
Please check your internet connection and try again.
Currently showing sample data. Enable location services for real-time local data.
[Retry Button]
```

### Success State

Shows location with data source indicator:
```
📍 Colombo, Sri Lanka (Default)
🟢 Live
[Refresh Button]
```

## Testing Scenarios

### Development Testing

1. **Mock Data Mode**:
   ```bash
   EXPO_PUBLIC_USE_MOCK_DATA=true
   ```
   - Forces use of mock data
   - Shows "(Default)" indicator
   - Warning banner appears

2. **Location Permission Testing**:
   - iOS Simulator: Features → Location → Custom Location
   - Physical Device: Settings → Privacy → Location Services

3. **Network Error Simulation**:
   - Airplane mode to test offline behavior
   - Poor network to test timeout handling

### Production Testing

1. **Fresh Install**: Test permission request flow
2. **Permission Denied**: Test fallback behavior
3. **Location Services Off**: Test service availability check
4. **Background/Resume**: Test location on app resume

## Performance Considerations

### Battery Optimization

- **Single Location Request**: Only requests location once on app start
- **Balanced Accuracy**: Uses `Accuracy.Balanced` for good speed/accuracy balance
- **No Continuous Tracking**: Doesn't track location continuously

### Network Optimization

- **Conditional API Calls**: Only calls AQI API when location is available
- **Mock Data Fallback**: No network calls when using mock data
- **Error Retry Logic**: Prevents excessive API calls on failure

## Privacy & Security

### Location Data Handling

- **Foreground Only**: Uses foreground location permission
- **One-Time Request**: Doesn't continuously monitor location
- **Local Processing**: Location data processed locally
- **No Storage**: Location coordinates not stored permanently

### Permission Best Practices

- **Clear Explanation**: Users understand why location is needed
- **Graceful Fallback**: App works without location permission
- **Retry Option**: Users can grant permission later
- **Transparent Communication**: Clear indicators about data source

## Troubleshooting

### Common Issues

1. **"Location services disabled"**
   - Solution: Enable location services in device settings
   - Fallback: Uses default location automatically

2. **"Location permission denied"**
   - Solution: Grant permission in app settings
   - Fallback: Uses default location with retry option

3. **"Unable to get location"**
   - Solution: Check GPS signal, try moving to open area
   - Fallback: Automatic retry with default location

### Debug Information

Enable logging to troubleshoot location issues:

```typescript
// Location request logging
console.log('Location status:', locationStatus);
console.log('Using mock data:', isUsingMockData);
console.log('Location error:', locationError);

// API call logging
console.log('AQI API called with coordinates:', latitude, longitude);
console.log('API response:', aqiData);
```

## Future Enhancements

### Planned Features

1. **Background Location**: For continuous monitoring
2. **Location History**: Track location changes over time
3. **Geofencing**: Alert when entering high-pollution areas
4. **Weather Integration**: Combine weather and AQI data
5. **Route Planning**: AQI-aware navigation suggestions

### Advanced Location Features

1. **Reverse Geocoding**: Convert coordinates to city names
2. **Location Accuracy**: Show GPS accuracy information
3. **Altitude Data**: Include elevation in AQI calculations
4. **Movement Detection**: Update location when user moves significantly

## Implementation Files

- `src/components/ModernAQIDisplay.tsx` - Main location and data display logic
- `src/services/aqiService.ts` - AQI data fetching with mock data support
- `src/services/realtimeAQIService.ts` - Realtime data updates
- Environment variables in `.env` - Location and mock data configuration

The location system is designed to be user-friendly, privacy-conscious, and robust, ensuring users always have access to air quality information regardless of their location permissions or device capabilities.
