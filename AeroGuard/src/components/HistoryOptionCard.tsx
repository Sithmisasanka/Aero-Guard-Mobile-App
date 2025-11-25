import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HistoryOptionCardProps {
  onPress: () => void;
}

export const HistoryOptionCard: React.FC<HistoryOptionCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="bar-chart-outline" size={24} color="#007bff" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Air Quality History</Text>
          <Text style={styles.subtitle}>View past 7 days AQI data and trends</Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  arrowContainer: {
    marginLeft: 8,
  },
});