import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// iOS-Inspired Color Palette
const iosColors = {
    // Primary - iOS Blue Gradient Style
    primary: '#007AFF',
    primaryLight: '#5AC8FA',
    primaryDark: '#0051D5',

    // Secondary - iOS Purple
    secondary: '#5856D6',
    secondaryLight: '#AF52DE',
    secondaryDark: '#3634A3',

    // Accent Colors (iOS System Colors)
    accent: '#30D158',      // iOS Green
    warning: '#FF9F0A',     // iOS Orange
    error: '#FF3B30',       // iOS Red
    pink: '#FF2D55',        // iOS Pink
    purple: '#BF5AF2',      // iOS Purple
    teal: '#64D2FF',        // iOS Teal
    indigo: '#5856D6',      // iOS Indigo

    // Dark Theme - True Black (OLED-friendly like iPhone)
    darkBackground: '#000000',
    darkSurface: '#1C1C1E',
    darkSurfaceVariant: '#2C2C2E',
    darkElevated: '#3A3A3C',

    // Glass Effects
    glassDark: 'rgba(28, 28, 30, 0.85)',
    glassLight: 'rgba(255, 255, 255, 0.1)',
    glassOverlay: 'rgba(255, 255, 255, 0.05)',

    // Light Theme
    lightBackground: '#F2F2F7',
    lightSurface: '#FFFFFF',
    lightSurfaceVariant: '#E5E5EA',
};

// iOS-Style Gradient Presets
export const gradients = {
    primary: ['#007AFF', '#5856D6'],
    secondary: ['#5856D6', '#AF52DE'],
    accent: ['#30D158', '#34C759'],
    sunset: ['#FF9F0A', '#FF3B30'],
    pink: ['#FF2D55', '#FF375F'],
    purple: ['#BF5AF2', '#5856D6'],
    teal: ['#64D2FF', '#5AC8FA'],
    dark: ['#1C1C1E', '#2C2C2E'],
    glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
};

// Dark theme configuration (iOS-inspired)
export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: iosColors.primary,
        primaryContainer: iosColors.primaryDark,
        secondary: iosColors.secondary,
        secondaryContainer: iosColors.secondaryDark,
        tertiary: iosColors.accent,
        background: iosColors.darkBackground,
        surface: iosColors.darkSurface,
        surfaceVariant: iosColors.darkSurfaceVariant,
        error: iosColors.error,
        onPrimary: '#ffffff',
        onSecondary: '#ffffff',
        onBackground: '#ffffff',
        onSurface: '#ffffff',
        onSurfaceVariant: '#8E8E93',
        outline: '#48484A',
        elevation: {
            level0: 'transparent',
            level1: iosColors.darkSurface,
            level2: iosColors.darkSurfaceVariant,
            level3: iosColors.darkElevated,
            level4: '#48484A',
            level5: '#636366',
        },
    },
    custom: {
        success: iosColors.accent,
        warning: iosColors.warning,
        pink: iosColors.pink,
        purple: iosColors.purple,
        teal: iosColors.teal,
        glass: iosColors.glassDark,
        glassLight: iosColors.glassLight,
        gradients: gradients,
    },
};

// Light theme configuration
export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: iosColors.primary,
        primaryContainer: iosColors.primaryLight,
        secondary: iosColors.secondary,
        secondaryContainer: iosColors.secondaryLight,
        tertiary: iosColors.accent,
        background: iosColors.lightBackground,
        surface: iosColors.lightSurface,
        surfaceVariant: iosColors.lightSurfaceVariant,
        error: iosColors.error,
        onPrimary: '#ffffff',
        onSecondary: '#ffffff',
        onBackground: '#1C1C1E',
        onSurface: '#1C1C1E',
        onSurfaceVariant: '#8E8E93',
        outline: '#C7C7CC',
        elevation: {
            level0: 'transparent',
            level1: iosColors.lightSurface,
            level2: iosColors.lightSurfaceVariant,
            level3: '#E5E5EA',
            level4: '#D1D1D6',
            level5: '#C7C7CC',
        },
    },
    custom: {
        success: iosColors.accent,
        warning: iosColors.warning,
        pink: iosColors.pink,
        purple: iosColors.purple,
        teal: iosColors.teal,
        glass: 'rgba(255,255,255,0.8)',
        glassLight: 'rgba(0,0,0,0.05)',
        gradients: gradients,
    },
};

// Export default theme
// Export default theme
export const theme = lightTheme;

// Spacing constants (iOS HIG inspired)
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 44,
};

// Border radius constants (iOS style - more rounded)
export const borderRadius = {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
};

// iOS-style Shadow presets
export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    glow: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
};

// Glass card style helper
export const glassStyle = {
    backgroundColor: iosColors.glassDark,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
};
