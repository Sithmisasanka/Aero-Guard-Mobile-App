import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface MapScreenProps {
  navigation: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Clean Routes Map</Text>
          <Text style={styles.subtitle}>Find cleaner air quality routes</Text>
        </View>
        
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>
            🗺️ Interactive Map
          </Text>
          <Text style={styles.placeholderSubtext}>
            Map functionality is available on mobile devices
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Route Features</Text>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>🌿 Clean Air Routes</Text>
            <Text style={styles.featureDescription}>
              Find paths with better air quality for walking and cycling
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>📍 Monitoring Stations</Text>
            <Text style={styles.featureDescription}>
              View real-time data from air quality monitoring stations
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>🚨 Alert Zones</Text>
            <Text style={styles.featureDescription}>
              Get warnings about areas with poor air quality
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4ECDC4',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  mapPlaceholder: {
    backgroundColor: '#e8f5f3',
    margin: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
