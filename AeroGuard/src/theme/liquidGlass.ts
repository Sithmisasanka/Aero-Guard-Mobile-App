export const LiquidGlassTheme = {
  // Gradient colors for backgrounds
  gradientColors: [
    'rgba(138, 173, 244, 0.12)', 
    'rgba(174, 139, 248, 0.08)', 
    'rgba(255, 182, 193, 0.05)'
  ],

  // Glass card styles
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  // Glass card with more transparency
  glassCardLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Glass button styles
  glassButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  // Glass input styles
  glassInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    color: '#333',
  },

  // Hero/Main glass section
  glassHero: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  // Floating elements (like recenter button)
  glassFloating: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  // AQI Circle glass effect
  glassCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Colors for different elements
  colors: {
    text: {
      primary: '#333',
      secondary: '#666',
      light: '#999',
      white: '#fff',
    },
    glass: {
      primary: 'rgba(255, 255, 255, 0.15)',
      secondary: 'rgba(255, 255, 255, 0.12)',
      light: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.25)',
      borderLight: 'rgba(255, 255, 255, 0.15)',
    },
    shadow: {
      primary: 'rgba(0, 0, 0, 0.1)',
      light: 'rgba(0, 0, 0, 0.05)',
    },
    accent: {
      blue: 'rgba(0, 122, 255, 0.8)',
      blueLight: 'rgba(0, 122, 255, 0.15)',
    }
  },

  // Common spacing and dimensions
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  // Border radius values
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },
};

export default LiquidGlassTheme;