import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText, Snackbar } from 'react-native-paper';
import { Link, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { verificationStore } from '@/lib/verification';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [captchaError, setCaptchaError] = useState('');
    const [formError, setFormError] = useState('');

    const { signIn, loading, error, clearError } = useAuth();
    const params = useLocalSearchParams<{ registered?: string; email?: string; verified?: string }>();
    const [showSuccessMessage, setShowSuccessMessage] = useState(!!params.registered);

    // Check verification status on focus
    useFocusEffect(
        React.useCallback(() => {
            if (verificationStore.getVerified()) {
                setCaptchaVerified(true);
            }
        }, [])
    );

    // Optional: Auto-fill email if passed from register
    useEffect(() => {
        if (params.email) {
            setEmail(params.email as string);
        }
    }, [params.email]);

    const validateForm = (): boolean => {
        if (!email.trim()) {
            setFormError('Email tidak boleh kosong');
            return false;
        }
        if (!password) {
            setFormError('Password tidak boleh kosong');
            return false;
        }
        // Check verification global state (mocked) or param
        // Check verification global state
        if (!verificationStore.getVerified()) {
            setFormError('Silakan verifikasi keamanan terlebih dahulu');
            return false;
        }
        setFormError('');
        return true;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        clearError();
        console.log('Attempting login for:', email);
        const result = await signIn(email.trim().toLowerCase(), password);

        if (result.success) {
            console.log('Login successful, redirecting...');
            verificationStore.reset();
            router.replace('/(tabs)');
        } else {
            console.error('Login failed:', result.error);
            // Error is already set in useAuth state, but we can intercept specific messages here if needed for UI
            if (result.error?.includes('Email not confirmed')) {
                // The useAuth hook sets the state, but we can show a specific snackbar or action later if needed
                // For now, reliance on useAuth's error state which is displayed in HelperText is fine, 
                // but we'll ensure the message is user-friendly in the UI rendering.
            }
        }
    };

    const isWeb = Platform.OS === 'web';

    return (
        <>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                enabled={!isWeb}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Surface style={styles.card} elevation={3}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Image source={require('@/assets/images/hyp-logo-auth.png')} style={{ width: 96, height: 96, marginBottom: 12 }} resizeMode="contain" />
                            <Text style={styles.appTitle}>HYP Convert</Text>
                            <Text variant="bodyMedium" style={styles.subtitle}>
                                Masuk ke akun Anda
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            <TextInput
                                mode="outlined"
                                label="Email"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setFormError('');
                                    clearError();
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                left={<TextInput.Icon icon="email" color="#8E8E93" />}
                                outlineColor="#E5E5EA"
                                activeOutlineColor="#007AFF"
                                style={styles.input}
                                textColor="#000000"
                                theme={{ colors: { onSurfaceVariant: '#8E8E93' } }}
                            />

                            <TextInput
                                mode="outlined"
                                label="Password"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setFormError('');
                                    clearError();
                                }}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                left={<TextInput.Icon icon="lock" color="#8E8E93" />}
                                right={
                                    <TextInput.Icon
                                        icon={showPassword ? 'eye-off' : 'eye'}
                                        onPress={() => setShowPassword(!showPassword)}
                                        color="#8E8E93"
                                    />
                                }
                                outlineColor="#E5E5EA"
                                activeOutlineColor="#007AFF"
                                style={styles.input}
                                textColor="#000000"
                                theme={{ colors: { onSurfaceVariant: '#8E8E93' } }}
                            />

                            {/* Captcha Replacement */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (captchaVerified) return;
                                    // Pass current email to preserve it? No, just nav.
                                    // We need to return to THIS screen with verified=true
                                    router.push({
                                        pathname: '/(auth)/verify' as any,
                                        params: { returnTo: '/(auth)/login', email }
                                    });
                                }}
                                style={[
                                    styles.captchaBtn,
                                    captchaVerified && styles.captchaBtnVerified
                                ]}
                                disabled={captchaVerified}
                            >
                                <MaterialCommunityIcons
                                    name={captchaVerified ? "shield-check" : "shield-alert"}
                                    size={24}
                                    color={captchaVerified ? "#30D158" : "#8E8E93"}
                                />
                                <Text style={[
                                    styles.captchaText,
                                    captchaVerified && styles.captchaTextVerified
                                ]}>
                                    {captchaVerified ? "Keamanan Terverifikasi" : "Klik untuk Verifikasi Keamanan"}
                                </Text>
                                {captchaVerified && (
                                    <MaterialCommunityIcons name="check" size={20} color="#30D158" />
                                )}
                            </TouchableOpacity>

                            {/* Error Messages */}
                            {(formError || error || captchaError) ? (
                                <HelperText type="error" visible={true} style={styles.errorText}>
                                    <Text style={{ color: '#FF3B30', fontWeight: '600' }}>
                                        {formError || captchaError || (
                                            error?.includes('Invalid login credentials')
                                                ? 'Email atau password salah. Jika belum punya akun, silakan daftar.'
                                                : error
                                        )}
                                    </Text>
                                </HelperText>
                            ) : null}

                            {/* Login Button */}
                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={loading}
                                disabled={loading}
                                style={styles.button}
                                buttonColor="#007AFF"
                                contentStyle={styles.buttonContent}
                            >
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{loading ? 'Memuat...' : 'Masuk'}</Text>
                            </Button>

                            {/* Links */}
                            <View style={styles.links}>
                                <Link href="/(auth)/forgot-password" asChild>
                                    <Button mode="text" textColor="#007AFF">
                                        Lupa Password?
                                    </Button>
                                </Link>
                            </View>

                            <View style={styles.registerLink}>
                                <Text style={styles.registerText}>Belum punya akun?</Text>
                                <Link href="/(auth)/register" asChild>
                                    <Button mode="text" textColor="#007AFF">
                                        Daftar Sekarang
                                    </Button>
                                </Link>
                            </View>
                        </View>
                    </Surface>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Message Snackbar */}
            <Snackbar
                visible={showSuccessMessage}
                onDismiss={() => setShowSuccessMessage(false)}
                duration={5000}
                style={styles.snackbar}
                action={{
                    label: 'OK',
                    onPress: () => setShowSuccessMessage(false),
                }}
            >
                <Text style={{ color: '#fff' }}>Pendaftaran berhasil! Silakan login dengan akun Anda.</Text>
            </Snackbar>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7', // iOS System Gray 6
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        padding: 24,
        borderRadius: 20, // More rounded for iOS
        backgroundColor: '#FFFFFF',
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        elevation: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    appTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: 0.4,
        marginBottom: 8,
    },
    title: {
        color: '#000000',
        fontWeight: '700',
        marginTop: 16,
    },
    subtitle: {
        color: '#8E8E93', // iOS System Gray
        marginTop: 8,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
    },
    errorText: {
        fontSize: 13,
    },
    button: {
        marginTop: 8,
        borderRadius: 12,
        paddingVertical: 4,
    },
    buttonContent: {
        height: 48,
    },
    links: {
        alignItems: 'center',
        marginTop: 12,
    },
    registerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        flexWrap: 'wrap',
    },
    registerText: {
        color: '#8E8E93',
    },
    snackbar: {
        backgroundColor: '#34C759', // iOS Success Green
        borderRadius: 12,
        marginBottom: 20,
    },
    captchaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        gap: 12,
    },
    captchaBtnVerified: {
        backgroundColor: 'rgba(48,209,88,0.1)',
        borderColor: '#30D158',
    },
    captchaText: {
        flex: 1,
        color: '#8E8E93',
        fontSize: 15,
        fontWeight: '500',
    },
    captchaTextVerified: {
        color: '#30D158',
    },
});
