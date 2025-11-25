import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { auth } from '../services/firebase';
import * as authService from '../services/authService';

export const FirebaseTestScreen: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    // Check if Firebase is configured
    setIsConfigured(!!auth);

    // Listen to auth state changes
    if (auth) {
      const unsubscribe = authService.onAuthStateChanged((user) => {
        setAuthUser(user);
      });
      return unsubscribe;
    }
  }, []);

  const testEmailSignup = async () => {
    try {
      await authService.signUpWithEmail('test@example.com', 'test123456', 'Test User');
      Alert.alert('Success', 'User created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const testEmailLogin = async () => {
    try {
      await authService.signInWithEmail('test@example.com', 'test123456');
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const testSignOut = async () => {
    try {
      await authService.signOut();
      Alert.alert('Success', 'Signed out successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Authentication Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Firebase Status:</Text>
        <Text style={[styles.statusValue, { color: isConfigured ? 'green' : 'red' }]}>
          {isConfigured ? '✅ Configured' : '❌ Not Configured'}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Auth User:</Text>
        <Text style={styles.statusValue}>
          {authUser ? `✅ ${authUser.email}` : '❌ Not logged in'}
        </Text>
      </View>

      {isConfigured ? (
        <View style={styles.buttonContainer}>
          <Button title="Test Email Signup" onPress={testEmailSignup} />
          <View style={styles.spacing} />
          <Button title="Test Email Login" onPress={testEmailLogin} />
          <View style={styles.spacing} />
          <Button title="Sign Out" onPress={testSignOut} />
        </View>
      ) : (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Firebase Not Configured</Text>
          <Text style={styles.instructionsText}>
            Please add your Firebase configuration to the .env file:
          </Text>
          <Text style={styles.codeText}>
            EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key{'\n'}
            EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain{'\n'}
            EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id{'\n'}
            ...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 30,
  },
  spacing: {
    height: 15,
  },
  instructionsContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    color: '#333',
  },
});
