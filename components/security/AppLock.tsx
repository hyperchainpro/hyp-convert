/**
 * App Lock Component
 * PIN, Pattern, and Biometric authentication for app security
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Vibration,
    Platform,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =====================================================
// TYPES
// =====================================================

interface AppLockProps {
    mode: 'setup' | 'verify' | 'change';
    lockType?: 'pin' | 'pattern' | 'biometric';
    onSuccess: () => void;
    onCancel?: () => void;
    title?: string;
}

interface PINPadProps {
    value: string;
    onValueChange: (value: string) => void;
    onSubmit: () => void;
    maxLength?: number;
    error?: string;
}

// =====================================================
// STORAGE KEYS
// =====================================================

const STORAGE_KEYS = {
    LOCK_ENABLED: 'hyp_lock_enabled',
    LOCK_TYPE: 'hyp_lock_type',
    PIN_CODE: 'hyp_pin_code',
    PATTERN: 'hyp_pattern',
    BIOMETRIC_ENABLED: 'hyp_biometric',
    SECURE_FOLDER_PIN: 'hyp_secure_folder_pin',
};

// =====================================================
// PIN PAD COMPONENT
// =====================================================

const PINPad: React.FC<PINPadProps> = ({
    value,
    onValueChange,
    onSubmit,
    maxLength = 6,
    error,
}) => {
    const handlePress = (digit: string) => {
        if (value.length < maxLength) {
            const newValue = value + digit;
            onValueChange(newValue);

            if (Platform.OS !== 'web') {
                Vibration.vibrate(50);
            }

            if (newValue.length === maxLength) {
                setTimeout(onSubmit, 200);
            }
        }
    };

    const handleDelete = () => {
        onValueChange(value.slice(0, -1));
    };

    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

    return (
        <View style={pinStyles.container}>
            {/* PIN Dots */}
            <View style={pinStyles.dotsContainer}>
                {Array.from({ length: maxLength }).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            pinStyles.dot,
                            i < value.length && pinStyles.dotFilled,
                            error ? pinStyles.dotError : undefined,
                        ]}
                    />
                ))}
            </View>

            {error && <Text style={pinStyles.errorText}>{error}</Text>}

            {/* Number Pad */}
            <View style={pinStyles.pad}>
                {digits.map((digit, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => {
                            if (digit === 'del') handleDelete();
                            else if (digit) handlePress(digit);
                        }}
                        style={[
                            pinStyles.key,
                            !digit && pinStyles.keyEmpty,
                        ]}
                        disabled={!digit || (digit !== 'del' && value.length >= maxLength)}
                        activeOpacity={0.7}
                    >
                        {digit === 'del' ? (
                            <MaterialCommunityIcons name="backspace-outline" size={24} color="#fff" />
                        ) : (
                            <Text style={pinStyles.keyText}>{digit}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const pinStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#3A3A3C',
        borderWidth: 2,
        borderColor: '#48484A',
    },
    dotFilled: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    dotError: {
        backgroundColor: '#FF453A',
        borderColor: '#FF453A',
    },
    errorText: {
        color: '#FF453A',
        fontSize: 14,
        marginBottom: 16,
    },
    pad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: 280,
    },
    key: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 6,
        borderRadius: 40,
        backgroundColor: '#2C2C2E',
    },
    keyEmpty: {
        backgroundColor: 'transparent',
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: '#ffffff',
    },
});

// =====================================================
// MAIN APP LOCK COMPONENT
// =====================================================

export const AppLock: React.FC<AppLockProps> = ({
    mode,
    lockType = 'pin',
    onSuccess,
    onCancel,
    title,
}) => {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);

    const getStoredPIN = async (): Promise<string | null> => {
        return await AsyncStorage.getItem(STORAGE_KEYS.PIN_CODE);
    };

    const savePIN = async (pinCode: string): Promise<void> => {
        await AsyncStorage.setItem(STORAGE_KEYS.PIN_CODE, pinCode);
        await AsyncStorage.setItem(STORAGE_KEYS.LOCK_ENABLED, 'true');
        await AsyncStorage.setItem(STORAGE_KEYS.LOCK_TYPE, 'pin');
    };

    const handleSubmit = async () => {
        setError(null);

        if (mode === 'setup' || mode === 'change') {
            if (step === 'enter') {
                if (pin.length < 4) {
                    setError('PIN minimal 4 digit');
                    return;
                }
                setConfirmPin(pin);
                setPin('');
                setStep('confirm');
            } else {
                if (pin !== confirmPin) {
                    setError('PIN tidak cocok');
                    setPin('');
                    return;
                }
                await savePIN(pin);
                onSuccess();
            }
        } else if (mode === 'verify') {
            const storedPIN = await getStoredPIN();
            if (pin === storedPIN) {
                onSuccess();
            } else {
                setAttempts(prev => prev + 1);
                setError(`PIN salah (${attempts + 1}/5)`);
                setPin('');

                if (Platform.OS !== 'web') {
                    Vibration.vibrate([0, 100, 50, 100]);
                }

                if (attempts >= 4) {
                    // Lock out after 5 attempts
                    setError('Terlalu banyak percobaan. Coba lagi nanti.');
                }
            }
        }
    };

    const getTitle = (): string => {
        if (title) return title;

        if (mode === 'setup') {
            return step === 'enter' ? 'Buat PIN Baru' : 'Konfirmasi PIN';
        }
        if (mode === 'change') {
            return step === 'enter' ? 'Buat PIN Baru' : 'Konfirmasi PIN Baru';
        }
        return 'Masukkan PIN';
    };

    const getSubtitle = (): string => {
        if (mode === 'setup' || mode === 'change') {
            return step === 'enter'
                ? 'Masukkan PIN 4-6 digit untuk mengamankan aplikasi'
                : 'Masukkan kembali PIN Anda';
        }
        return 'Masukkan PIN untuk melanjutkan';
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1C1C1E', '#000000']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    {onCancel && (
                        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                            <MaterialCommunityIcons name="close" size={24} color="#FF453A" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Icon */}
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={['#007AFF', '#5856D6']}
                        style={styles.iconGradient}
                    >
                        <MaterialCommunityIcons name="lock" size={40} color="#fff" />
                    </LinearGradient>
                </View>

                {/* Title */}
                <Text style={styles.title}>{getTitle()}</Text>
                <Text style={styles.subtitle}>{getSubtitle()}</Text>

                {/* PIN Pad */}
                <PINPad
                    value={pin}
                    onValueChange={setPin}
                    onSubmit={handleSubmit}
                    maxLength={6}
                    error={error || undefined}
                />

                {/* Biometric Option */}
                {mode === 'verify' && Platform.OS !== 'web' && (
                    <TouchableOpacity style={styles.biometricBtn}>
                        <MaterialCommunityIcons name="fingerprint" size={32} color="#007AFF" />
                        <Text style={styles.biometricText}>Gunakan Biometrik</Text>
                    </TouchableOpacity>
                )}

                {/* Step Indicator */}
                {(mode === 'setup' || mode === 'change') && (
                    <View style={styles.stepIndicator}>
                        <View style={[styles.stepDot, step === 'enter' && styles.stepDotActive]} />
                        <View style={[styles.stepDot, step === 'confirm' && styles.stepDotActive]} />
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function isLockEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(STORAGE_KEYS.LOCK_ENABLED);
    return enabled === 'true';
}

export async function getLockType(): Promise<'pin' | 'pattern' | 'biometric' | null> {
    const type = await AsyncStorage.getItem(STORAGE_KEYS.LOCK_TYPE);
    return type as 'pin' | 'pattern' | 'biometric' | null;
}

export async function disableLock(): Promise<void> {
    await AsyncStorage.multiRemove([
        STORAGE_KEYS.LOCK_ENABLED,
        STORAGE_KEYS.LOCK_TYPE,
        STORAGE_KEYS.PIN_CODE,
        STORAGE_KEYS.PATTERN,
    ]);
}

export async function isSecureFolderEnabled(): Promise<boolean> {
    const pin = await AsyncStorage.getItem(STORAGE_KEYS.SECURE_FOLDER_PIN);
    return !!pin;
}

export async function setSecureFolderPIN(pin: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SECURE_FOLDER_PIN, pin);
}

export async function verifySecureFolderPIN(pin: string): Promise<boolean> {
    const storedPIN = await AsyncStorage.getItem(STORAGE_KEYS.SECURE_FOLDER_PIN);
    return pin === storedPIN;
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    gradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    header: {
        position: 'absolute',
        top: 40,
        left: 16,
        right: 16,
        flexDirection: 'row',
    },
    cancelBtn: {
        padding: 8,
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 32,
        maxWidth: 280,
    },
    biometricBtn: {
        alignItems: 'center',
        marginTop: 24,
        gap: 8,
    },
    biometricText: {
        fontSize: 14,
        color: '#007AFF',
    },
    stepIndicator: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 32,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3A3A3C',
    },
    stepDotActive: {
        backgroundColor: '#007AFF',
    },
});

export default AppLock;
