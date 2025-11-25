import { LatLng } from 'react-native-maps';

export interface RouteSegment {
  coordinates: LatLng[];
  distance: number; // in meters
  duration: number; // in seconds
  steps: string[];
}

export interface CalculatedRoute {
  id: string;
  segments: RouteSegment[];
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
  bounds: {
    northeast: LatLng;
    southwest: LatLng;
  };
  polylineCoordinates: LatLng[];
  summary: string;
}

export interface RouteWithAQI extends CalculatedRoute {
  exposureScore: number;
  pollutionLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  aqiAlongRoute: number[];
  isSafest: boolean;
}

class RouteCalculationService {
  private apiKey: string;

  constructor() {
    // Use Google Maps API Key from environment
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Calculate multiple routes between two points using Google Directions API
   */
  async calculateRoutes(
    origin: LatLng,
    destination: LatLng,
    alternatives: boolean = true
  ): Promise<CalculatedRoute[]> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not found, using mock data');
      return this.getMockRoutes(origin, destination);
    }

    try {
      // Google Routes API endpoint
      const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
      const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
      };
      const body = JSON.stringify({
        origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
        destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
        travelMode: 'DRIVE',
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      const data = await response.json();

      if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
        console.error('Routes API returned no routes:', data);
        return this.getMockRoutes(origin, destination);
      }

      // Only one route returned per request (no alternatives)
      return data.routes.map((route: any, index: number) => {
        const polylineCoordinates = this.decodePolyline(route.polyline.encodedPolyline);
        // Calculate bounds
        let minLat = Number.POSITIVE_INFINITY, minLng = Number.POSITIVE_INFINITY;
        let maxLat = Number.NEGATIVE_INFINITY, maxLng = Number.NEGATIVE_INFINITY;
        for (const coord of polylineCoordinates) {
          minLat = Math.min(minLat, coord.latitude);
          minLng = Math.min(minLng, coord.longitude);
          maxLat = Math.max(maxLat, coord.latitude);
          maxLng = Math.max(maxLng, coord.longitude);
        }
        return {
          id: `route_${index}`,
          segments: [{
            coordinates: polylineCoordinates,
            distance: route.distanceMeters,
            duration: parseInt(route.duration.replace('s', '')),
            steps: ['Start driving'],
          }],
          totalDistance: route.distanceMeters,
          totalDuration: parseInt(route.duration.replace('s', '')),
          bounds: {
            northeast: { latitude: maxLat, longitude: maxLng },
            southwest: { latitude: minLat, longitude: minLng },
          },
          polylineCoordinates,
          summary: `Route ${index + 1}`,
        };
      });
    } catch (error) {
      console.error('Error calculating routes:', error);
      return this.getMockRoutes(origin, destination);
    }
  }

  /**
   * Parse Google Directions API response into our route format
   */
  private parseGoogleRoute(googleRoute: any, index: number): CalculatedRoute {
    const leg = googleRoute.legs[0];
    const polylineCoordinates = this.decodePolyline(googleRoute.overview_polyline.points);

    return {
      id: `route_${index}`,
      segments: googleRoute.legs.map((leg: any) => ({
        coordinates: this.decodePolyline(leg.steps[0]?.polyline?.points || ''),
        distance: leg.distance.value,
        duration: leg.duration.value,
        steps: leg.steps.map((step: any) => step.html_instructions.replace(/<[^>]*>/g, '')),
      })),
      totalDistance: leg.distance.value,
      totalDuration: leg.duration.value,
      bounds: {
        northeast: googleRoute.bounds.northeast,
        southwest: googleRoute.bounds.southwest,
      },
      polylineCoordinates,
      summary: googleRoute.summary || `Route ${index + 1}`,
    };
  }

  /**
   * Decode Google polyline string to coordinates
   */
  private decodePolyline(encoded: string): LatLng[] {
    const coordinates: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  }

  /**
   * Calculate AQI exposure score for a route
   */
  async calculateRouteAQIScore(route: CalculatedRoute): Promise<number> {
    // Sample points along the route for AQI calculation
    const samplePoints = this.sampleRoutePoints(route.polylineCoordinates, 10);
    const aqiValues: number[] = [];

    try {
      // Get AQI data for each sample point
      for (const point of samplePoints) {
        const aqi = await this.getAQIForLocation(point);
        aqiValues.push(aqi);
      }

      // Calculate weighted average based on distance
      const totalScore = aqiValues.reduce((sum, aqi) => sum + aqi, 0);
      return Math.round(totalScore / aqiValues.length);
    } catch (error) {
      console.error('Error calculating AQI score:', error);
      // Return a random score between 20-80 as fallback
      return Math.floor(Math.random() * 60) + 20;
    }
  }

  /**
   * Sample points along a route for AQI analysis
   */
  private sampleRoutePoints(coordinates: LatLng[], numSamples: number): LatLng[] {
    if (coordinates.length <= numSamples) {
      return coordinates;
    }

    const samples: LatLng[] = [];
    const interval = Math.floor(coordinates.length / numSamples);

    for (let i = 0; i < coordinates.length; i += interval) {
      samples.push(coordinates[i]);
    }

    return samples;
  }

  /**
   * Get AQI data for a specific location
   */
  private async getAQIForLocation(location: LatLng): Promise<number> {
    // In a real implementation, this would call an AQI API
    // For now, return a simulated value based on location
    const baseAQI = 50;
    const variation = Math.sin(location.latitude * 100) * Math.cos(location.longitude * 100) * 30;
    return Math.max(10, Math.min(150, Math.round(baseAQI + variation)));
  }

  /**
   * Process routes with AQI data and determine the safest route
   */
  async processRoutesWithAQI(routes: CalculatedRoute[]): Promise<RouteWithAQI[]> {
    const routesWithAQI: RouteWithAQI[] = [];

    for (const route of routes) {
      const exposureScore = await this.calculateRouteAQIScore(route);
      const aqiAlongRoute = await this.getAQIAlongRoute(route);

      routesWithAQI.push({
        ...route,
        exposureScore,
        pollutionLevel: this.getPollutionLevel(exposureScore),
        aqiAlongRoute,
        isSafest: false, // Will be set after comparing all routes
      });
    }

    // Mark the route with the lowest exposure score as safest
    if (routesWithAQI.length > 0) {
      const safestRoute = routesWithAQI.reduce((prev, current) =>
        prev.exposureScore < current.exposureScore ? prev : current
      );
      safestRoute.isSafest = true;
    }

    return routesWithAQI.sort((a, b) => a.exposureScore - b.exposureScore);
  }

  /**
   * Get AQI values along the entire route
   */
  private async getAQIAlongRoute(route: CalculatedRoute): Promise<number[]> {
    const samplePoints = this.sampleRoutePoints(route.polylineCoordinates, 20);
    const aqiValues: number[] = [];

    for (const point of samplePoints) {
      const aqi = await this.getAQIForLocation(point);
      aqiValues.push(aqi);
    }

    return aqiValues;
  }

  /**
   * Determine pollution level based on exposure score
   */
  private getPollutionLevel(exposureScore: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
    if (exposureScore < 30) return 'Low';
    if (exposureScore < 50) return 'Moderate';
    if (exposureScore < 70) return 'High';
    return 'Very High';
  }

  /**
   * Generate mock routes for testing when API is not available
   */
  private getMockRoutes(origin: LatLng, destination: LatLng): CalculatedRoute[] {
    const midLat = (origin.latitude + destination.latitude) / 2;
    const midLng = (origin.longitude + destination.longitude) / 2;

    return [
      {
        id: 'route_1',
        segments: [{
          coordinates: [origin, destination],
          distance: this.calculateDistance(origin, destination),
          duration: 720, // 12 minutes
          steps: ['Head towards destination', 'Continue straight', 'Arrive at destination'],
        }],
        totalDistance: this.calculateDistance(origin, destination),
        totalDuration: 720,
        bounds: {
          northeast: {
            latitude: Math.max(origin.latitude, destination.latitude),
            longitude: Math.max(origin.longitude, destination.longitude),
          },
          southwest: {
            latitude: Math.min(origin.latitude, destination.latitude),
            longitude: Math.min(origin.longitude, destination.longitude),
          },
        },
        polylineCoordinates: [origin, destination],
        summary: 'Direct Route',
      },
      {
        id: 'route_2',
        segments: [{
          coordinates: [
            origin,
            { latitude: midLat + 0.005, longitude: midLng + 0.005 },
            destination,
          ],
          distance: this.calculateDistance(origin, destination) * 1.2,
          duration: 900, // 15 minutes
          steps: ['Head north', 'Turn right', 'Continue to destination'],
        }],
        totalDistance: this.calculateDistance(origin, destination) * 1.2,
        totalDuration: 900,
        bounds: {
          northeast: {
            latitude: Math.max(origin.latitude, destination.latitude) + 0.005,
            longitude: Math.max(origin.longitude, destination.longitude) + 0.005,
          },
          southwest: {
            latitude: Math.min(origin.latitude, destination.latitude),
            longitude: Math.min(origin.longitude, destination.longitude),
          },
        },
        polylineCoordinates: [
          origin,
          { latitude: midLat + 0.005, longitude: midLng + 0.005 },
          destination,
        ],
        summary: 'Northern Route',
      },
      {
        id: 'route_3',
        segments: [{
          coordinates: [
            origin,
            { latitude: midLat - 0.005, longitude: midLng - 0.005 },
            destination,
          ],
          distance: this.calculateDistance(origin, destination) * 1.15,
          duration: 840, // 14 minutes
          steps: ['Head south', 'Turn left', 'Continue to destination'],
        }],
        totalDistance: this.calculateDistance(origin, destination) * 1.15,
        totalDuration: 840,
        bounds: {
          northeast: {
            latitude: Math.max(origin.latitude, destination.latitude),
            longitude: Math.max(origin.longitude, destination.longitude),
          },
          southwest: {
            latitude: Math.min(origin.latitude, destination.latitude) - 0.005,
            longitude: Math.min(origin.longitude, destination.longitude) - 0.005,
          },
        },
        polylineCoordinates: [
          origin,
          { latitude: midLat - 0.005, longitude: midLng - 0.005 },
          destination,
        ],
        summary: 'Southern Route',
      },
    ];
  }

  /**
   * Calculate distance between two points in meters (Haversine formula)
   */
  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }
}

export default new RouteCalculationService();