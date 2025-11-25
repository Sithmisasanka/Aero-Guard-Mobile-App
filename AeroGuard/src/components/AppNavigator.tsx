import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import RouteMapScreen from '../screens/RouteMapScreen';
import { ForecastScreen } from '../screens/ForecastScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import { RootStackParamList } from '../types';
import * as userService from '../services/userService';
import * as authService from '../services/authService';
import { HistoryScreen } from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator<RootStackParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
  let iconName: any;

  switch (routeName) {
    case 'Home':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Profile':
      iconName = focused ? 'person' : 'person-outline';
      break;
    case 'Forecast':
      iconName = focused ? 'analytics' : 'analytics-outline';
      break;
    case 'Map':
      iconName = focused ? 'map' : 'map-outline';
      break;
    case 'Settings':
      iconName = focused ? 'settings' : 'settings-outline';
      break;
    default:
      iconName = 'circle';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

// Create a Profile Stack Navigator to include History screen
const ProfileStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={UserProfileScreen}
        options={{ 
          headerTitle: 'Health Profile',
        }}
      />
      <Stack.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ 
          headerShown: false, // History has its own header
        }}
      />
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="Forecast"
        component={ForecastScreen}
        options={{
          tabBarLabel: 'Forecast',
          headerShown: true,
          headerTitle: 'Air Quality Forecast',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Map"
        component={RouteMapScreen}
        options={{
          tabBarLabel: 'Routes',
          headerShown: true,
          headerTitle: 'Safe Route Planner',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          headerShown: true,
          headerTitle: 'Settings',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </Tab.Navigator>
  );
};

const MainStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
    </Stack.Navigator>
  );
};


export const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    console.log('AppNavigator: Setting up auth listeners...');

    // Listen to both user service changes and Firebase auth state changes
    const userServiceUnsub = userService.onUserChange((u: any) => {
      if (!mounted) return;
      console.log('AppNavigator: User service change detected:', u ? u.name : 'null');
      setCurrentUser(u);
    });

    const authStateUnsub = authService.onAuthStateChanged((firebaseUser: any) => {
      if (!mounted) return;
      console.log('AppNavigator: Firebase auth state change:', firebaseUser ? firebaseUser.uid : 'null');
      
      // If Firebase user is null, ensure local user is also cleared
      if (!firebaseUser) {
        setCurrentUser(null);
      }
    });

    // Initialize current user
    (async () => {
      try {
        const u = await userService.getCurrentUser();
        const firebaseUser = authService.getAuthCurrentUser();
        
        console.log('AppNavigator: Initial state check - Local user:', u ? u.name : 'null');
        console.log('AppNavigator: Initial state check - Firebase user:', firebaseUser ? firebaseUser.uid : 'null');
        
        if (!mounted) return;
        
        // If we have a local user but no Firebase user, clear local user
        if (u && !firebaseUser) {
          console.log('AppNavigator: Local user exists but no Firebase user, clearing...');
          await userService.setCurrentUserAndNotify(null);
          setCurrentUser(null);
        } else {
          setCurrentUser(u);
        }
      } catch (e) {
        console.error('Failed reading current user', e);
      } finally {
        if (mounted) {
          console.log('AppNavigator: Initialization complete');
          setInitializing(false);
        }
      }
    })();

    return () => {
      console.log('AppNavigator: Cleaning up listeners...');
      mounted = false;
      userServiceUnsub();
      authStateUnsub();
    };
  }, []);

  if (initializing) {
    console.log('AppNavigator: Still initializing...');
    return null;
  }

  console.log('AppNavigator: Rendering with user:', currentUser ? currentUser.name : 'null');

  return (
    <NavigationContainer>
      {currentUser ? (
        <MainStackNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
