// AQI Data Types
export interface AQIData {
  aqi: number;
  city: string;
  country: string;
  station: string;
  timestamp: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
}

// IQAir API Response Types
export interface IQAirPollution {
  ts: string;
  aqius: number;
  mainus: string;
  aqicn: number;
  maincn: string;
}

export interface IQAirWeather {
  ts: string;
  tp: number;
  pr: number;
  hu: number;
  ws: number;
  wd: number;
  ic: string;
}

export interface IQAirCurrent {
  pollution: IQAirPollution;
  weather: IQAirWeather;
}

export interface IQAirLocation {
  type: string;
  coordinates: [number, number];
}

export interface IQAirStation {
  name: string;
}

export interface IQAirData {
  city: string;
  state: string;
  country: string;
  location: IQAirLocation;
  current: IQAirCurrent;
  station?: IQAirStation;
}

export interface AQIResponse {
  status: string;
  data: IQAirData;
}

// User Profile Types
export interface HealthCondition {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  healthConditions: HealthCondition[];
  preferredLanguage: 'en' | 'si' | 'ta';
  notificationSettings: {
    enablePushNotifications: boolean;
    aqiThreshold: number;
    locationBasedAlerts: boolean;
  };
  location: {
    latitude: number;
    longitude: number;
    city: string;
  };
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Forecast: undefined;
  Profile: undefined;
  ProfileMain: undefined;
  Map: undefined;
  Settings: undefined;
  Login: undefined;
  Signup: undefined;
  TabNavigator: undefined;
  History: undefined;
};

// AQI Risk Levels
export type AQIRiskLevel = 'good' | 'moderate' | 'unhealthySensitive' | 'unhealthy' | 'veryUnhealthy' | 'hazardous';

export interface AQIRiskInfo {
  level: AQIRiskLevel;
  color: string;
  description: string;
  recommendation: string;
}

// Localization Types
export interface Translation {
  en: string;
  si: string;
  ta: string;
}

export interface Translations {
  [key: string]: Translation;
}
