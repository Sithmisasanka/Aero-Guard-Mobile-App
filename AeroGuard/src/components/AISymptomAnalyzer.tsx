import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { geminiSymptomService, SymptomAnalysisRequest, SymptomAnalysisResponse } from '../services/geminiSymptomService';
import { SYMPTOMS } from '../data/symptomData';

interface Props {
  currentAQI?: number;
  location?: string;
  onClose?: () => void;
}

const AISymptomAnalyzer: React.FC<Props> = ({ currentAQI = 100, location, onClose }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [age, setAge] = useState('');
  const [analysis, setAnalysis] = useState<SymptomAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const symptomCategories = {
    respiratory: SYMPTOMS.filter(s => s.category === 'respiratory'),
    eye: SYMPTOMS.filter(s => s.category === 'eye'),
    skin: SYMPTOMS.filter(s => s.category === 'skin'),
    cardiovascular: SYMPTOMS.filter(s => s.category === 'cardiovascular'),
    neurological: SYMPTOMS.filter(s => s.category === 'neurological'),
    general: SYMPTOMS.filter(s => s.category === 'general'),
  };

  const toggleSymptom = (symptomName: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomName)
        ? prev.filter(s => s !== symptomName)
        : [...prev, symptomName]
    );
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim()) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('No Symptoms Selected', 'Please select at least one symptom to analyze.');
      return;
    }

    setLoading(true);
    try {
      const request: SymptomAnalysisRequest = {
        symptoms: selectedSymptoms,
        currentAQI,
        location,
        userAge: age ? parseInt(age) : undefined,
        additionalContext: additionalInfo || undefined,
      };

      const result = await geminiSymptomService.analyzeSymptoms(request);
      setAnalysis(result);
      setShowResults(true);
    } catch (error) {
      Alert.alert('Analysis Error', 'Failed to analyze symptoms. Please try again.');
      console.error('Symptom analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'severe': return '#F44336';
      default: return '#757575';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'mild': return 'checkmark-circle';
      case 'moderate': return 'warning';
      case 'severe': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'immediate': return 'flash';
      case 'prevention': return 'shield';
      case 'lifestyle': return 'leaf';
      case 'medical': return 'medical';
      default: return 'information';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  if (showResults && analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.resultsContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowResults(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Symptom Analysis</Text>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Analysis Summary */}
          <View style={styles.analysisCard}>
            <View style={styles.severityHeader}>
              <Ionicons 
                name={getSeverityIcon(analysis.analysis.severity)} 
                size={24} 
                color={getSeverityColor(analysis.analysis.severity)} 
              />
              <Text style={[styles.severityText, { color: getSeverityColor(analysis.analysis.severity) }]}>
                {analysis.analysis.severity.toUpperCase()} SEVERITY
              </Text>
            </View>
            
            <Text style={styles.summaryText}>{analysis.analysis.summary}</Text>
            
            <View style={styles.analysisDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Air Quality Related:</Text>
                <Text style={[styles.detailValue, { color: analysis.analysis.likelyRelatedToAir ? '#4CAF50' : '#FF9800' }]}>
                  {analysis.analysis.likelyRelatedToAir ? 'Likely' : 'Uncertain'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Confidence:</Text>
                <Text style={styles.detailValue}>{analysis.analysis.confidence}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Analysis Source:</Text>
                <Text style={styles.detailValue}>
                  {analysis.source === 'gemini' ? '🤖 AI Powered' : '📊 Expert Data'}
                </Text>
              </View>
            </View>

            {analysis.analysis.urgentCareNeeded && (
              <View style={styles.urgentCareWarning}>
                <Ionicons name="warning" size={20} color="#F44336" />
                <Text style={styles.urgentCareText}>
                  Consider seeking medical attention for these symptoms
                </Text>
              </View>
            )}
          </View>

          {/* Educational Information */}
          <View style={styles.educationCard}>
            <Text style={styles.cardTitle}>Understanding Your Symptoms</Text>
            <Text style={styles.educationText}>{analysis.educationalInfo.aboutSymptoms}</Text>
            
            <Text style={styles.subTitle}>Air Quality Connection</Text>
            <Text style={styles.educationText}>{analysis.educationalInfo.airQualityConnection}</Text>
            
            <Text style={styles.subTitle}>Pollutants of Concern</Text>
            <View style={styles.pollutantsList}>
              {analysis.educationalInfo.pollutantsOfConcern.map((pollutant, index) => (
                <View key={index} style={styles.pollutantTag}>
                  <Text style={styles.pollutantText}>{pollutant}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recommendations */}
          {Object.entries(analysis.recommendations).map(([type, recommendations]) => (
            recommendations.length > 0 && (
              <View key={type} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name={getRecommendationIcon(type)} size={20} color="#007AFF" />
                  <Text style={styles.cardTitle}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} Actions
                  </Text>
                </View>
                
                {recommendations.map((rec, index) => (
                  <View key={rec.id} style={styles.recommendationItem}>
                    <View style={styles.recommendationItemHeader}>
                      <Text style={styles.recommendationTitle}>{rec.title}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority) }]}>
                        <Text style={styles.priorityText}>{rec.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                  </View>
                ))}
              </View>
            )
          ))}

          {/* Analysis Timestamp */}
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              Analysis completed: {new Date(analysis.timestamp).toLocaleString()}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Symptom Analyzer</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Current AQI Info */}
        <View style={styles.aqiCard}>
          <Text style={styles.aqiLabel}>Current Air Quality Index</Text>
          <Text style={styles.aqiValue}>{currentAQI}</Text>
          {location && <Text style={styles.locationText}>{location}</Text>}
        </View>

        {/* Symptom Selection */}
        <View style={styles.symptomCard}>
          <Text style={styles.cardTitle}>Select Your Symptoms</Text>
          
          {Object.entries(symptomCategories).map(([category, symptoms]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <View style={styles.symptomsGrid}>
                {symptoms.map((symptom) => (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[
                      styles.symptomButton,
                      selectedSymptoms.includes(symptom.name) && styles.symptomButtonSelected
                    ]}
                    onPress={() => toggleSymptom(symptom.name)}
                  >
                    <Text style={[
                      styles.symptomButtonText,
                      selectedSymptoms.includes(symptom.name) && styles.symptomButtonTextSelected
                    ]}>
                      {symptom.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Custom Symptom Input */}
          <View style={styles.customSymptomSection}>
            <Text style={styles.categoryTitle}>Add Custom Symptom</Text>
            <View style={styles.customSymptomInput}>
              <TextInput
                style={styles.textInput}
                placeholder="Describe any other symptoms..."
                value={customSymptom}
                onChangeText={setCustomSymptom}
                onSubmitEditing={addCustomSymptom}
              />
              <TouchableOpacity onPress={addCustomSymptom} style={styles.addButton}>
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Additional Information (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Your age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Context</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Any additional information about your symptoms, medical history, or recent exposures..."
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Selected Symptoms Summary */}
        {selectedSymptoms.length > 0 && (
          <View style={styles.selectedSymptomsCard}>
            <Text style={styles.cardTitle}>Selected Symptoms ({selectedSymptoms.length})</Text>
            <View style={styles.selectedSymptomsList}>
              {selectedSymptoms.map((symptom, index) => (
                <View key={index} style={styles.selectedSymptomTag}>
                  <Text style={styles.selectedSymptomText}>{symptom}</Text>
                  <TouchableOpacity onPress={() => toggleSymptom(symptom)}>
                    <Ionicons name="close-circle" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeButton, selectedSymptoms.length === 0 && styles.analyzeButtonDisabled]}
          onPress={analyzeSymptoms}
          disabled={loading || selectedSymptoms.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="analytics" size={20} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>Analyze Symptoms</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.disclaimerText}>
            This tool provides general information only and is not a substitute for professional medical advice. 
            Always consult healthcare providers for medical concerns.
          </Text>
        </View>
      </ScrollView>
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
  resultsContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  aqiCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aqiLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  aqiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  locationText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  symptomCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFFFFF',
  },
  symptomButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  symptomButtonText: {
    fontSize: 14,
    color: '#333',
  },
  symptomButtonTextSelected: {
    color: '#FFFFFF',
  },
  customSymptomSection: {
    marginTop: 16,
  },
  customSymptomInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  selectedSymptomsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedSymptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedSymptomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedSymptomText: {
    fontSize: 14,
    color: '#1976D2',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#CCC',
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#F57C00',
    lineHeight: 16,
  },
  
  // Results styles
  analysisCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  severityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  severityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 16,
  },
  analysisDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  urgentCareWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  urgentCareText: {
    flex: 1,
    fontSize: 14,
    color: '#C62828',
    fontWeight: '600',
  },
  educationCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  educationText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  pollutantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pollutantTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pollutantText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  recommendationItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  recommendationDescription: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  timestampContainer: {
    margin: 16,
    marginTop: 0,
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
  },
});

export default AISymptomAnalyzer;