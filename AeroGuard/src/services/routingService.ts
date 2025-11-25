import { AQIService } from './aqiService';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteWaypoint extends LatLng {
  aqi?: number;
  airQualityStatus?: string;
}

export interface AQIAwareRoute {
  id: string;
  name: string;
  waypoints: RouteWaypoint[];
  distance: number; // in meters
  duration: number; // in seconds
  averageAQI: number;
  maxAQI: number;
  minAQI: number;
  healthRisk: 'low' | 'moderate' | 'high' | 'very-high';
  recommendedFor: string[];
  warnings: string[];
  color: string;
}

export interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  userHealthProfile?: any;
  routePreference: 'fastest' | 'safest' | 'balanced';
  avoidHighAQI?: boolean;
  maxAQIThreshold?: number;
}

class RoutingService {
  private static instance: RoutingService;
  private readonly GOOGLE_ROUTES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_ROUTES_API_KEY;

  public static getInstance(): RoutingService {
    if (!RoutingService.instance) {
      RoutingService.instance = new RoutingService();
    }
    return RoutingService.instance;
  }

  constructor() {
    // AQIService uses static methods, no instance needed
  }

  async getAQIAwareRoutes(request: RouteRequest): Promise<AQIAwareRoute[]> {
    try {
      // Get multiple route alternatives from Google Routes API
      const routeAlternatives = await this.getRouteAlternatives(request.origin, request.destination);
      
      // Enhance each route with AQI data
      const aqiAwareRoutes = await Promise.all(
        routeAlternatives.map(route => this.enhanceRouteWithAQI(route, request.userHealthProfile))
      );

      // Sort routes based on user preference
      return this.sortRoutesByPreference(aqiAwareRoutes, request.routePreference, request.userHealthProfile);
    } catch (error) {
      console.error('Error getting AQI-aware routes:', error);
      // Return mock routes as fallback
      return this.getMockAQIAwareRoutes(request.origin, request.destination, request.userHealthProfile);
    }
  }

  private async getRouteAlternatives(origin: LatLng, destination: LatLng): Promise<any[]> {
    if (!this.GOOGLE_ROUTES_API_KEY) {
      console.warn('Google Routes API key not configured, using mock data');
      return this.generateMockRoutes(origin, destination);
    }

    try {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.GOOGLE_ROUTES_API_KEY,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps'
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: origin.latitude,
                longitude: origin.longitude
              }
            }
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.latitude,
                longitude: destination.longitude
              }
            }
          },
          travelMode: 'WALK',
          routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
          computeAlternativeRoutes: true,
          routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google Routes API error: ${response.status}`);
      }

      const data = await response.json();
      return data.routes || [];
    } catch (error) {
      console.error('Google Routes API error:', error);
      return this.generateMockRoutes(origin, destination);
    }
  }

  private generateMockRoutes(origin: LatLng, destination: LatLng): any[] {
    const routes = [];
    
    // Generate 3 different mock routes
    for (let i = 0; i < 3; i++) {
      const route = {
        duration: `${300 + i * 120}s`,
        distanceMeters: 1000 + i * 500,
        legs: [{
          steps: this.generateMockSteps(origin, destination, i)
        }]
      };
      routes.push(route);
    }
    
    return routes;
  }

  private generateMockSteps(origin: LatLng, destination: LatLng, routeIndex: number): any[] {
    const steps = [];
    const stepCount = 5 + routeIndex * 2;
    
    for (let i = 0; i <= stepCount; i++) {
      const progress = i / stepCount;
      const latOffset = (destination.latitude - origin.latitude) * progress;
      const lngOffset = (destination.longitude - origin.longitude) * progress;
      
      // Add some variation for different routes
      const variation = routeIndex * 0.001;
      const randomOffset = (Math.random() - 0.5) * variation;
      
      steps.push({
        startLocation: {
          latLng: {
            latitude: origin.latitude + latOffset + randomOffset,
            longitude: origin.longitude + lngOffset + randomOffset
          }
        }
      });
    }
    
    return steps;
  }

  private async enhanceRouteWithAQI(route: any, userHealthProfile?: any): Promise<AQIAwareRoute> {
    // Extract waypoints from route
    const waypoints = this.extractWaypoints(route);
    
    // Get AQI data for each waypoint
    const enhancedWaypoints = await Promise.all(
      waypoints.map(async (waypoint) => {
        try {
          const aqiData = await AQIService.getCurrentAQI(waypoint.latitude, waypoint.longitude);
          if (aqiData) {
            return {
              ...waypoint,
              aqi: aqiData.aqi,
              airQualityStatus: this.getAQIStatus(aqiData.aqi)
            };
          } else {
            const mockAQI = this.generateMockAQI(waypoint);
            return {
              ...waypoint,
              aqi: mockAQI,
              airQualityStatus: this.getAQIStatus(mockAQI)
            };
          }
        } catch (error) {
          // Use mock AQI data if API fails
          const mockAQI = this.generateMockAQI(waypoint);
          return {
            ...waypoint,
            aqi: mockAQI,
            airQualityStatus: this.getAQIStatus(mockAQI)
          };
        }
      })
    );

    // Calculate route statistics
    const aqiValues = enhancedWaypoints.map(w => w.aqi || 50).filter(aqi => aqi !== undefined);
    const averageAQI = aqiValues.reduce((sum, aqi) => sum + aqi, 0) / aqiValues.length;
    const maxAQI = Math.max(...aqiValues);
    const minAQI = Math.min(...aqiValues);

    // Determine health risk and recommendations
    const { healthRisk, recommendedFor, warnings } = this.analyzeRouteHealth(
      averageAQI, 
      maxAQI, 
      userHealthProfile
    );

    return {
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateRouteName(averageAQI, enhancedWaypoints),
      waypoints: enhancedWaypoints,
      distance: route.distanceMeters || 1000,
      duration: parseInt(route.duration?.replace('s', '') || '600'),
      averageAQI,
      maxAQI,
      minAQI,
      healthRisk,
      recommendedFor,
      warnings,
      color: this.getRouteColor(averageAQI)
    };
  }

  private extractWaypoints(route: any): LatLng[] {
    const waypoints: LatLng[] = [];
    
    if (route.legs && route.legs[0] && route.legs[0].steps) {
      route.legs[0].steps.forEach((step: any) => {
        if (step.startLocation && step.startLocation.latLng) {
          waypoints.push({
            latitude: step.startLocation.latLng.latitude,
            longitude: step.startLocation.latLng.longitude
          });
        }
      });
    }
    
    // If no waypoints extracted, create some mock ones
    if (waypoints.length === 0) {
      for (let i = 0; i <= 5; i++) {
        waypoints.push({
          latitude: 6.9271 + (i * 0.001),
          longitude: 79.8612 + (i * 0.001)
        });
      }
    }
    
    return waypoints;
  }

  private generateMockAQI(waypoint: LatLng): number {
    // Generate AQI based on location (simulate urban vs rural areas)
    const urbanCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo
    const distance = this.calculateDistance(
      waypoint.latitude, 
      waypoint.longitude, 
      urbanCenter.lat, 
      urbanCenter.lng
    );
    
    // Closer to urban center = higher AQI
    const baseAQI = Math.max(30, 150 - (distance * 10));
    const randomVariation = (Math.random() - 0.5) * 40;
    
    return Math.round(Math.max(10, Math.min(300, baseAQI + randomVariation)));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getAQIStatus(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  private analyzeRouteHealth(averageAQI: number, maxAQI: number, userHealthProfile?: any): {
    healthRisk: 'low' | 'moderate' | 'high' | 'very-high';
    recommendedFor: string[];
    warnings: string[];
  } {
    let healthRisk: 'low' | 'moderate' | 'high' | 'very-high' = 'low';
    const recommendedFor: string[] = [];
    const warnings: string[] = [];

    // Analyze based on AQI levels
    if (maxAQI <= 50) {
      healthRisk = 'low';
      recommendedFor.push('Everyone', 'Children', 'Elderly', 'People with health conditions');
    } else if (maxAQI <= 100) {
      healthRisk = 'moderate';
      recommendedFor.push('Healthy adults', 'Children (with supervision)');
      if (userHealthProfile?.healthConditions?.length > 0) {
        warnings.push('Consider shorter exposure for sensitive individuals');
      }
    } else if (maxAQI <= 150) {
      healthRisk = 'high';
      recommendedFor.push('Healthy adults only');
      warnings.push('Not recommended for children, elderly, or people with health conditions');
    } else {
      healthRisk = 'very-high';
      warnings.push('Not recommended for outdoor activities');
      warnings.push('Consider alternative transportation');
    }

    // Additional warnings based on user health profile
    if (userHealthProfile?.healthConditions) {
      const conditions = userHealthProfile.healthConditions.map((c: any) => c.id);
      
      if (conditions.includes('asthma') && averageAQI > 100) {
        warnings.push('⚠️ High risk for asthma sufferers - carry rescue inhaler');
      }
      
      if (conditions.includes('heartDisease') && averageAQI > 100) {
        warnings.push('⚠️ Increased cardiovascular risk - consider alternative route');
      }
      
      if (conditions.includes('copd') && averageAQI > 75) {
        warnings.push('⚠️ Not recommended for COPD patients');
      }
      
      if ((conditions.includes('pregnancy') || conditions.includes('childUnder12')) && averageAQI > 100) {
        warnings.push('⚠️ Not recommended for pregnant women or young children');
      }
    }

    return { healthRisk, recommendedFor, warnings };
  }

  private generateRouteName(averageAQI: number, waypoints: RouteWaypoint[]): string {
    const status = this.getAQIStatus(averageAQI);
    const routeTypes = ['Direct', 'Scenic', 'Park', 'Coastal', 'Urban', 'Residential'];
    const randomType = routeTypes[Math.floor(Math.random() * routeTypes.length)];
    
    if (averageAQI <= 50) {
      return `${randomType} Route (Clean Air)`;
    } else if (averageAQI <= 100) {
      return `${randomType} Route (Moderate Air)`;
    } else {
      return `${randomType} Route (Poor Air Quality)`;
    }
  }

  private getRouteColor(averageAQI: number): string {
    if (averageAQI <= 50) return '#4ECDC4'; // Good - Teal
    if (averageAQI <= 100) return '#45B7D1'; // Moderate - Blue
    if (averageAQI <= 150) return '#FFA726'; // Unhealthy for Sensitive - Orange
    if (averageAQI <= 200) return '#FF6B6B'; // Unhealthy - Red
    if (averageAQI <= 300) return '#9C27B0'; // Very Unhealthy - Purple
    return '#795548'; // Hazardous - Brown
  }

  private sortRoutesByPreference(
    routes: AQIAwareRoute[], 
    preference: 'fastest' | 'safest' | 'balanced',
    userHealthProfile?: any
  ): AQIAwareRoute[] {
    return routes.sort((a, b) => {
      switch (preference) {
        case 'fastest':
          return a.duration - b.duration;
        
        case 'safest':
          // Prioritize lower AQI, then shorter duration
          const aqiDiff = a.averageAQI - b.averageAQI;
          if (Math.abs(aqiDiff) > 10) return aqiDiff;
          return a.duration - b.duration;
        
        case 'balanced':
        default:
          // Balance between AQI and duration
          const aScore = (a.averageAQI / 100) + (a.duration / 600);
          const bScore = (b.averageAQI / 100) + (b.duration / 600);
          return aScore - bScore;
      }
    });
  }

  private async getMockAQIAwareRoutes(
    origin: LatLng, 
    destination: LatLng, 
    userHealthProfile?: any
  ): Promise<AQIAwareRoute[]> {
    const mockRoutes: AQIAwareRoute[] = [
      {
        id: 'mock_route_1',
        name: 'Park Route (Clean Air)',
        waypoints: [
          { latitude: origin.latitude, longitude: origin.longitude, aqi: 45, airQualityStatus: 'Good' },
          { latitude: origin.latitude + 0.002, longitude: origin.longitude + 0.002, aqi: 38, airQualityStatus: 'Good' },
          { latitude: destination.latitude, longitude: destination.longitude, aqi: 42, airQualityStatus: 'Good' }
        ],
        distance: 1200,
        duration: 480,
        averageAQI: 42,
        maxAQI: 45,
        minAQI: 38,
        healthRisk: 'low',
        recommendedFor: ['Everyone', 'Children', 'Elderly', 'People with health conditions'],
        warnings: [],
        color: '#4ECDC4'
      },
      {
        id: 'mock_route_2',
        name: 'Direct Route (Moderate Air)',
        waypoints: [
          { latitude: origin.latitude, longitude: origin.longitude, aqi: 78, airQualityStatus: 'Moderate' },
          { latitude: origin.latitude + 0.001, longitude: origin.longitude + 0.001, aqi: 85, airQualityStatus: 'Moderate' },
          { latitude: destination.latitude, longitude: destination.longitude, aqi: 72, airQualityStatus: 'Moderate' }
        ],
        distance: 800,
        duration: 360,
        averageAQI: 78,
        maxAQI: 85,
        minAQI: 72,
        healthRisk: 'moderate',
        recommendedFor: ['Healthy adults', 'Children (with supervision)'],
        warnings: userHealthProfile?.healthConditions?.length > 0 ? 
          ['Consider shorter exposure for sensitive individuals'] : [],
        color: '#45B7D1'
      },
      {
        id: 'mock_route_3',
        name: 'Urban Route (Poor Air Quality)',
        waypoints: [
          { latitude: origin.latitude, longitude: origin.longitude, aqi: 125, airQualityStatus: 'Unhealthy for Sensitive Groups' },
          { latitude: origin.latitude + 0.0005, longitude: origin.longitude + 0.0015, aqi: 142, airQualityStatus: 'Unhealthy for Sensitive Groups' },
          { latitude: destination.latitude, longitude: destination.longitude, aqi: 118, airQualityStatus: 'Unhealthy for Sensitive Groups' }
        ],
        distance: 600,
        duration: 300,
        averageAQI: 128,
        maxAQI: 142,
        minAQI: 118,
        healthRisk: 'high',
        recommendedFor: ['Healthy adults only'],
        warnings: [
          'Not recommended for children, elderly, or people with health conditions',
          ...(userHealthProfile?.healthConditions?.some((c: any) => ['asthma', 'copd', 'heartDisease'].includes(c.id)) ? 
            ['⚠️ High risk for your health condition - consider alternative route'] : [])
        ],
        color: '#FFA726'
      }
    ];

    return mockRoutes;
  }

  // Utility method to get current air quality for a location
  async getLocationAQI(location: LatLng): Promise<{ aqi: number; status: string }> {
    try {
      const aqiData = await AQIService.getCurrentAQI(location.latitude, location.longitude);
      if (aqiData) {
        return {
          aqi: aqiData.aqi,
          status: this.getAQIStatus(aqiData.aqi)
        };
      } else {
        // Return mock data if API fails
        const mockAQI = this.generateMockAQI(location);
        return {
          aqi: mockAQI,
          status: this.getAQIStatus(mockAQI)
        };
      }
    } catch (error) {
      // Return mock data if API fails
      const mockAQI = this.generateMockAQI(location);
      return {
        aqi: mockAQI,
        status: this.getAQIStatus(mockAQI)
      };
    }
  }
}

export default RoutingService;