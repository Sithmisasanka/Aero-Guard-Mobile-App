/**
 * Demo utility to showcase symptom display functionality
 * This helps demonstrate the symptom system with sample health conditions
 */

import { HealthCondition } from '../types';
import SymptomService from '../services/symptomService';

// Sample health conditions for demo
export const DEMO_HEALTH_CONDITIONS: HealthCondition[] = [
  {
    id: 'asthma',
    name: 'asthma',
    severity: 'moderate',
    isActive: true
  },
  {
    id: 'heartDisease',
    name: 'heartDisease', 
    severity: 'mild',
    isActive: true
  }
];

// Demo AQI levels to test different symptom scenarios
export const DEMO_AQI_LEVELS = {
  GOOD: 35,           // 0-50: Good air quality
  MODERATE: 75,       // 51-100: Moderate
  UNHEALTHY_SENSITIVE: 125, // 101-150: Unhealthy for sensitive groups
  UNHEALTHY: 175,     // 151-200: Unhealthy for everyone
  VERY_UNHEALTHY: 250, // 201-300: Very unhealthy
  HAZARDOUS: 350      // 300+: Hazardous
};

/**
 * Get symptoms for demo health conditions at a specific AQI level
 */
export const getDemoSymptoms = (aqiLevel: number) => {
  return SymptomService.getSymptomsForConditions(DEMO_HEALTH_CONDITIONS, aqiLevel);
};

/**
 * Get demo scenario description for an AQI level
 */
export const getDemoScenarioDescription = (aqiLevel: number): string => {
  if (aqiLevel <= 50) {
    return 'Good air quality - Minimal symptoms expected for most health conditions';
  } else if (aqiLevel <= 100) {
    return 'Moderate air quality - Some symptoms may appear for sensitive individuals';
  } else if (aqiLevel <= 150) {
    return 'Unhealthy for sensitive groups - People with health conditions should take precautions';
  } else if (aqiLevel <= 200) {
    return 'Unhealthy for everyone - Health symptoms likely for most people';
  } else if (aqiLevel <= 300) {
    return 'Very unhealthy - Serious health effects for everyone';
  } else {
    return 'Hazardous conditions - Emergency health warnings in effect';
  }
};

/**
 * Log demo symptoms to console for debugging
 */
export const logDemoSymptoms = (aqiLevel: number) => {
  const symptoms = getDemoSymptoms(aqiLevel);
  const scenario = getDemoScenarioDescription(aqiLevel);
  
  console.log(`\n🔬 SYMPTOM DEMO - AQI Level: ${aqiLevel}`);
  console.log(`📊 Scenario: ${scenario}`);
  console.log('👤 Health Conditions:', DEMO_HEALTH_CONDITIONS.map(hc => `${hc.name} (${hc.severity})`).join(', '));
  console.log('🚨 Symptoms Found:', symptoms.length);
  
  symptoms.forEach((symptom, index) => {
    console.log(`  ${index + 1}. ${symptom.name} (${symptom.severity})`);
    console.log(`     Recommendation: ${symptom.recommendation}`);
    if (symptom.urgencyLevel === 'emergency') {
      console.log(`     🚨 EMERGENCY SYMPTOM!`);
    }
  });
  
  const emergencySymptoms = symptoms.filter(s => s.urgencyLevel === 'emergency');
  if (emergencySymptoms.length > 0) {
    console.log(`⚠️  ${emergencySymptoms.length} emergency symptoms detected!`);
  }
  
  console.log('─'.repeat(50));
};

/**
 * Run full symptom demo across all AQI levels
 */
export const runFullSymptomDemo = () => {
  console.log('\n🎯 RUNNING FULL SYMPTOM SYSTEM DEMO');
  console.log('='.repeat(60));
  
  Object.entries(DEMO_AQI_LEVELS).forEach(([level, aqi]) => {
    logDemoSymptoms(aqi);
  });
  
  console.log('✅ Demo complete! Symptom system working correctly.');
};
