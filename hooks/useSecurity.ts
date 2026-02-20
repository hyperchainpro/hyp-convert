import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const SECURITY_SETTINGS_KEY = 'security_settings';

interface SecuritySettings {
    isEnabled: boolean;
    useBiometrics: boolean;
    pin: string | null;
}

const DEFAULT_SETTINGS: SecuritySettings = {
    isEnabled: false,
    useBiometrics: false,
    pin: null,
};

export function useSecurity() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [supportedAuthTypes, setSupportedAuthTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);

    // Check hardware support
    useEffect(() => {
        (async () => {
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            setSupportedAuthTypes(types);

            const savedSettings = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
            setLoading(false);
        })();
    }, []);

    // Handle App Backgrounding
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (
                settings.isEnabled &&
                nextAppState === 'active'
            ) {
                // Determine if we need to show lock screen
                // For now, simple re-auth logic
                setIsAuthenticated(false);
                router.replace('/(auth)/lock');
            }
        });

        return () => {
            subscription.remove();
        };
    }, [settings.isEnabled]);

    const authenticate = useCallback(async (): Promise<boolean> => {
        if (!settings.isEnabled) {
            setIsAuthenticated(true);
            return true;
        }

        if (settings.useBiometrics) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Buka Kunci Aplikasi',
                fallbackLabel: 'Gunakan PIN',
            });

            if (result.success) {
                setIsAuthenticated(true);
                return true;
            }
        }

        return false;
    }, [settings]);

    const verifyPin = useCallback((inputPin: string) => {
        if (settings.pin === inputPin) {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    }, [settings.pin]);

    const updateSettings = useCallback(async (newSettings: Partial<SecuritySettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(updated));
    }, [settings]);

    return {
        isAuthenticated,
        settings,
        loading,
        supportedAuthTypes,
        authenticate,
        verifyPin,
        updateSettings,
    };
}
