import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as authService from '../services/authService';

interface LogoutButtonProps {
  style?: any;
  iconSize?: number;
  textColor?: string;
  iconColor?: string;
  showText?: boolean;
  onLogoutComplete?: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  style,
  iconSize = 24,
  textColor = '#FF6B6B',
  iconColor = '#FF6B6B',
  showText = true,
  onLogoutComplete,
}) => {
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
              await authService.signOut();
              Alert.alert('Success', 'You have been logged out successfully.');
              onLogoutComplete?.();
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={handleLogout}>
      <Ionicons name="log-out-outline" size={iconSize} color={iconColor} />
      {showText && <Text style={[styles.text, { color: textColor }]}>Logout</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  text: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LogoutButton;
