// Local symptom data and recommendations for air quality-related health issues
// This serves as fallback when Gemini AI API is unavailable

export interface Symptom {
  id: string;
  name: string;
  category: 'respiratory' | 'eye' | 'skin' | 'cardiovascular' | 'neurological' | 'general';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  commonCauses: string[];
  relatedAQI: {
    pm25: number[];
    pm10: number[];
    ozone: number[];
    no2: number[];
    so2: number[];
    co: number[];
  };
}

export interface Recommendation {
  id: string;
  type: 'immediate' | 'prevention' | 'lifestyle' | 'medical';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  applicableSymptoms: string[];
  aqiRange: [number, number]; // [min, max] AQI levels where this applies
}

export const SYMPTOMS: Symptom[] = [
  // Respiratory Symptoms
  {
    id: 'cough_dry',
    name: 'Dry Cough',
    category: 'respiratory',
    severity: 'mild',
    description: 'Persistent dry cough without mucus production',
    commonCauses: ['PM2.5 exposure', 'Ozone pollution', 'Air pollutants'],
    relatedAQI: {
      pm25: [51, 300],
      pm10: [55, 350],
      ozone: [125, 300],
      no2: [100, 250],
      so2: [75, 200],
      co: [10, 50]
    }
  },
  {
    id: 'cough_productive',
    name: 'Cough with Mucus',
    category: 'respiratory',
    severity: 'moderate',
    description: 'Cough producing phlegm or mucus, often indicating respiratory irritation',
    commonCauses: ['High PM10 levels', 'Industrial pollutants', 'Vehicle emissions'],
    relatedAQI: {
      pm25: [101, 300],
      pm10: [155, 400],
      ozone: [165, 300],
      no2: [150, 300],
      so2: [125, 250],
      co: [15, 60]
    }
  },
  {
    id: 'shortness_breath',
    name: 'Shortness of Breath',
    category: 'respiratory',
    severity: 'severe',
    description: 'Difficulty breathing or feeling out of breath during normal activities',
    commonCauses: ['High ozone levels', 'PM2.5 pollution', 'NO2 exposure'],
    relatedAQI: {
      pm25: [151, 500],
      pm10: [255, 500],
      ozone: [205, 500],
      no2: [200, 500],
      so2: [185, 500],
      co: [30, 100]
    }
  },
  {
    id: 'wheezing',
    name: 'Wheezing',
    category: 'respiratory',
    severity: 'moderate',
    description: 'High-pitched whistling sound when breathing',
    commonCauses: ['Ozone pollution', 'PM2.5 particles', 'SO2 exposure'],
    relatedAQI: {
      pm25: [101, 300],
      pm10: [155, 350],
      ozone: [165, 400],
      no2: [100, 250],
      so2: [150, 300],
      co: [10, 40]
    }
  },
  {
    id: 'chest_tightness',
    name: 'Chest Tightness',
    category: 'respiratory',
    severity: 'moderate',
    description: 'Feeling of pressure or constriction in the chest area',
    commonCauses: ['Poor air quality', 'Multiple pollutants', 'Smog exposure'],
    relatedAQI: {
      pm25: [101, 250],
      pm10: [155, 300],
      ozone: [125, 300],
      no2: [100, 200],
      so2: [75, 200],
      co: [15, 50]
    }
  },

  // Eye Symptoms
  {
    id: 'eye_irritation',
    name: 'Eye Irritation',
    category: 'eye',
    severity: 'mild',
    description: 'Red, itchy, or burning sensation in the eyes',
    commonCauses: ['Ozone exposure', 'Particulate matter', 'Chemical pollutants'],
    relatedAQI: {
      pm25: [51, 200],
      pm10: [55, 250],
      ozone: [125, 250],
      no2: [100, 200],
      so2: [75, 150],
      co: [5, 30]
    }
  },
  {
    id: 'watery_eyes',
    name: 'Watery Eyes',
    category: 'eye',
    severity: 'mild',
    description: 'Excessive tear production due to environmental irritants',
    commonCauses: ['Air pollutants', 'Smog', 'Chemical irritants'],
    relatedAQI: {
      pm25: [51, 150],
      pm10: [55, 200],
      ozone: [100, 200],
      no2: [75, 150],
      so2: [50, 125],
      co: [5, 25]
    }
  },

  // Skin Symptoms
  {
    id: 'skin_irritation',
    name: 'Skin Irritation',
    category: 'skin',
    severity: 'mild',
    description: 'Redness, itching, or rash on exposed skin',
    commonCauses: ['Chemical pollutants', 'Particulate matter', 'Acid rain compounds'],
    relatedAQI: {
      pm25: [101, 200],
      pm10: [155, 250],
      ozone: [125, 200],
      no2: [100, 180],
      so2: [125, 200],
      co: [10, 35]
    }
  },

  // Cardiovascular Symptoms
  {
    id: 'heart_palpitations',
    name: 'Heart Palpitations',
    category: 'cardiovascular',
    severity: 'severe',
    description: 'Irregular or rapid heartbeat, often linked to poor air quality',
    commonCauses: ['PM2.5 exposure', 'Carbon monoxide', 'Multiple pollutants'],
    relatedAQI: {
      pm25: [151, 400],
      pm10: [255, 450],
      ozone: [165, 300],
      no2: [150, 300],
      so2: [125, 250],
      co: [30, 80]
    }
  },

  // Neurological Symptoms
  {
    id: 'headache',
    name: 'Headache',
    category: 'neurological',
    severity: 'moderate',
    description: 'Persistent head pain, often worsened by poor air quality',
    commonCauses: ['Carbon monoxide', 'Multiple pollutants', 'Oxygen reduction'],
    relatedAQI: {
      pm25: [101, 250],
      pm10: [155, 300],
      ozone: [125, 250],
      no2: [100, 200],
      so2: [75, 200],
      co: [20, 60]
    }
  },
  {
    id: 'dizziness',
    name: 'Dizziness',
    category: 'neurological',
    severity: 'moderate',
    description: 'Feeling lightheaded or unsteady, potentially from pollutant exposure',
    commonCauses: ['Carbon monoxide', 'Reduced oxygen', 'Chemical exposure'],
    relatedAQI: {
      pm25: [101, 200],
      pm10: [155, 250],
      ozone: [125, 200],
      no2: [100, 180],
      so2: [75, 150],
      co: [25, 70]
    }
  },

  // General Symptoms
  {
    id: 'fatigue',
    name: 'Unusual Fatigue',
    category: 'general',
    severity: 'moderate',
    description: 'Persistent tiredness not explained by activity level',
    commonCauses: ['Poor air quality', 'Reduced oxygen', 'Pollutant stress'],
    relatedAQI: {
      pm25: [101, 300],
      pm10: [155, 350],
      ozone: [125, 300],
      no2: [100, 250],
      so2: [75, 200],
      co: [15, 50]
    }
  },
  {
    id: 'nausea',
    name: 'Nausea',
    category: 'general',
    severity: 'moderate',
    description: 'Feeling sick to stomach, possibly from pollutant exposure',
    commonCauses: ['Chemical pollutants', 'Carbon monoxide', 'Strong odors'],
    relatedAQI: {
      pm25: [101, 250],
      pm10: [155, 300],
      ozone: [125, 250],
      no2: [100, 200],
      so2: [100, 250],
      co: [20, 60]
    }
  }
];

export const RECOMMENDATIONS: Recommendation[] = [
  // Immediate Actions
  {
    id: 'stay_indoors',
    type: 'immediate',
    title: 'Stay Indoors',
    description: 'Remain inside with windows and doors closed. Use air conditioning with clean filters if available.',
    priority: 'high',
    applicableSymptoms: ['shortness_breath', 'cough_dry', 'cough_productive', 'wheezing', 'chest_tightness'],
    aqiRange: [151, 500]
  },
  {
    id: 'use_air_purifier',
    type: 'immediate',
    title: 'Use Air Purifier',
    description: 'Turn on HEPA air purifiers in your home, especially in bedrooms and main living areas.',
    priority: 'high',
    applicableSymptoms: ['eye_irritation', 'cough_dry', 'shortness_breath', 'headache'],
    aqiRange: [101, 500]
  },
  {
    id: 'avoid_outdoor_exercise',
    type: 'immediate',
    title: 'Avoid Outdoor Exercise',
    description: 'Cancel outdoor physical activities. Exercise indoors or postpone until air quality improves.',
    priority: 'high',
    applicableSymptoms: ['shortness_breath', 'chest_tightness', 'heart_palpitations', 'fatigue'],
    aqiRange: [101, 500]
  },
  {
    id: 'wear_n95_mask',
    type: 'immediate',
    title: 'Wear N95 Mask',
    description: 'If you must go outside, wear a properly fitted N95 or equivalent respirator mask.',
    priority: 'high',
    applicableSymptoms: ['cough_dry', 'cough_productive', 'shortness_breath', 'wheezing'],
    aqiRange: [151, 500]
  },
  {
    id: 'close_windows',
    type: 'immediate',
    title: 'Close Windows and Doors',
    description: 'Keep all windows and doors closed to prevent outdoor pollutants from entering your home.',
    priority: 'medium',
    applicableSymptoms: ['eye_irritation', 'cough_dry', 'headache', 'skin_irritation'],
    aqiRange: [101, 500]
  },
  {
    id: 'use_eye_drops',
    type: 'immediate',
    title: 'Use Preservative-Free Eye Drops',
    description: 'Apply artificial tears to soothe irritated eyes. Avoid rubbing your eyes.',
    priority: 'medium',
    applicableSymptoms: ['eye_irritation', 'watery_eyes'],
    aqiRange: [51, 300]
  },

  // Prevention Measures
  {
    id: 'check_aqi_daily',
    type: 'prevention',
    title: 'Check AQI Daily',
    description: 'Monitor air quality forecasts and plan outdoor activities when AQI is lower.',
    priority: 'high',
    applicableSymptoms: ['shortness_breath', 'cough_dry', 'chest_tightness', 'heart_palpitations'],
    aqiRange: [0, 500]
  },
  {
    id: 'create_clean_air_room',
    type: 'prevention',
    title: 'Create a Clean Air Room',
    description: 'Designate one room with minimal outdoor air infiltration and use air purifiers.',
    priority: 'medium',
    applicableSymptoms: ['shortness_breath', 'cough_productive', 'wheezing', 'eye_irritation'],
    aqiRange: [101, 500]
  },
  {
    id: 'avoid_pollution_sources',
    type: 'prevention',
    title: 'Avoid Pollution Sources',
    description: 'Stay away from busy roads, industrial areas, and construction sites during high pollution days.',
    priority: 'medium',
    applicableSymptoms: ['cough_dry', 'headache', 'skin_irritation', 'nausea'],
    aqiRange: [51, 500]
  },
  {
    id: 'time_outdoor_activities',
    type: 'prevention',
    title: 'Time Outdoor Activities',
    description: 'Plan outdoor activities for early morning or late evening when pollution levels are typically lower.',
    priority: 'medium',
    applicableSymptoms: ['fatigue', 'shortness_breath', 'chest_tightness'],
    aqiRange: [51, 200]
  },

  // Lifestyle Changes
  {
    id: 'stay_hydrated',
    type: 'lifestyle',
    title: 'Stay Well Hydrated',
    description: 'Drink plenty of water to help your body cope with pollutant exposure and maintain respiratory health.',
    priority: 'medium',
    applicableSymptoms: ['cough_dry', 'fatigue', 'headache', 'nausea'],
    aqiRange: [51, 500]
  },
  {
    id: 'eat_antioxidants',
    type: 'lifestyle',
    title: 'Eat Antioxidant-Rich Foods',
    description: 'Include foods high in vitamins C and E, such as citrus fruits, berries, and leafy greens.',
    priority: 'low',
    applicableSymptoms: ['fatigue', 'skin_irritation', 'eye_irritation'],
    aqiRange: [51, 300]
  },
  {
    id: 'maintain_humidity',
    type: 'lifestyle',
    title: 'Maintain Indoor Humidity',
    description: 'Keep indoor humidity between 30-50% to help your respiratory system cope with pollutants.',
    priority: 'medium',
    applicableSymptoms: ['cough_dry', 'eye_irritation', 'skin_irritation'],
    aqiRange: [51, 300]
  },
  {
    id: 'practice_breathing',
    type: 'lifestyle',
    title: 'Practice Deep Breathing',
    description: 'When indoors with clean air, practice deep breathing exercises to improve lung function.',
    priority: 'low',
    applicableSymptoms: ['shortness_breath', 'chest_tightness', 'fatigue'],
    aqiRange: [0, 200]
  },

  // Medical Recommendations
  {
    id: 'seek_medical_attention',
    type: 'medical',
    title: 'Seek Immediate Medical Attention',
    description: 'Contact your healthcare provider or emergency services if symptoms are severe or worsening.',
    priority: 'high',
    applicableSymptoms: ['shortness_breath', 'heart_palpitations', 'chest_tightness'],
    aqiRange: [201, 500]
  },
  {
    id: 'consult_doctor',
    type: 'medical',
    title: 'Consult Your Doctor',
    description: 'Schedule an appointment with your healthcare provider to discuss ongoing symptoms.',
    priority: 'medium',
    applicableSymptoms: ['cough_productive', 'wheezing', 'heart_palpitations', 'dizziness'],
    aqiRange: [101, 500]
  },
  {
    id: 'review_medications',
    type: 'medical',
    title: 'Review Current Medications',
    description: 'Discuss with your doctor about adjusting medications during high pollution periods.',
    priority: 'medium',
    applicableSymptoms: ['shortness_breath', 'wheezing', 'heart_palpitations'],
    aqiRange: [151, 500]
  },
  {
    id: 'consider_nasal_rinse',
    type: 'medical',
    title: 'Consider Nasal Saline Rinse',
    description: 'Use saline nasal rinses to clear pollutants from nasal passages (consult healthcare provider first).',
    priority: 'low',
    applicableSymptoms: ['cough_dry', 'cough_productive', 'headache'],
    aqiRange: [101, 300]
  }
];

// Helper function to get recommendations based on symptoms and AQI
export function getRecommendationsForSymptoms(symptomIds: string[], currentAQI: number): Recommendation[] {
  return RECOMMENDATIONS.filter(rec => {
    const hasApplicableSymptom = rec.applicableSymptoms.some(symptom => symptomIds.includes(symptom));
    const isInAQIRange = currentAQI >= rec.aqiRange[0] && currentAQI <= rec.aqiRange[1];
    return hasApplicableSymptom && isInAQIRange;
  }).sort((a, b) => {
    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Helper function to analyze symptom severity
export function analyzeSymptomSeverity(symptomIds: string[]): {
  overallSeverity: 'mild' | 'moderate' | 'severe';
  severityCount: { mild: number; moderate: number; severe: number };
  urgentCare: boolean;
} {
  const symptoms = SYMPTOMS.filter(s => symptomIds.includes(s.id));
  const severityCount = { mild: 0, moderate: 0, severe: 0 };
  
  symptoms.forEach(symptom => {
    severityCount[symptom.severity]++;
  });

  let overallSeverity: 'mild' | 'moderate' | 'severe' = 'mild';
  let urgentCare = false;

  if (severityCount.severe > 0) {
    overallSeverity = 'severe';
    urgentCare = severityCount.severe >= 2 || symptomIds.includes('shortness_breath') || symptomIds.includes('heart_palpitations');
  } else if (severityCount.moderate > 0) {
    overallSeverity = 'moderate';
    urgentCare = severityCount.moderate >= 3;
  }

  return { overallSeverity, severityCount, urgentCare };
}