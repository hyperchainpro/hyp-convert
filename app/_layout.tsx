import '@/lib/global'; // Polyfills for Web (Buffer, process)
import { useEffect, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { darkTheme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { useSecurity } from '@/hooks/useSecurity';
import { getAppSettings } from '@/lib/admin';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';
import { UniversalAd } from '@/components/ads/UniversalAd';

// ...

function RootLayoutNav() {
    const { isAuthenticated, loading, user } = useAuth();
    const security = useSecurity(); // Initialize security listener
    const segments = useSegments() as string[];

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const isLockScreen = segments.join('/').includes('lock');

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup && !isLockScreen && segments[1] !== 'register') {
            // Redirect to dashboard if authenticated (but not if on lock screen or register page)
            // We skip 'register' to allow the registration flow to handle its own redirect (e.g. to login)
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, loading, segments]);

    // Maintenance State
    const [maintenance, setMaintenance] = useState({ active: false, message: '' });

    // Check maintenance status
    useEffect(() => {
        const checkMaintenance = async () => {
            const settings = await getAppSettings();
            setMaintenance({
                active: settings.maintenance_mode,
                message: settings.maintenance_message
            });
        };
        // Check on mount and every minute
        checkMaintenance();
        const interval = setInterval(checkMaintenance, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!loading) {
            SplashScreen.hideAsync();
        }
    }, [loading]);

    // Block access if maintenance is active and user is NOT admin
    // Note: user?.role property added in useAuth
    const isAdmin = (isAuthenticated && user?.role === 'admin');

    if (maintenance.active && !isAdmin) {
        return (
            <SafeAreaProvider>
                <PaperProvider theme={darkTheme}>
                    <StatusBar style="light" />
                    <MaintenanceScreen message={maintenance.message} />
                </PaperProvider>
            </SafeAreaProvider>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F2F2F7' }, // iOS Light Background
            }}
        >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="index" options={{ animation: 'none' }} />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <PaperProvider theme={darkTheme}>
                <StatusBar style="light" />
                <RootLayoutNav />
                {/* Popup Ad */}
                <UniversalAd type="popup" />
            </PaperProvider>
        </SafeAreaProvider>
    );
}
