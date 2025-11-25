import React, { useState, useEffect } from 'react';
import { HistoryOptionCard } from '../components/HistoryOptionCard';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { UserProfile, HealthCondition } from '../types';
import { getTranslation } from '../utils/localization';
import * as userService from '../services/userService';

interface UserProfileScreenProps {
  language?: 'en' | 'si' | 'ta';
  onProfileSaved?: (profile: UserProfile) => void;
  navigation: any;
}

const { width } = Dimensions.get('window');

const HEALTH_CONDITIONS = [
  { id: 'asthma', name: 'asthma' },
  { id: 'heartDisease', name: 'heartDisease' },
  { id: 'respiratoryIssues', name: 'respiratoryIssues' },
  { id: 'diabetes', name: 'diabetes' },
  { id: 'copd', name: 'copd' },
  { id: 'allergies', name: 'allergies' },
  { id: 'pregnancy', name: 'pregnancy' },
  { id: 'elderlyAge', name: 'elderlyAge' },
  { id: 'childUnder12', name: 'childUnder12' },
];

const SEVERITY_LEVELS = ['mild', 'moderate', 'severe'] as const;

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  language = 'en',
  onProfileSaved,
  navigation,
}) => {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    age: 0,
    healthConditions: [],
    preferredLanguage: language,
    notificationSettings: {
      enablePushNotifications: true,
      aqiThreshold: 100,
      locationBasedAlerts: true,
    },
    location: {
      latitude: 0,
      longitude: 0,
      city: '',
    },
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return;
    }

    if (profile.age <= 0 || profile.age > 120) {
      Alert.alert('Validation Error', 'Please enter a valid age');
      return;
    }

    try {
      setSaving(true);
      const profileToSave = {
        ...profile,
        id: profile.id || Date.now().toString(),
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(profileToSave));
      setProfile(profileToSave);
      
      if (onProfileSaved) {
        onProfileSaved(profileToSave);
      }

      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    Alert.alert('Sign out', 'Do you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await userService.setCurrentUserAndNotify(null); } },
    ]);
  };

  const updateHealthCondition = (conditionId: string, updates: Partial<HealthCondition>) => {
    setProfile(prev => ({
      ...prev,
      healthConditions: prev.healthConditions.map(condition =>
        condition.id === conditionId ? { ...condition, ...updates } : condition
      ),
    }));
  };

  const toggleHealthCondition = (conditionId: string, conditionName: string) => {
    setProfile(prev => {
      const existingCondition = prev.healthConditions.find(c => c.id === conditionId);
      
      if (existingCondition) {
        // Remove condition
        return {
          ...prev,
          healthConditions: prev.healthConditions.filter(c => c.id !== conditionId),
        };
      } else {
        // Add condition
        return {
          ...prev,
          healthConditions: [
            ...prev.healthConditions,
            {
              id: conditionId,
              name: conditionName,
              severity: 'mild',
              isActive: true,
            },
          ],
        };
      }
    });
  };

  const updateNotificationSettings = (key: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [key]: value,
      },
    }));
  };

  const hasHealthCondition = (conditionId: string) => {
    return profile.healthConditions.some(c => c.id === conditionId);
  };

  const getHealthCondition = (conditionId: string) => {
    return profile.healthConditions.find(c => c.id === conditionId);
  };

  const navigateToHistory = () => {
    navigation.navigate('History');
  };

  return (
    <LinearGradient
      colors={['rgba(138, 173, 244, 0.12)', 'rgba(174, 139, 248, 0.08)', 'rgba(255, 182, 193, 0.05)']}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={80} color="#007AFF" />
        <Text style={styles.headerTitle}>
          {getTranslation('healthProfile', language)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Air Quality</Text>
        <HistoryOptionCard onPress={navigateToHistory} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {getTranslation('personalInfo', language)}
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {getTranslation('name', language)}
          </Text>
          <TextInput
            style={styles.textInput}
            value={profile.name}
            onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
            placeholder={getTranslation('enterName', language)}
            accessibilityLabel="Name input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {getTranslation('age', language)}
          </Text>
          <TextInput
            style={styles.textInput}
            value={profile.age > 0 ? profile.age.toString() : ''}
            onChangeText={(text) => {
              const age = parseInt(text) || 0;
              setProfile(prev => ({ ...prev, age }));
            }}
            placeholder={getTranslation('enterAge', language)}
            keyboardType="numeric"
            accessibilityLabel="Age input"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {getTranslation('healthConditions', language)}
        </Text>
        
        {HEALTH_CONDITIONS.map((condition) => {
          const hasCondition = hasHealthCondition(condition.id);
          const conditionData = getHealthCondition(condition.id);
          
          return (
            <View key={condition.id} style={styles.conditionItem}>
              <View style={styles.conditionHeader}>
                <Text style={styles.conditionName}>
                  {getTranslation(condition.name, language)}
                </Text>
                <Switch
                  value={hasCondition}
                  onValueChange={() => toggleHealthCondition(condition.id, condition.name)}
                  trackColor={{ false: '#767577', true: '#007AFF' }}
                  thumbColor={hasCondition ? '#ffffff' : '#f4f3f4'}
                />
              </View>
              
              {hasCondition && conditionData && (
                <View style={styles.severitySection}>
                  <Text style={styles.severityLabel}>
                    {getTranslation('severity', language)}:
                  </Text>
                  <View style={styles.severityButtons}>
                    {SEVERITY_LEVELS.map((severity) => (
                      <TouchableOpacity
                        key={severity}
                        style={[
                          styles.severityButton,
                          conditionData.severity === severity && styles.severityButtonActive,
                        ]}
                        onPress={() => updateHealthCondition(condition.id, { severity })}
                      >
                        <Text
                          style={[
                            styles.severityButtonText,
                            conditionData.severity === severity && styles.severityButtonTextActive,
                          ]}
                        >
                          {getTranslation(severity, language)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {getTranslation('notifications', language)}
        </Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>
            {getTranslation('enablePushNotifications', language)}
          </Text>
          <Switch
            value={profile.notificationSettings.enablePushNotifications}
            onValueChange={(value) => updateNotificationSettings('enablePushNotifications', value)}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={profile.notificationSettings.enablePushNotifications ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>
            {getTranslation('locationBasedAlerts', language)}
          </Text>
          <Switch
            value={profile.notificationSettings.locationBasedAlerts}
            onValueChange={(value) => updateNotificationSettings('locationBasedAlerts', value)}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={profile.notificationSettings.locationBasedAlerts ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {getTranslation('aqiAlertThreshold', language)}
          </Text>
          <TextInput
            style={styles.textInput}
            value={profile.notificationSettings.aqiThreshold.toString()}
            onChangeText={(text) => {
              const threshold = parseInt(text) || 100;
              updateNotificationSettings('aqiThreshold', threshold);
            }}
            placeholder="100"
            keyboardType="numeric"
            accessibilityLabel="AQI alert threshold"
          />
          <Text style={styles.helperText}>
            {getTranslation('aqiThresholdHelper', language)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {getTranslation('language', language)}
        </Text>
        
        <View style={styles.languageButtons}>
          {[
            { code: 'en', name: 'english' },
            { code: 'si', name: 'sinhala' },
            { code: 'ta', name: 'tamil' },
          ].map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                profile.preferredLanguage === lang.code && styles.languageButtonActive,
              ]}
              onPress={() => setProfile(prev => ({ ...prev, preferredLanguage: lang.code as 'en' | 'si' | 'ta' }))}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  profile.preferredLanguage === lang.code && styles.languageButtonTextActive,
                ]}
              >
                {getTranslation(lang.name, language)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveProfile}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? getTranslation('saving', language) : getTranslation('save', language)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#FF6B6B' }]} onPress={logout}>
        <Text style={styles.saveButtonText}>Sign out</Text>
      </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  conditionItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  severitySection: {
    marginTop: 12,
  },
  severityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  severityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  severityButtonText: {
    fontSize: 14,
    color: '#666',
  },
  severityButtonTextActive: {
    color: 'white',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#666',
  },
  languageButtonTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
