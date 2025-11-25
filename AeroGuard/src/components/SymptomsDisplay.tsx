import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SymptomService, { Symptom } from '../services/symptomService';
import { HealthCondition } from '../types';

interface SymptomsDisplayProps {
  healthConditions: HealthCondition[];
  currentAQI: number;
  onEmergencyPress?: () => void;
}

export const SymptomsDisplay: React.FC<SymptomsDisplayProps> = ({
  healthConditions,
  currentAQI,
  onEmergencyPress
}) => {
  const symptoms = SymptomService.getSymptomsForConditions(healthConditions, currentAQI);
  const emergencySymptoms = SymptomService.getEmergencySymptoms(symptoms);
  const generalRecommendations = SymptomService.getGeneralRecommendations(healthConditions, currentAQI);

  const handleEmergencyPress = () => {
    if (onEmergencyPress) {
      onEmergencyPress();
    } else {
      Alert.alert(
        'Emergency Symptoms Detected',
        'Based on your health conditions and current air quality, you may experience severe symptoms. Contact your healthcare provider or emergency services immediately.',
        [
          { text: 'Call Emergency', onPress: () => {/* Add emergency call logic */} },
          { text: 'Contact Doctor', onPress: () => {/* Add doctor contact logic */} },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const renderSymptomCard = (symptom: Symptom, index: number) => {
    const severityColor = SymptomService.getSymptomSeverityColor(symptom.severity);
    const urgencyColor = SymptomService.getUrgencyLevelColor(symptom.urgencyLevel);
    
    return (
      <View key={symptom.id} style={[styles.symptomCard, { borderLeftColor: severityColor }]}>
        <View style={styles.symptomHeader}>
          <View style={styles.symptomTitleRow}>
            <Ionicons 
              name={getSymptomIcon(symptom.category)} 
              size={20} 
              color={severityColor} 
            />
            <Text style={[styles.symptomName, { color: severityColor }]}>
              {symptom.name}
            </Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
            <Text style={styles.urgencyText}>
              {symptom.urgencyLevel.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.symptomDescription}>
          {symptom.description}
        </Text>
        
        <View style={styles.recommendationContainer}>
          <Ionicons name="medical" size={16} color="#007bff" />
          <Text style={styles.recommendationText}>
            {symptom.recommendation}
          </Text>
        </View>
      </View>
    );
  };

  const getSymptomIcon = (category: string): any => {
    const icons: Record<string, string> = {
      respiratory: 'fitness',
      cardiovascular: 'heart',
      general: 'body',
      sensory: 'eye'
    };
    return icons[category] || 'alert-circle';
  };

  if (symptoms.length === 0 && healthConditions.length > 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(76, 175, 80, 0.1)', 'rgba(139, 195, 74, 0.05)']}
          style={styles.noSymptomsCard}
        >
          <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          <Text style={styles.noSymptomsTitle}>No Symptoms Expected</Text>
          <Text style={styles.noSymptomsText}>
            Current air quality should not trigger symptoms for your health conditions.
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (healthConditions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007bff" />
          <Text style={styles.infoText}>
            Add your health conditions in the profile to see personalized symptom alerts.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Emergency Alert */}
      {emergencySymptoms.length > 0 && (
        <TouchableOpacity style={styles.emergencyAlert} onPress={handleEmergencyPress}>
          <LinearGradient
            colors={['#F44336', '#D32F2F']}
            style={styles.emergencyGradient}
          >
            <Ionicons name="warning" size={24} color="white" />
            <View style={styles.emergencyTextContainer}>
              <Text style={styles.emergencyTitle}>⚠️ EMERGENCY SYMPTOMS</Text>
              <Text style={styles.emergencySubtitle}>
                {emergencySymptoms.length} severe symptom(s) detected - Seek immediate medical attention
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Symptoms List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Potential Symptoms</Text>
          <Text style={styles.sectionSubtitle}>
            Based on AQI {currentAQI} and your health conditions
          </Text>
        </View>

        {symptoms.map(renderSymptomCard)}

        {/* General Recommendations */}
        {generalRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.recommendationsTitle}>General Recommendations</Text>
            {generalRecommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="shield-checkmark" size={16} color="#007bff" />
                <Text style={styles.generalRecommendationText}>
                  {recommendation}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emergencyAlert: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emergencyTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencySubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  symptomCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  symptomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  symptomName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  symptomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  recommendationsSection: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  generalRecommendationText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 8,
    flex: 1,
  },
  noSymptomsCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    margin: 16,
  },
  noSymptomsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 12,
  },
  noSymptomsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 12,
    flex: 1,
  },
});

export default SymptomsDisplay;