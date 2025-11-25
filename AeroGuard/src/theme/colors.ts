export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    glass: string;
    glassLight: string;
    overlay: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  
  // Component colors
  card: {
    background: string;
    border: string;
    shadow: string;
  };
  
  // Button colors
  button: {
    primary: string;
    secondary: string;
    disabled: string;
    text: string;
  };
  
  // Input colors
  input: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
  };
  
  // Status colors
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // AQI level colors
  aqi: {
    good: string;
    moderate: string;
    unhealthySensitive: string;
    unhealthy: string;
    veryUnhealthy: string;
    hazardous: string;
  };
}

// Light theme colors
export const lightColors: ThemeColors = {
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#E9ECEF',
    glass: 'rgba(255, 255, 255, 0.15)',
    glassLight: 'rgba(255, 255, 255, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  
  text: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    tertiary: '#757575',
    inverse: '#FFFFFF',
    accent: '#007AFF',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
  },
  
  card: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.25)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  button: {
    primary: '#007AFF',
    secondary: '#6C757D',
    disabled: '#E9ECEF',
    text: '#FFFFFF',
  },
  
  input: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.3)',
    text: '#1A1A1A',
    placeholder: '#757575',
  },
  
  status: {
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
  },
  
  aqi: {
    good: '#00E400',
    moderate: '#FFFF00',
    unhealthySensitive: '#FF7E00',
    unhealthy: '#FF0000',
    veryUnhealthy: '#8F3F97',
    hazardous: '#7E0023',
  },
};

// Dark theme colors
export const darkColors: ThemeColors = {
  background: {
    primary: '#000000',
    secondary: '#1A1A1A',
    tertiary: '#2D2D2D',
    glass: 'rgba(42, 42, 46, 0.7)',
    glassLight: 'rgba(42, 42, 46, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E7',
    tertiary: '#AEAEB2',
    inverse: '#1A1A1A',
    accent: '#0A84FF',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
  },
  
  card: {
    background: 'rgba(42, 42, 46, 0.7)',
    border: 'rgba(84, 84, 88, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
  
  button: {
    primary: '#0A84FF',
    secondary: '#48484A',
    disabled: '#2D2D2D',
    text: '#FFFFFF',
  },
  
  input: {
    background: 'rgba(42, 42, 46, 0.5)',
    border: 'rgba(84, 84, 88, 0.6)',
    text: '#FFFFFF',
    placeholder: '#AEAEB2',
  },
  
  status: {
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#64D2FF',
  },
  
  aqi: {
    good: '#32D74B',
    moderate: '#FFD60A',
    unhealthySensitive: '#FF9500',
    unhealthy: '#FF453A',
    veryUnhealthy: '#AF52DE',
    hazardous: '#FF2D92',
  },
};

// Theme gradients
export const lightGradients = [
  'rgba(138, 173, 244, 0.12)',
  'rgba(174, 139, 248, 0.08)',
  'rgba(255, 182, 193, 0.05)',
];

export const darkGradients = [
  'rgba(23, 23, 25, 0.9)',
  'rgba(42, 42, 46, 0.8)',
  'rgba(58, 58, 62, 0.6)',
];

// Common theme properties
export const commonTheme = {
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Border radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Shadows
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Theme interface
export interface Theme {
  colors: ThemeColors;
  gradients: string[];
  spacing: typeof commonTheme.spacing;
  borderRadius: typeof commonTheme.borderRadius;
  fontSize: typeof commonTheme.fontSize;
  fontWeight: typeof commonTheme.fontWeight;
  shadow: typeof commonTheme.shadow;
  isDark: boolean;
}

// Light theme
export const lightTheme: Theme = {
  colors: lightColors,
  gradients: lightGradients,
  ...commonTheme,
  isDark: false,
};

// Dark theme
export const darkTheme: Theme = {
  colors: darkColors,
  gradients: darkGradients,
  ...commonTheme,
  isDark: true,
};