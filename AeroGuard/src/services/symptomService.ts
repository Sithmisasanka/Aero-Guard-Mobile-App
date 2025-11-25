import { HealthCondition } from '../types';

// Symptom severity levels
export type SymptomSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

// Symptom interface
export interface Symptom {
  id: string;
  name: string;
  description: string;
  severity: SymptomSeverity;
  category: 'respiratory' | 'cardiovascular' | 'general' | 'sensory';
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendation: string;
}

// Health condition-specific symptoms database
const CONDITION_SYMPTOMS: Record<string, Record<string, Symptom[]>> = {
  asthma: {
    // AQI 0-50 (Good)
    good: [],
    // AQI 51-100 (Moderate)
    moderate: [
      {
        id: 'asthma_mild_cough',
        name: 'Mild Cough',
        description: 'Occasional dry cough, especially in the morning',
        severity: 'mild',
        category: 'respiratory',
        urgencyLevel: 'low',
        recommendation: 'Keep rescue inhaler nearby, monitor symptoms'
      }
    ],
    // AQI 101-150 (Unhealthy for Sensitive)
    unhealthySensitive: [
      {
        id: 'asthma_chest_tightness',
        name: 'Chest Tightness',
        description: 'Feeling of pressure or tightness in chest',
        severity: 'moderate',
        category: 'respiratory',
        urgencyLevel: 'medium',
        recommendation: 'Use rescue inhaler, avoid outdoor activities'
      },
      {
        id: 'asthma_shortness_breath',
        name: 'Shortness of Breath',
        description: 'Difficulty breathing during normal activities',
        severity: 'moderate',
        category: 'respiratory',
        urgencyLevel: 'medium',
        recommendation: 'Stay indoors, use prescribed medications'
      }
    ],
    // AQI 151+ (Unhealthy and above)
    unhealthy: [
      {
        id: 'asthma_severe_breathing',
        name: 'Severe Breathing Difficulty',
        description: 'Significant difficulty breathing, wheezing sounds',
        severity: 'severe',
        category: 'respiratory',
        urgencyLevel: 'high',
        recommendation: 'Seek immediate medical attention, use emergency medications'
      },
      {
        id: 'asthma_persistent_cough',
        name: 'Persistent Cough',
        description: 'Continuous coughing with possible mucus production',
        severity: 'severe',
        category: 'respiratory',
        urgencyLevel: 'high',
        recommendation: 'Contact healthcare provider immediately'
      }
    ]
  },
  
  heartDisease: {
    good: [],
    moderate: [
      {
        id: 'heart_mild_fatigue',
        name: 'Mild Fatigue',
        description: 'Feeling more tired than usual during activities',
        severity: 'mild',
        category: 'cardiovascular',
        urgencyLevel: 'low',
        recommendation: 'Reduce physical activity, rest frequently'
      }
    ],
    unhealthySensitive: [
      {
        id: 'heart_chest_discomfort',
        name: 'Chest Discomfort',
        description: 'Mild chest pain or pressure during exertion',
        severity: 'moderate',
        category: 'cardiovascular',
        urgencyLevel: 'medium',
        recommendation: 'Avoid strenuous activities, monitor blood pressure'
      },
      {
        id: 'heart_palpitations',
        name: 'Heart Palpitations',
        description: 'Irregular or rapid heartbeat',
        severity: 'moderate',
        category: 'cardiovascular',
        urgencyLevel: 'medium',
        recommendation: 'Rest, avoid outdoor exposure, take prescribed medications'
      }
    ],
    unhealthy: [
      {
        id: 'heart_severe_chest_pain',
        name: 'Severe Chest Pain',
        description: 'Intense chest pain, especially during minimal activity',
        severity: 'severe',
        category: 'cardiovascular',
        urgencyLevel: 'emergency',
        recommendation: 'EMERGENCY: Call emergency services immediately'
      }
    ]
  },

  copd: {
    good: [],
    moderate: [
      {
        id: 'copd_mild_shortness',
        name: 'Mild Shortness of Breath',
        description: 'Slight difficulty breathing during activities',
        severity: 'mild',
        category: 'respiratory',
        urgencyLevel: 'low',
        recommendation: 'Use bronchodilator as prescribed, pace activities'
      }
    ],
    unhealthySensitive: [
      {
        id: 'copd_increased_mucus',
        name: 'Increased Mucus Production',
        description: 'More phlegm than usual, change in color',
        severity: 'moderate',
        category: 'respiratory',
        urgencyLevel: 'medium',
        recommendation: 'Stay hydrated, use prescribed medications, avoid outdoor air'
      },
      {
        id: 'copd_wheezing',
        name: 'Wheezing',
        description: 'Whistling sound when breathing',
        severity: 'moderate',
        category: 'respiratory',
        urgencyLevel: 'medium',
        recommendation: 'Use inhaler, avoid polluted air, contact healthcare provider'
      }
    ],
    unhealthy: [
      {
        id: 'copd_severe_breathlessness',
        name: 'Severe Breathlessness',
        description: 'Extreme difficulty breathing even at rest',
        severity: 'severe',
        category: 'respiratory',
        urgencyLevel: 'emergency',
        recommendation: 'EMERGENCY: Seek immediate medical attention'
      }
    ]
  },

  allergies: {
    good: [],
    moderate: [
      {
        id: 'allergy_sneezing',
        name: 'Sneezing',
        description: 'Frequent sneezing, especially outdoors',
        severity: 'mild',
        category: 'sensory',
        urgencyLevel: 'low',
        recommendation: 'Take antihistamines, limit outdoor exposure'
      },
      {
        id: 'allergy_runny_nose',
        name: 'Runny Nose',
        description: 'Clear nasal discharge, congestion',
        severity: 'mild',
        category: 'sensory',
        urgencyLevel: 'low',
        recommendation: 'Use nasal spray, stay indoors when possible'
      }
    ],
    unhealthySensitive: [
      {
        id: 'allergy_itchy_eyes',
        name: 'Itchy, Watery Eyes',
        description: 'Eyes feel irritated, excessive tearing',
        severity: 'moderate',
        category: 'sensory',
        urgencyLevel: 'medium',
        recommendation: 'Use eye drops, avoid rubbing eyes, stay indoors'
      },
      {
        id: 'allergy_skin_irritation',
        name: 'Skin Irritation',
        description: 'Itchy, red, or inflamed skin',
        severity: 'moderate',
        category: 'sensory',
        urgencyLevel: 'medium',
        recommendation: 'Apply moisturizer, avoid outdoor activities'
      }
    ],
    unhealthy: [
      {
        id: 'allergy_severe_reaction',
        name: 'Severe Allergic Reaction',
        description: 'Difficulty breathing, swelling, severe rash',
        severity: 'severe',
        category: 'general',
        urgencyLevel: 'emergency',
        recommendation: 'EMERGENCY: Use epinephrine if available, call emergency services'
      }
    ]
  },

  // General symptoms for vulnerable populations
  pregnancy: {
    good: [],
    moderate: [
      {
        id: 'pregnancy_nausea',
        name: 'Increased Nausea',
        description: 'Morning sickness may worsen with air pollution',
        severity: 'mild',
        category: 'general',
        urgencyLevel: 'low',
        recommendation: 'Stay indoors, use air purifier, consult doctor if severe'
      }
    ],
    unhealthySensitive: [
      {
        id: 'pregnancy_headache',
        name: 'Headaches',
        description: 'More frequent or intense headaches',
        severity: 'moderate',
        category: 'general',
        urgencyLevel: 'medium',
        recommendation: 'Avoid outdoor exposure, rest in clean air environment'
      }
    ],
    unhealthy: [
      {
        id: 'pregnancy_breathing_difficulty',
        name: 'Breathing Difficulty',
        description: 'Shortness of breath beyond normal pregnancy symptoms',
        severity: 'severe',
        category: 'respiratory',
        urgencyLevel: 'high',
        recommendation: 'Contact healthcare provider immediately'
      }
    ]
  },

  elderlyAge: {
    good: [],
    moderate: [
      {
        id: 'elderly_fatigue',
        name: 'Increased Fatigue',
        description: 'Feeling more tired than usual',
        severity: 'mild',
        category: 'general',
        urgencyLevel: 'low',
        recommendation: 'Rest frequently, limit outdoor activities'
      }
    ],
    unhealthySensitive: [
      {
        id: 'elderly_confusion',
        name: 'Mild Confusion',
        description: 'Slight difficulty concentrating or remembering',
        severity: 'moderate',
        category: 'general',
        urgencyLevel: 'medium',
        recommendation: 'Stay indoors, ensure adequate hydration'
      }
    ],
    unhealthy: [
      {
        id: 'elderly_severe_symptoms',
        name: 'Severe Health Decline',
        description: 'Significant worsening of existing conditions',
        severity: 'severe',
        category: 'general',
        urgencyLevel: 'high',
        recommendation: 'Contact healthcare provider immediately'
      }
    ]
  }
};

// AQI level mapping
const getAQICategory = (aqi: number): string => {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthySensitive';
  return 'unhealthy';
};

export class SymptomService {
  /**
   * Get symptoms for specific health conditions based on current AQI
   */
  static getSymptomsForConditions(
    healthConditions: HealthCondition[],
    currentAQI: number
  ): Symptom[] {
    const aqiCategory = getAQICategory(currentAQI);
    const symptoms: Symptom[] = [];

    healthConditions.forEach(condition => {
      if (condition.isActive && CONDITION_SYMPTOMS[condition.id]) {
        const conditionSymptoms = CONDITION_SYMPTOMS[condition.id][aqiCategory] || [];
        
        // Adjust symptom severity based on user's condition severity
        const adjustedSymptoms = conditionSymptoms.map(symptom => ({
          ...symptom,
          severity: this.adjustSymptomSeverity(symptom.severity, condition.severity)
        }));
        
        symptoms.push(...adjustedSymptoms);
      }
    });

    // Remove duplicates and sort by urgency
    const uniqueSymptoms = symptoms.filter((symptom, index, self) => 
      index === self.findIndex(s => s.id === symptom.id)
    );

    return uniqueSymptoms.sort((a, b) => {
      const urgencyOrder = { emergency: 4, high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
    });
  }

  /**
   * Adjust symptom severity based on user's condition severity
   */
  private static adjustSymptomSeverity(
    symptomSeverity: SymptomSeverity,
    conditionSeverity: 'mild' | 'moderate' | 'severe'
  ): SymptomSeverity {
    const severityMap: Record<string, Record<string, SymptomSeverity>> = {
      mild: { mild: 'mild', moderate: 'mild', severe: 'moderate', critical: 'moderate' },
      moderate: { mild: 'moderate', moderate: 'moderate', severe: 'severe', critical: 'severe' },
      severe: { mild: 'moderate', moderate: 'severe', severe: 'critical', critical: 'critical' }
    };

    return severityMap[conditionSeverity][symptomSeverity] || symptomSeverity;
  }

  /**
   * Get emergency symptoms that require immediate attention
   */
  static getEmergencySymptoms(symptoms: Symptom[]): Symptom[] {
    return symptoms.filter(symptom => 
      symptom.urgencyLevel === 'emergency' || symptom.severity === 'critical'
    );
  }

  /**
   * Get general health recommendations based on AQI and conditions
   */
  static getGeneralRecommendations(
    healthConditions: HealthCondition[],
    currentAQI: number
  ): string[] {
    const recommendations: string[] = [];
    const aqiCategory = getAQICategory(currentAQI);

    if (healthConditions.length === 0) {
      // General population recommendations
      if (aqiCategory === 'unhealthySensitive') {
        recommendations.push('Limit prolonged outdoor activities');
        recommendations.push('Consider wearing a mask outdoors');
      } else if (aqiCategory === 'unhealthy') {
        recommendations.push('Avoid outdoor activities');
        recommendations.push('Keep windows closed');
        recommendations.push('Use air purifiers if available');
      }
    } else {
      // Recommendations for people with health conditions
      if (aqiCategory === 'moderate') {
        recommendations.push('Monitor symptoms closely');
        recommendations.push('Keep medications readily available');
      } else if (aqiCategory === 'unhealthySensitive') {
        recommendations.push('AVOID all outdoor activities');
        recommendations.push('Stay indoors with windows closed');
        recommendations.push('Use prescribed medications as directed');
      } else if (aqiCategory === 'unhealthy') {
        recommendations.push('EMERGENCY: Stay indoors immediately');
        recommendations.push('Have emergency medications accessible');
        recommendations.push('Consider temporary relocation if possible');
        recommendations.push('Contact healthcare provider if symptoms worsen');
      }

      // Condition-specific recommendations
      const hasRespiratory = healthConditions.some(c => 
        ['asthma', 'copd', 'respiratoryIssues'].includes(c.id)
      );
      const hasCardiac = healthConditions.some(c => c.id === 'heartDisease');

      if (hasRespiratory && aqiCategory !== 'good') {
        recommendations.push('Use rescue inhaler as prescribed');
        recommendations.push('Practice breathing exercises');
      }

      if (hasCardiac && aqiCategory !== 'good') {
        recommendations.push('Monitor blood pressure and heart rate');
        recommendations.push('Avoid all physical exertion');
      }
    }

    return recommendations;
  }

  /**
   * Get symptom severity color
   */
  static getSymptomSeverityColor(severity: SymptomSeverity): string {
    const colors = {
      mild: '#4CAF50',      // Green
      moderate: '#FF9800',   // Orange
      severe: '#F44336',     // Red
      critical: '#9C27B0'    // Purple
    };
    return colors[severity];
  }

  /**
   * Get urgency level color
   */
  static getUrgencyLevelColor(urgencyLevel: string): string {
    const colors: Record<string, string> = {
      low: '#4CAF50',       // Green
      medium: '#FF9800',    // Orange
      high: '#F44336',      // Red
      emergency: '#9C27B0'  // Purple
    };
    return colors[urgencyLevel] || '#666';
  }
}

export default SymptomService;
