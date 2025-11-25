import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Theme } from './colors';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Creates theme-aware styles similar to StyleSheet.create
 * but with access to theme colors and properties
 */
export const createThemedStyles = <T extends NamedStyles<T>>(
  stylesFn: (theme: Theme) => T
) => {
  return (theme: Theme): T => stylesFn(theme);
};

/**
 * Common themed component styles
 */
export const createCommonStyles = (theme: Theme) => ({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  } as ViewStyle,

  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.background.primary,
  } as ViewStyle,

  // Glass card styles
  glassCard: {
    backgroundColor: theme.colors.card.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.card.border,
    padding: theme.spacing.lg,
    ...theme.shadow.medium,
    shadowColor: theme.colors.card.shadow,
  } as ViewStyle,

  glassCardSmall: {
    backgroundColor: theme.colors.card.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.card.border,
    padding: theme.spacing.md,
    ...theme.shadow.small,
    shadowColor: theme.colors.card.shadow,
  } as ViewStyle,

  // Text styles
  titleText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  } as TextStyle,

  headingText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  } as TextStyle,

  bodyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  } as TextStyle,

  captionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.text.tertiary,
  } as TextStyle,

  // Button styles
  primaryButton: {
    backgroundColor: theme.colors.button.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...theme.shadow.small,
  } as ViewStyle,

  secondaryButton: {
    backgroundColor: theme.colors.button.secondary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: theme.colors.card.border,
  } as ViewStyle,

  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.button.text,
  } as TextStyle,

  // Input styles
  textInput: {
    backgroundColor: theme.colors.input.background,
    borderWidth: 1,
    borderColor: theme.colors.input.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fontSize.md,
    color: theme.colors.input.text,
  } as ViewStyle,

  // Status styles
  successText: {
    color: theme.colors.status.success,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  } as TextStyle,

  warningText: {
    color: theme.colors.status.warning,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  } as TextStyle,

  errorText: {
    color: theme.colors.status.error,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  } as TextStyle,

  // Separator
  separator: {
    height: 1,
    backgroundColor: theme.colors.card.border,
    marginVertical: theme.spacing.md,
  } as ViewStyle,

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.background.primary,
  } as ViewStyle,

  // AQI specific styles
  aqiCircle: {
    borderWidth: 3,
    borderColor: theme.colors.card.border,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...theme.shadow.large,
    shadowColor: theme.colors.card.shadow,
  } as ViewStyle,

  aqiText: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  } as TextStyle,

  aqiLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  } as TextStyle,
});

/**
 * Get AQI color based on value and theme
 */
export const getAQIColor = (aqi: number, theme: Theme): string => {
  if (aqi <= 50) return theme.colors.aqi.good;
  if (aqi <= 100) return theme.colors.aqi.moderate;
  if (aqi <= 150) return theme.colors.aqi.unhealthySensitive;
  if (aqi <= 200) return theme.colors.aqi.unhealthy;
  if (aqi <= 300) return theme.colors.aqi.veryUnhealthy;
  return theme.colors.aqi.hazardous;
};

/**
 * Get dynamic styles based on theme
 */
export const getDynamicStyles = (theme: Theme) => ({
  // Tab bar styles
  tabBarStyle: {
    backgroundColor: theme.colors.card.background,
    borderTopColor: theme.colors.card.border,
    borderTopWidth: 1,
    paddingBottom: theme.spacing.sm,
    height: 70,
  },

  tabBarLabelStyle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },

  tabBarActiveTintColor: theme.colors.text.accent,
  tabBarInactiveTintColor: theme.colors.text.tertiary,

  // Header styles
  headerStyle: {
    backgroundColor: theme.colors.background.primary,
    shadowColor: theme.colors.card.shadow,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.card.border,
  },

  headerTitleStyle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },

  headerTintColor: theme.colors.text.accent,

  // Status bar
  statusBarStyle: theme.isDark ? 'light-content' as const : 'dark-content' as const,
  statusBarBackgroundColor: theme.colors.background.primary,
});