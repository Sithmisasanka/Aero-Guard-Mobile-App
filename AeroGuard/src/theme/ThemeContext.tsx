import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './colors';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'app_theme_mode';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [theme, setTheme] = useState<Theme>(lightTheme);

  // Determine if dark mode should be active
  const isDarkMode = () => {
    switch (themeMode) {
      case 'dark':
        return true;
      case 'light':
        return false;
      case 'auto':
        return systemColorScheme === 'dark';
      default:
        return false;
    }
  };

  // Update theme when mode or system scheme changes
  useEffect(() => {
    const isDark = isDarkMode();
    setTheme(isDark ? darkTheme : lightTheme);
  }, [themeMode, systemColorScheme]);

  // Load theme preference from storage on app start
  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const currentIsDark = isDarkMode();
    setThemeMode(currentIsDark ? 'light' : 'dark');
  };

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    isDark: isDarkMode(),
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hooks for common theme properties
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

export const useIsDark = () => {
  const { isDark } = useTheme();
  return isDark;
};