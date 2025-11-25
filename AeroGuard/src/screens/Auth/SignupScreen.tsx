import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as authService from '../../services/authService';

export const SignupScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<any>();

  const create = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a name');
      return;
    }

    const user = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      createdAt: Date.now(),
    };
  try {
    // if email/password provided, create firebase auth user
    if (email && password) {
      await authService.signUpWithEmail(email.trim(), password, name.trim());
    } else {
      // fallback: save locally
      await (await import('../../services/userService')).saveUser(user as any);
    }
    (navigation as any).navigate('Login');
  } catch (e: any) {
    console.error('Signup failed', e);
    Alert.alert('Signup failed', e?.message || String(e));
  }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Profile</Text>
        <Text style={styles.subtitle}>Add your name and (optional) email</Text>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Jane Doe" />

        <Text style={[styles.label, { marginTop: 12 }]}>Email (optional)</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />

        <Text style={[styles.label, { marginTop: 12 }]}>Password (optional for secure account)</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Choose a password" secureTextEntry />

        <TouchableOpacity style={styles.createButton} onPress={create}>
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', paddingVertical: 40 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 6 },
  label: { fontSize: 14, color: '#333', marginBottom: 6 },
  input: { backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  createButton: { backgroundColor: '#007AFF', marginTop: 20, padding: 14, borderRadius: 10, alignItems: 'center' },
  createText: { color: 'white', fontWeight: '600' },
});
