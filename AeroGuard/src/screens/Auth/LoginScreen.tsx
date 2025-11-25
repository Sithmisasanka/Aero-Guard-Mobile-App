import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as userService from '../../services/userService';
import { StoredUser } from '../../services/userService';
import * as authService from '../../services/authService';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { useNavigation } from '@react-navigation/native';

export const LoginScreen: React.FC = () => {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const sub = navigation.addListener('focus', loadUsers);
    loadUsers();
    return () => {
      sub && sub();
    };
  }, []);

  const loadUsers = async () => {
    const list = await userService.listUsers();
    setUsers(list);
  };

  const login = async (user: StoredUser) => {
    try {
      // Notify subscribers (AppNavigator) so the UI switches to the main app immediately
      await userService.setCurrentUserAndNotify(user);
      console.log('LoginScreen: Set current user and notified:', user.name);
    } catch (e) {
      console.error('LoginScreen: Failed to set current user', e);
      Alert.alert('Login Error', 'Unable to switch to the selected account. Please try again.');
    }
  };

  const loginWithEmail = async () => {
    try {
      if (submitting) return;
      setSubmitting(true);
      if (!email || !password) {
        Alert.alert('Validation', 'Enter email and password to sign in.');
        return; 
      }
      const auth = await import('../../services/authService');
      await auth.signInWithEmail(email.trim(), password);
      // userService will be updated by auth flow
    } catch (e: any) {
      console.error('Sign in failed', e);
      Alert.alert('Sign in failed', e?.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  // Google sign-in setup (Expo) - Use the client IDs we configured
  WebBrowser.maybeCompleteAuthSession();
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'placeholder',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'placeholder',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'placeholder',
    webClientId: '490118119734-49hd2iocd4lq3ouebif3cr2pb5miar3d.apps.googleusercontent.com', // Firebase Web Client ID
  });
  
  // Check if Google OAuth is properly configured
  const hasGoogleConfig = !!(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID &&
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID &&
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID !== 'placeholder'
  );

  React.useEffect(() => {
    (async () => {
      if (!hasGoogleConfig) return; // Skip if Google auth not configured
      
      if (response?.type === 'success') {
        const { authentication } = response;
        if (authentication?.accessToken) {
          try {
            const { GoogleAuthProvider } = await import('firebase/auth');
            const credential = GoogleAuthProvider.credential(authentication?.idToken, authentication?.accessToken);
            await authService.signInWithFirebaseCredential(credential);
          } catch (e) {
            console.warn('Google Firebase sign in failed', e);
            Alert.alert('Google sign-in failed', String(e));
          }
        }
      }
    })();
  }, [response, hasGoogleConfig]);

  const handleGoogleSignIn = async () => {
    if (!hasGoogleConfig || !promptAsync) {
      Alert.alert('Google Sign-In', 'Google OAuth is not configured. Please configure EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID environment variables.');
      return;
    }
    
    try {
      if (submitting) return;
      setSubmitting(true);
      await promptAsync();
    } catch (e) {
      console.error('Google sign-in prompt failed', e);
      Alert.alert('Google sign-in failed', String(e));
    } finally {
      setSubmitting(false);
    }
  };

  

  const handleAnonymousSignIn = async () => {
    try {
      if (submitting) return;
      setSubmitting(true);
      console.log('Anonymous Sign-In button pressed');
      await authService.signInAnonymouslyWithFirebase();
      console.log('Anonymous Sign-In completed successfully');
    } catch (e: any) {
      console.error('Anonymous sign-in failed in LoginScreen:', e);
      
      // Show user-friendly error messages
      let errorMessage = 'Anonymous sign-in failed. Please try again.';
      if (e.message?.includes('not enabled')) {
        errorMessage = 'Anonymous authentication is not enabled. Please contact support.';
      } else if (e.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      Alert.alert('Anonymous Sign-In Failed', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemove = (id: string) => {
    Alert.alert('Remove user', 'Remove this user from the device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await userService.removeUser(id); loadUsers(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people-circle-outline" size={96} color="#007AFF" />
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Choose a user or create a new profile</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <TouchableOpacity style={styles.userInfo} onPress={() => login(item)}>
              <Ionicons name="person-circle" size={40} color="#333" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email || ''}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeButton} onPress={() => confirmRemove(item.id)}>
              <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#666' }}>No users yet — create one.</Text>
          </View>
        )}
      />

      <View style={{ padding: 16 }}>
        <Text style={{ marginBottom: 6, color: '#333', fontWeight: '600' }}>Email</Text>
        <TextInput style={[styles.input || { padding: 12, backgroundColor: '#fff', borderRadius: 8 }]} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        <Text style={{ marginBottom: 6, marginTop: 12, color: '#333', fontWeight: '600' }}>Password</Text>
        <TextInput style={[styles.input || { padding: 12, backgroundColor: '#fff', borderRadius: 8 }]} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <TouchableOpacity style={[styles.signupButton, { marginTop: 12, opacity: submitting ? 0.6 : 1 }]} onPress={loginWithEmail} disabled={submitting}>
          <Text style={styles.signupText}>{submitting ? 'Signing in…' : 'Sign in with Email'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.signupButton, { backgroundColor: '#DB4437', marginTop: 8, opacity: submitting ? 0.6 : 1 }]} onPress={handleGoogleSignIn} disabled={submitting}>
          <Text style={styles.signupText}>{submitting ? 'Opening Google…' : 'Sign in with Google'}</Text>
        </TouchableOpacity>

      

        <TouchableOpacity style={[styles.signupButton, { backgroundColor: '#6B7280', marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: submitting ? 0.6 : 1 }]} onPress={handleAnonymousSignIn} disabled={submitting}>
          <Ionicons name="person-outline" size={16} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.signupText}>{submitting ? 'Signing in…' : 'Continue as Guest'}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.signupButton} onPress={() => (navigation as any).navigate('Signup')}>
            <Text style={styles.signupText}>Create New Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', paddingVertical: 40 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 12 },
  subtitle: { color: '#666', marginTop: 6 },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 12, elevation: 2 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userEmail: { color: '#666', fontSize: 12 },
  removeButton: { padding: 8 },
  footer: { padding: 16 },
  signupButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 12, alignItems: 'center' },
  signupText: { color: 'white', fontWeight: '600' },
  input: { backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
});
