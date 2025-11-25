import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { AQIService } from '../services/aqiService';
import NotificationService from '../services/notificationService';

import { UserProfile } from '../types';
import { getTranslation } from '../utils/localization';

interface SettingsScreenProps {
  navigation: any;
}

type SettingItem = 
  | { title: string; type: 'switch'; value: boolean; onToggle: (enabled: boolean) => Promise<void>; icon: string; }
  | { title: string; type: 'radio'; value: boolean; onPress: () => Promise<void>; icon: string; }
  | { title: string; type: 'button'; onPress: () => void; icon: string; destructive?: boolean; }
  | { title: string; type: 'info'; value: string; icon: string; };

type SettingSection = {
  title: string;
  items: SettingItem[];
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    enabled: true,
    minAQI: 151,
    quietHours: { start: '22:00', end: '08:00' }
  });

  useEffect(() => {
    loadSettings();
    checkNotificationPermissions();
    loadNotificationPreferences();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('SettingsScreen: Loading user settings...');
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        console.log('SettingsScreen: User profile loaded:', profile.name);
        setUserProfile(profile);
        setLanguage(profile.preferredLanguage || 'en');
      } else {
        console.log('SettingsScreen: No user profile found');
      }
    } catch (error) {
      console.error('SettingsScreen: Error loading settings:', error);
    }
  };

  const checkNotificationPermissions = async () => {
    const settings = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(settings.granted);
  };

  const loadNotificationPreferences = async () => {
    try {
      const prefs = await AsyncStorage.getItem('notification_preferences');
      if (prefs) {
        setNotificationPrefs(JSON.parse(prefs));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const updateLanguage = async (newLanguage: 'en' | 'si' | 'ta') => {
    try {
      setLanguage(newLanguage);
      
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          preferredLanguage: newLanguage,
        };
        
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        setUserProfile(updatedProfile);
      }
      
      Alert.alert('Success', 'Language updated successfully!');
    } catch (error) {
      console.error('Error updating language:', error);
      Alert.alert('Error', 'Failed to update language.');
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    try {
      if (enabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          setNotificationsEnabled(true);
          // Configure notification settings
          await Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
        } else {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive air quality alerts.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const updateNotificationThreshold = async (minAQI: number) => {
    try {
      const updatedPrefs = { ...notificationPrefs, minAQI };
      setNotificationPrefs(updatedPrefs);
      const notificationService = NotificationService.getInstance();
      await notificationService.updateNotificationPreferences(updatedPrefs);
      Alert.alert('Success', `Notifications will now trigger when AQI exceeds ${minAQI}`);
    } catch (error) {
      console.error('Error updating notification threshold:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    }
  };

  const sendTestNotification = async () => {
    try {
      const success = await AQIService.sendTestNotification();
      if (success) {
        Alert.alert('Test Sent', 'Check your notifications to see if the test alert was delivered.');
      } else {
        Alert.alert('Test Failed', 'Unable to send test notification. Please check your notification permissions.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const showNotificationThresholdPicker = () => {
    Alert.alert(
      'Notification Threshold',
      'When should you receive air quality alerts?',
      [
        { text: 'Unhealthy for Sensitive (101+)', onPress: () => updateNotificationThreshold(101) },
        { text: 'Unhealthy (151+)', onPress: () => updateNotificationThreshold(151) },
        { text: 'Very Unhealthy (201+)', onPress: () => updateNotificationThreshold(201) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const clearData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all your data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setUserProfile(null);
              setLanguage('en');
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  const openAbout = () => {
    Alert.alert(
      'About AeroGuard',
      'AeroGuard v1.0.0\n\nA personalized pollution exposure minimizer aligned with SDG 11 (Sustainable Cities and Communities).\n\nDeveloped with React Native and Expo.',
      [{ text: 'OK' }]
    );
  };

  const openPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. We only collect location data to provide air quality information and do not share your personal data with third parties.',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to sign in again to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting logout process...');
              
              // Clear user data first
              await AsyncStorage.removeItem('userProfile');
              setUserProfile(null);
              setLanguage('en');
              
              // Sign out from Firebase
              await authService.signOut();
              
              console.log('Logout completed successfully');
              Alert.alert('Success', 'You have been logged out successfully.');
              
              // Navigation will be handled automatically by AppNavigator's auth state change
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const settingSections: SettingSection[] = [
    {
      title: getTranslation('notifications', language),
      items: [
        {
          title: getTranslation('enablePushNotifications', language),
          type: 'switch',
          value: notificationsEnabled,
          onToggle: toggleNotifications,
          icon: 'notifications-outline',
        },
        ...(notificationsEnabled ? [
          {
            title: `${getTranslation('alertThreshold', language)} (AQI ${notificationPrefs.minAQI}+)`,
            type: 'button' as const,
            onPress: showNotificationThresholdPicker,
            icon: 'warning-outline' as const,
          },
          {
            title: getTranslation('sendTestNotification', language),
            type: 'button' as const,
            onPress: sendTestNotification,
            icon: 'send-outline' as const,
          },
        ] : []),
      ],
    },
    {
      title: getTranslation('language', language),
      items: [
        {
          title: getTranslation('english', language),
          type: 'radio',
          value: language === 'en',
          onPress: async () => updateLanguage('en'),
          icon: 'language-outline',
        },
        {
          title: getTranslation('sinhala', language),
          type: 'radio',
          value: language === 'si',
          onPress: async () => updateLanguage('si'),
          icon: 'language-outline',
        },
        {
          title: getTranslation('tamil', language),
          type: 'radio',
          value: language === 'ta',
          onPress: async () => updateLanguage('ta'),
          icon: 'language-outline',
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          title: 'Privacy Policy',
          type: 'button',
          onPress: openPrivacyPolicy,
          icon: 'shield-outline',
        },
        {
          title: 'Clear All Data',
          type: 'button',
          onPress: clearData,
          icon: 'trash-outline',
          destructive: true,
        },
      ],
    },
    {
      title: getTranslation('about', language),
      items: [
        {
          title: getTranslation('aboutAeroGuard', language),
          type: 'button',
          onPress: openAbout,
          icon: 'information-circle-outline',
        },
        {
          title: getTranslation('version', language),
          type: 'info',
          value: '1.0.0',
          icon: 'code-outline',
        },
      ],
    },
  ];

  return (
    <LinearGradient
      colors={['rgba(138, 173, 244, 0.12)', 'rgba(174, 139, 248, 0.08)', 'rgba(255, 182, 193, 0.05)']}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
      {/* User Info Section */}
      {userProfile && (
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={60} color="#007AFF" />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <Text style={styles.userMeta}>
                {userProfile.age} years old • {userProfile.healthConditions.length} health condition(s)
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Settings Sections */}
      {settingSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={item.type === 'button' && (item as any).destructive ? '#FF6B6B' : '#666'} 
                />
                <Text 
                  style={[
                    styles.settingTitle, 
                    item.type === 'button' && (item as any).destructive && styles.destructiveText
                  ]}
                >
                  {item.title}
                </Text>
              </View>
              
              <View style={styles.settingRight}>
                {item.type === 'switch' && (
                  <Switch
                    value={(item as Extract<SettingItem, { type: 'switch' }>).value}
                    onValueChange={(item as Extract<SettingItem, { type: 'switch' }>).onToggle}
                    trackColor={{ false: '#767577', true: '#007AFF' }}
                    thumbColor={(item as Extract<SettingItem, { type: 'switch' }>).value ? '#ffffff' : '#f4f3f4'}
                  />
                )}
                
                {item.type === 'radio' && (
                  <TouchableOpacity onPress={(item as Extract<SettingItem, { type: 'radio' }>).onPress}>
                    <Ionicons
                      name={(item as Extract<SettingItem, { type: 'radio' }>).value ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={(item as Extract<SettingItem, { type: 'radio' }>).value ? '#007AFF' : '#ccc'}
                    />
                  </TouchableOpacity>
                )}
                
                {item.type === 'button' && (
                  <TouchableOpacity onPress={(item as Extract<SettingItem, { type: 'button' }>).onPress}>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                )}
                
                {item.type === 'info' && (
                  <Text style={styles.infoText}>{(item as Extract<SettingItem, { type: 'info' }>).value}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* SDG Information */}
      <View style={styles.sdgSection}>
        <Text style={styles.sdgTitle}>Supporting SDG 11</Text>
        <Text style={styles.sdgDescription}>
          Sustainable Cities and Communities - Making cities inclusive, safe, resilient and sustainable
        </Text>
        <View style={styles.sdgBadge}>
          <Ionicons name="leaf" size={20} color="#4ECDC4" />
          <Text style={styles.sdgBadgeText}>Sustainable Development Goal 11</Text>
        </View>
      </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  userSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    padding: 8,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  destructiveText: {
    color: '#FF6B6B',
  },
  settingRight: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  sdgSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 32,
  },
  sdgTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sdgDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  sdgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fffe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  sdgBadgeText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
    marginLeft: 6,
  },
});
