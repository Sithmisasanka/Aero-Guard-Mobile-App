// AI-Powered Health Recommendation Service
import { UserProfile, AQIData } from '../types';

export interface HealthRecommendation {
  id: string;
  type: 'exercise' | 'medication' | 'lifestyle' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actions: string[];
  timeRelevant: boolean;
  healthConditionSpecific?: string[];
}

export class AIRecommendationService {
  /**
   * Generate personalized recommendations based on user profile and current AQI
   */
  static generateRecommendations(
    userProfile: UserProfile,
    currentAQI: AQIData,
    weatherData?: any
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Exercise recommendations based on AQI and health conditions
    if (currentAQI.aqi <= 50) {
      recommendations.push({
        id: 'outdoor_exercise_safe',
        type: 'exercise',
        priority: 'medium',
        title: 'Perfect time for outdoor activities!',
        description: 'Air quality is excellent. Great time for running, cycling, or outdoor sports.',
        actions: ['Go for a run', 'Plan outdoor workout', 'Take a walk in the park'],
        timeRelevant: true
      });
    } else if (currentAQI.aqi > 150) {
      recommendations.push({
        id: 'indoor_exercise_only',
        type: 'exercise',
        priority: 'high',
        title: 'Stay indoors for exercise',
        description: 'Air quality is unhealthy. Avoid outdoor activities and exercise indoors.',
        actions: ['Use indoor gym', 'Home workout', 'Close windows and doors'],
        timeRelevant: true,
        healthConditionSpecific: ['asthma', 'respiratoryIssues', 'heartDisease']
      });
    }

    // Health condition specific recommendations
    if (userProfile.healthConditions.some(c => c.name === 'asthma' && c.isActive)) {
      recommendations.push({
        id: 'asthma_medication_reminder',
        type: 'medication',
        priority: currentAQI.aqi > 100 ? 'high' : 'medium',
        title: 'Keep your inhaler handy',
        description: 'Given current air quality levels, ensure you have your rescue inhaler available.',
        actions: ['Check inhaler expiry', 'Keep inhaler nearby', 'Monitor symptoms'],
        timeRelevant: false,
        healthConditionSpecific: ['asthma']
      });
    }

    return recommendations;
  }

  /**
   * Get emergency recommendations for severe pollution events
   */
  static getEmergencyRecommendations(aqi: number): HealthRecommendation[] {
    if (aqi > 300) {
      return [{
        id: 'emergency_hazardous',
        type: 'emergency',
        priority: 'critical',
        title: 'HEALTH EMERGENCY - Stay Indoors',
        description: 'Air quality is hazardous to all. Avoid all outdoor activities.',
        actions: [
          'Stay indoors with windows closed',
          'Use air purifier if available',
          'Seek medical attention if experiencing symptoms',
          'Avoid all outdoor exercise'
        ],
        timeRelevant: true
      }];
    }
    return [];
  }
}