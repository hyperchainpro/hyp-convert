import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText } from 'react-native-paper';
import { Link, router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { verificationStore } from '@/lib/verification';
import { TouchableOpacity } from 'react-native';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [captchaError, setCaptchaError] = useState('');
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { directResetPassword, loading, error, clearError } = useAuth();

    // Check verification status on focus
    useFocusEffect(
        React.useCallback(() => {
            if (verificationStore.getVerified()) {
                setCaptchaVerified(true);
            }
        }, [])
    );

    const validateForm = (): boolean => {
        if (!email.trim()) {
            setFormError('Email tidak boleh kosong');
            return false;
        }
        if (!username.trim()) {
            setFormError('Username tidak boleh kosong');
            return false;
        }
        if (!newPassword) {
            setFormError('Password baru tidak boleh kosong');
            return false;
        }
        if (newPassword.length < 6) {
            setFormError('Password minimal 6 karakter');
            return false;
        }
        if (!verificationStore.getVerified()) {
            setFormError('Silakan selesaikan verifikasi keamanan');
            return false;
        }
        setFormError('');
        return true;
    };

    const handleResetRequest = async () => {
        if (!validateForm()) return;

        clearError();
        console.log('Requesting direct reset for:', email, username);

        const result = await directResetPassword(
            email.trim().toLowerCase(),
            username.trim(),
            newPassword
        );

        if (result.success) {
            verificationStore.reset();
            setSuccessMessage(`Password untuk akun ${username} berhasil diubah! Silakan login dengan password baru Anda.`);
            setCaptchaVerified(false);
            // Redirect after delay
            setTimeout(() => {
                router.replace('/(auth)/login');
            }, 4000);
        } else {
            setFormError(result.error || 'Gagal memproses permintaan');
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
                        <MaterialCommunityIcons name="lock-reset" size={48} color="#007AFF" />
                        <Text variant="headlineMedium" style={styles.title}>Lupa Password</Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Isi data akun Anda untuk membuat password baru
                        </Text>
                    </View>

                    {/* Success Message */}
                    {successMessage ? (
                        <View style={styles.successContainer}>
                            <Surface style={styles.successBox} elevation={1}>
                                <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                                <Text style={styles.successText}>{successMessage}</Text>
                            </Surface>
                            <Link href="/(auth)/login" asChild>
                                <Button mode="contained" style={styles.button} buttonColor="#007AFF">
                                    Kembali ke Login
                                </Button>
                            </Link>
                        </View>
                    ) : (
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
                                textColor="#000000"
                                theme={{ colors: { onSurfaceVariant: '#8E8E93' } }}
                                style={styles.input}
                            />

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
                                textColor="#000000"
                                theme={{ colors: { onSurfaceVariant: '#8E8E93' } }}
                                style={styles.input}
                            />

                            <TextInput
                                mode="outlined"
                                label="Password Baru"
                                value={newPassword}
                                onChangeText={(text) => {
                                    setNewPassword(text);
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
                                textColor="#000000"
                                theme={{ colors: { onSurfaceVariant: '#8E8E93' } }}
                                style={styles.input}
                            />

                            {/* Captcha */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (captchaVerified) return;
                                    router.push({
                                        pathname: '/(auth)/verify' as any,
                                        params: { returnTo: '/(auth)/forgot-password', email }
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

                            {(formError || error || captchaError) ? (
                                <HelperText type="error" visible={true} style={styles.errorText}>
                                    <Text style={{ color: '#FF3B30', fontWeight: '600' }}>
                                        {formError || error || captchaError}
                                    </Text>
                                </HelperText>
                            ) : null}

                            {/* Submit Button */}
                            <Button
                                mode="contained"
                                onPress={handleResetRequest}
                                loading={loading}
                                disabled={loading}
                                style={styles.button}
                                buttonColor="#007AFF"
                                contentStyle={styles.buttonContent}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>
                                    {loading ? 'Memproses...' : 'Reset Password'}
                                </Text>
                            </Button>

                            {/* Back to Login */}
                            <View style={styles.loginLink}>
                                <Link href="/(auth)/login" asChild>
                                    <Button mode="text" textColor="#007AFF" icon="arrow-left">
                                        Kembali ke Login
                                    </Button>
                                </Link>
                            </View>
                        </View>
                    )}
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
    successContainer: {
        width: '100%',
        alignItems: 'center',
    },
    successBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#D1FAE5', // Light Green
        marginBottom: 16,
        width: '100%',
    },
    successText: {
        color: '#047857', // Dark Green Text
        flex: 1,
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
    loginLink: {
        alignItems: 'center',
        marginTop: 16,
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
