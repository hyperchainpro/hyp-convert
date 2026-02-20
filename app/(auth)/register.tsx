import React, { useState } from 'react';
import { Image } from 'react-native';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText } from 'react-native-paper';
import { Link, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { verificationStore } from '@/lib/verification';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [captchaError, setCaptchaError] = useState('');
    const [formError, setFormError] = useState('');

    // Check verification status on focus
    useFocusEffect(
        React.useCallback(() => {
            if (verificationStore.getVerified()) {
                setCaptchaVerified(true);
            }
        }, [])
    );

    const params = useLocalSearchParams<{ verified?: string }>();
    const { signUp, signOut, loading, error, clearError } = useAuth(); // Add signOut

    const validateForm = (): boolean => {
        if (!username.trim()) {
            setFormError('Username tidak boleh kosong');
            return false;
        }
        if (username.trim().length < 3) {
            setFormError('Username minimal 3 karakter');
            return false;
        }
        if (!email.trim()) {
            setFormError('Email tidak boleh kosong');
            return false;
        }

        // Validate email domain
        const emailLower = email.trim().toLowerCase();
        const allowedDomains = ['@gmail.com', '@hotmail.com', '@hypconvert.com'];
        const isValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));

        if (!isValidDomain) {
            setFormError('Hanya email @gmail.com, @hotmail.com, dan @hypconvert.com yang diperbolehkan');
            return false;
        }

        if (!password) {
            setFormError('Password tidak boleh kosong');
            return false;
        }
        if (password.length < 6) {
            setFormError('Password minimal 6 karakter');
            return false;
        }
        if (password !== confirmPassword) {
            setFormError('Password dan konfirmasi password tidak cocok');
            return false;
        }
        if (!verificationStore.getVerified()) {
            setFormError('Silakan selesaikan verifikasi keamanan');
            return false;
        }

        setFormError('');
        return true;
    };

    const handleRegister = async () => {
        console.log('[Register] Handle register triggered');
        if (!validateForm()) {
            console.log('[Register] Validation failed');
            return;
        }

        clearError();
        console.log('[Register] Calling useAuth.signUp...');
        const result = await signUp(
            email.trim().toLowerCase(),
            password,
            username.trim()
        );
        console.log('[Register] signUp result:', JSON.stringify(result));

        if (result.success) {
            console.log('[Register] Success.');
            verificationStore.reset();

            // Explicitly force sign out if session exists (to follow user request of "Go to Login Page")
            if (result.session) {
                console.log('[Register] Auto-login detected. Forcing signOut...');
                try {
                    await signOut();
                } catch (e) {
                    console.error('[Register] SignOut error:', e);
                }
            }

            // Redirect to Login with success message
            const emailParam = encodeURIComponent(email.trim());
            const targetUrl = `/(auth)/login?registered=true&email=${emailParam}`;

            console.log('[Register] Initiating redirect to:', targetUrl);

            // Use window.location directly for web to guarantee navigation
            if (Platform.OS === 'web') {
                // Clean up any potential modal/overlay states if accessible?
                // Just force the URL change.
                setTimeout(() => {
                    window.location.href = `/login?registered=true&email=${emailParam}`;
                }, 200); // 200ms delay
                return;
            }

            setTimeout(() => {
                if (router.canGoBack()) router.dismissAll();
                router.replace(targetUrl as any);
            }, 500);

        } else {
            console.log('[Register] Registration failed:', result.error);
            // Handle specific duplicate user error
            if (result.error?.includes('already registered') || result.error?.includes('duplicate key')) {
                setFormError('Email sudah terdaftar. Silakan login.');
            } else {
                setFormError(result.error || 'Terjadi kesalahan saat mendaftar');
            }
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Surface style={styles.card} elevation={3}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ position: 'absolute', left: 0, top: 0 }}>
                            <Button
                                icon="arrow-left"
                                mode="text"
                                compact
                                textColor="#6366f1"
                                onPress={() => router.replace('/(auth)/login')}
                            >
                                Kembali
                            </Button>
                        </View>
                        <Image source={require('@/assets/images/hyp-logo-auth.png')} style={{ width: 96, height: 96, marginTop: 24, marginBottom: 12 }} resizeMode="contain" />
                        <Text style={styles.appTitle}>HYP Convert</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Buat akun baru untuk mulai menggunakan HYP Convert
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <TextInput
                            mode="outlined"
                            label="Username"
                            value={username}
                            onChangeText={(text) => {
                                setUsername(text);
                                setFormError('');
                                clearError();
                            }}
                            autoCapitalize="none"
                            left={<TextInput.Icon icon="account" color="#8E8E93" />}
                            outlineColor="#E5E5EA"
                            activeOutlineColor="#007AFF"
                            style={styles.input}
                            textColor="#000000"
                            theme={{ colors: { onSurfaceVariant: '#8E8E93' } }}
                        />

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
                        <HelperText type="info" style={styles.helperText}>
                            <Text style={{ color: '#8E8E93' }}>Hanya @gmail.com atau @hotmail.com</Text>
                        </HelperText>

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

                        <TextInput
                            mode="outlined"
                            label="Konfirmasi Password"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setFormError('');
                                clearError();
                            }}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            left={<TextInput.Icon icon="lock-check" color="#8E8E93" />}
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
                                router.push({
                                    pathname: '/(auth)/verify' as any,
                                    params: { returnTo: '/(auth)/register', email }
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
                                <Text style={{ color: '#FF3B30', fontWeight: '600' }}>{formError || error || captchaError}</Text>
                            </HelperText>
                        ) : null}

                        {/* Register Button */}
                        <Button
                            mode="contained"
                            onPress={handleRegister}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                            buttonColor="#007AFF"
                            contentStyle={styles.buttonContent}
                        >
                            {loading ? <Text style={{ color: '#fff', fontWeight: '600' }}>Mendaftar...</Text> : <Text style={{ color: '#fff', fontWeight: '600' }}>Daftar</Text>}
                        </Button>

                        {/* Login Link */}
                        <View style={styles.loginLink}>
                            <Text style={styles.loginText}>Sudah punya akun?</Text>
                            <Link href="/(auth)/login" asChild>
                                <Button mode="text" textColor="#007AFF">
                                    Masuk
                                </Button>
                            </Link>
                        </View>
                    </View>
                </Surface>
            </ScrollView>
        </KeyboardAvoidingView>
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
        borderRadius: 20,
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
        color: '#8E8E93',
        marginTop: 8,
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
    },
    helperText: {
        color: '#8E8E93',
        marginTop: -8,
        marginBottom: 8,
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
    loginLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        flexWrap: 'wrap',
    },
    loginText: {
        color: '#8E8E93',
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
