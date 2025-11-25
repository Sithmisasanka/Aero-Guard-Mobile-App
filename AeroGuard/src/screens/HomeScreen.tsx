import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ModernAQIDisplay } from '../components/ModernAQIDisplay';
import { LogoutButton } from '../components/LogoutButton';
import { StoredUser, onUserChange } from '../services/userService';
import { UserProfile } from '../types';
import { getTranslation } from '../utils/localization';

export const HomeScreen: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onUserChange((user: StoredUser | null) => {
      setCurrentUser(user);
    });
    
    loadUserProfile();

    return unsubscribe;
  }, []);

  const loadUserProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Trigger a refresh of the AQI data through the realtime service
    // The ModernAQIDisplay component will handle the actual refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <LinearGradient
      colors={['rgba(110, 135, 219, 0.97)', 'rgba(174, 139, 248, 0.08)', 'rgba(255, 182, 193, 0.05)']}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {getTranslation('welcomeToAeroGuard', userProfile?.preferredLanguage || 'en')}
            </Text>
            {currentUser && (
              <Text style={styles.subtitle}>
                {currentUser.name}
              </Text>
            )}
          </View>
          {currentUser && (
            <LogoutButton
              iconSize={20}
              iconColor="rgba(255, 255, 255, 0.9)"
              textColor="rgba(255, 255, 255, 0.9)"
              showText={false}
              style={styles.logoutButton}
            />
          )}
        </View>
      </View>
      
      <ModernAQIDisplay 
        language={userProfile?.preferredLanguage || 'en'}
        hasHealthConditions={userProfile?.healthConditions && userProfile.healthConditions.length > 0}
        healthConditions={userProfile?.healthConditions || []}
      />
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
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
});
