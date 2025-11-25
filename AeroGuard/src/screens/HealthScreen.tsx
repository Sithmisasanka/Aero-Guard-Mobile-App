import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation';
import { useAQI } from '../hooks/useAQI';
import AISymptomAnalyzer from '../components/AISymptomAnalyzer';
import { getTranslation } from '../utils/localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

interface HealthTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  aqiRange: [number, number];
}

const HEALTH_TIPS: HealthTip[] = [
  {
    id: 'stay_indoors',
    title: 'Stay Indoors',
    description: 'Keep windows closed and avoid outdoor activities',
    icon: 'home',
    color: '#F44336',
    aqiRange: [151, 500],
  },
  {
    id: 'wear_mask',
    title: 'Wear N95 Mask',
    description: 'Use a properly fitted mask when going outside',
    icon: 'medical',
    color: '#FF9800',
    aqiRange: [101, 500],
  },
  {
    id: 'limit_exercise',
    title: 'Limit Outdoor Exercise',
    description: 'Reduce prolonged or heavy outdoor activities',
    icon: 'fitness',
    color: '#FF9800',
    aqiRange: [101, 300],
  },
  {
    id: 'use_purifier',
    title: 'Use Air Purifier',
    description: 'Run HEPA air purifiers indoors',
    icon: 'refresh',
    color: '#2196F3',
    aqiRange: [51, 500],
  },
  {
    id: 'stay_hydrated',
    title: 'Stay Hydrated',
    description: 'Drink plenty of water to help your body cope',
    icon: 'water',
    color: '#4CAF50',
    aqiRange: [0, 500],
  },
];

const HealthScreen: React.FC = () => {
  const [showAIAnalyzer, setShowAIAnalyzer] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { location, error: locationError } = useLocation();
  const { currentAQI, loading: aqiLoading, error: aqiError } = useAQI();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const getAQILevel = (aqi: number): { level: string; color: string; description: string } => {
    if (aqi <= 50) return { level: 'Good', color: '#4CAF50', description: 'Air quality is excellent for outdoor activities' };
    if (aqi <= 100) return { level: 'Moderate', color: '#FFC107', description: 'Air quality is acceptable for most people' };
    if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', color: '#FF9800', description: 'Sensitive individuals should limit outdoor exposure' };
    if (aqi <= 200) return { level: 'Unhealthy', color: '#F44336', description: 'Everyone should limit outdoor activities' };
    if (aqi <= 300) return { level: 'Very Unhealthy', color: '#9C27B0', description: 'Everyone should avoid outdoor activities' };
    return { level: 'Hazardous', color: '#795548', description: 'Health emergency - everyone should stay indoors' };
  };

  const getRelevantHealthTips = (aqi: number): HealthTip[] => {
    return HEALTH_TIPS.filter(tip => aqi >= tip.aqiRange[0] && aqi <= tip.aqiRange[1]);
  };

  const getHealthImpactInfo = (aqi: number) => {
    if (aqi <= 50) {
      return {
        icon: 'checkmark-circle' as const,
        color: '#4CAF50',
        title: 'Minimal Health Impact',
        description: 'Air quality poses little or no risk. Enjoy outdoor activities!',
        risks: []
      };
    } else if (aqi <= 100) {
      return {
        icon: 'information-circle' as const,
        color: '#FFC107',
        title: 'Low Health Impact',
        description: 'Air quality is acceptable for most people.',
        risks: ['Unusually sensitive people may experience minor symptoms']
      };
    } else if (aqi <= 150) {
      return {
        icon: 'warning' as const,
        color: '#FF9800',
        title: 'Moderate Health Impact',
        description: 'Sensitive groups should limit outdoor exposure.',
        risks: [
          'People with respiratory/heart conditions may experience symptoms',
          'Children and elderly should reduce outdoor activities'
        ]
      };
    } else if (aqi <= 200) {
      return {
        icon: 'alert' as const,
        color: '#F44336',
        title: 'Significant Health Impact',
        description: 'Everyone should limit outdoor activities.',
        risks: [
          'Increased respiratory symptoms for sensitive people',
          'Possible cardiovascular effects',
          'Eye and throat irritation'
        ]
      };
    } else if (aqi <= 300) {
      return {
        icon: 'alert-circle' as const,
        color: '#9C27B0',
        title: 'High Health Impact',
        description: 'Everyone should avoid outdoor activities.',
        risks: [
          'Serious respiratory symptoms',
          'Cardiovascular effects',
          'Reduced lung function',
          'Eye and skin irritation'
        ]
      };
    } else {
      return {
        icon: 'warning' as const, // Changed from 'skull' to 'warning' as skull is not available
        color: '#795548',
        title: 'Emergency Health Impact',
        description: 'Health emergency - stay indoors immediately!',
        risks: [
          'Severe respiratory symptoms',
          'Serious cardiovascular effects',
          'Premature mortality risk',
          'Emergency care may be needed'
        ]
      };
    }
  };

  const currentAQIValue = currentAQI?.aqi || 0;
  const aqiLevel = getAQILevel(currentAQIValue);
  const healthTips = getRelevantHealthTips(currentAQIValue);
  const healthImpact = getHealthImpactInfo(currentAQIValue);
  const locationString = location ? `${location.city}, ${location.country}` : 'Current Location';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Health Dashboard</Text>
            <Text style={styles.headerSubtitle}>{locationString}</Text>
          </View>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => setShowAIAnalyzer(true)}
          >
            <Ionicons name="analytics" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Current AQI Card */}
        <View style={[styles.aqiCard, { borderLeftColor: aqiLevel.color }]}>
          <View style={styles.aqiHeader}>
            <View>
              <Text style={styles.aqiValue}>{currentAQIValue}</Text>
              <Text style={[styles.aqiLevel, { color: aqiLevel.color }]}>{aqiLevel.level}</Text>
            </View>
            <View style={[styles.aqiIndicator, { backgroundColor: aqiLevel.color }]} />
          </View>
          <Text style={styles.aqiDescription}>{aqiLevel.description}</Text>
          {aqiLoading && <Text style={styles.loadingText}>Updating air quality data...</Text>}
          {aqiError && <Text style={styles.errorText}>Unable to fetch current AQI</Text>}
        </View>

        {/* Health Impact Assessment */}
        <View style={styles.healthImpactCard}>
          <View style={styles.cardHeader}>
            <Ionicons name={healthImpact.icon} size={24} color={healthImpact.color} />
            <Text style={styles.cardTitle}>Health Impact Assessment</Text>
          </View>
          
          <Text style={[styles.impactTitle, { color: healthImpact.color }]}>
            {healthImpact.title}
          </Text>
          <Text style={styles.impactDescription}>{healthImpact.description}</Text>
          
          {healthImpact.risks.length > 0 && (
            <View style={styles.risksSection}>
              <Text style={styles.risksTitle}>Potential Health Risks:</Text>
              {healthImpact.risks.map((risk, index) => (
                <View key={index} style={styles.riskItem}>
                  <Ionicons name="ellipse" size={6} color="#666" style={styles.riskBullet} />
                  <Text style={styles.riskText}>{risk}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recommended Actions */}
        {healthTips.length > 0 && (
          <View style={styles.tipsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
              <Text style={styles.cardTitle}>Recommended Actions</Text>
            </View>
            
            <View style={styles.tipsGrid}>
              {healthTips.map((tip) => (
                <View key={tip.id} style={styles.tipItem}>
                  <View style={[styles.tipIcon, { backgroundColor: tip.color }]}>
                    <Ionicons name={tip.icon as any} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDescription}>{tip.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Symptom Analyzer CTA */}
        <View style={styles.aiCTACard}>
          <View style={styles.aiCTAContent}>
            <View style={styles.aiCTAIcon}>
              <Ionicons name="medical" size={28} color="#007AFF" />
            </View>
            <View style={styles.aiCTAText}>
              <Text style={styles.aiCTATitle}>{getTranslation('experiencingSymptoms', userProfile?.preferredLanguage || 'en')}</Text>
              <Text style={styles.aiCTADescription}>
                {getTranslation('aiSymptomDescription', userProfile?.preferredLanguage || 'en')}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.aiCTAButton}
            onPress={() => setShowAIAnalyzer(true)}
          >
            <Text style={styles.aiCTAButtonText}>{getTranslation('analyzeSymptoms', userProfile?.preferredLanguage || 'en')}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* General Health Tips */}
        <View style={styles.generalTipsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness" size={24} color="#4CAF50" />
                      <Text style={styles.cardTitle}>{getTranslation('generalHealthTips', userProfile?.preferredLanguage || 'en')}</Text>
          </View>
          
          <View style={styles.generalTipsList}>
            <View style={styles.generalTipItem}>
              <Ionicons name="water" size={16} color="#2196F3" />
              <Text style={styles.generalTipText}>Stay hydrated with plenty of water</Text>
            </View>
            <View style={styles.generalTipItem}>
              <Ionicons name="nutrition" size={16} color="#FF9800" />
              <Text style={styles.generalTipText}>Eat antioxidant-rich foods (fruits, vegetables)</Text>
            </View>
            <View style={styles.generalTipItem}>
              <Ionicons name="leaf" size={16} color="#4CAF50" />
              <Text style={styles.generalTipText}>Keep indoor plants to improve air quality</Text>
            </View>
            <View style={styles.generalTipItem}>
              <Ionicons name="time" size={16} color="#9C27B0" />
              <Text style={styles.generalTipText}>Check AQI before planning outdoor activities</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        {currentAQIValue > 200 && (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <Ionicons name="warning" size={24} color="#F44336" />
              <Text style={styles.emergencyTitle}>Health Alert</Text>
            </View>
            <Text style={styles.emergencyText}>
              Air quality is at unhealthy levels. If you experience severe symptoms like 
              difficulty breathing, chest pain, or persistent coughing, seek medical attention immediately.
            </Text>
            <TouchableOpacity 
              style={styles.emergencyButton}
              onPress={() => Alert.alert(
                'Emergency Contacts',
                'If experiencing severe symptoms:\n\n• Call emergency services\n• Contact your healthcare provider\n• Go to the nearest hospital if symptoms are severe',
                [{ text: 'OK' }]
              )}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>Emergency Info</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* AI Symptom Analyzer Modal */}
      <Modal
        visible={showAIAnalyzer}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <AISymptomAnalyzer
          currentAQI={currentAQIValue}
          location={locationString}
          onClose={() => setShowAIAnalyzer(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  aiButton: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // AQI Card
  aqiCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  aqiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aqiValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  aqiLevel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  aqiIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  aqiDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
  },
  
  // Health Impact Card
  healthImpactCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  impactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  impactDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  risksSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  risksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 4,
  },
  riskBullet: {
    marginTop: 6,
    marginRight: 12,
  },
  riskText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  
  // Tips Card
  tipsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsGrid: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  
  // AI CTA Card
  aiCTACard: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  aiCTAContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  aiCTAIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCTAText: {
    flex: 1,
  },
  aiCTATitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 8,
  },
  aiCTADescription: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  aiCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  aiCTAButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // General Tips Card
  generalTipsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  generalTipsList: {
    gap: 12,
  },
  generalTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  generalTipText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  
  // Emergency Card
  emergencyCard: {
    backgroundColor: '#FFEBEE',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C62828',
  },
  emergencyText: {
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 20,
    marginBottom: 16,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default HealthScreen;