import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSecurity } from '@/hooks/useSecurity';
import { PinPad } from '@/components/security/PinPad';
import { router, Stack } from 'expo-router';

export default function LockScreen() {
    const { authenticate, verifyPin } = useSecurity();
    const [error, setError] = useState('');

    useEffect(() => {
        // Auto-trigger biometric on load
        authenticate().then(success => {
            if (success) {
                router.replace('/(tabs)');
            }
        });
    }, []);

    const handlePin = (pin: string) => {
        if (verifyPin(pin)) {
            router.replace('/(tabs)');
        } else {
            setError('PIN Salah');
            setTimeout(() => setError(''), 2000);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
            <LinearGradient
                colors={['#000000', '#1C1C1E']}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="shield-lock" size={48} color="#007AFF" />
                            </View>
                            <Text style={styles.title}>HYP Convert Terkunci</Text>
                            <Text style={styles.subtitle}>Masukkan PIN untuk membuka</Text>
                        </View>

                        <View style={styles.pinContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <PinPad onPinEntered={handlePin} />
                        </View>

                        <View style={styles.footer}>
                            <Text onPress={() => authenticate()} style={styles.bioLink}>
                                Gunakan Biometrik
                            </Text>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,122,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
    },
    pinContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorText: {
        color: '#FF3B30',
        height: 20,
        marginBottom: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
    footer: {
        marginTop: 20,
        paddingBottom: 20,
    },
    bioLink: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    }
});
