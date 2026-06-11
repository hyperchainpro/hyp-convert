import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Animated } from 'react-native';
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
    const params = useLocalSearchParams<{ registered?: string; email?: string; verified?: string; confirmed?: string }>();
    const [showSuccessMessage, setShowSuccessMessage] = useState(!!params.registered);
    const [showConfirmedMessage, setShowConfirmedMessage] = useState(!!params.confirmed);

    // Animation refs
    const logoAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(0)).current;
    const inputAnimations = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;
    const linkAnimations = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

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

    // Start animations on mount
    useEffect(() => {
        // Logo bounce animation
        Animated.sequence([
            Animated.delay(100),
            Animated.spring(logoAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Card fade and slide up
        Animated.sequence([
            Animated.delay(200),
            Animated.timing(cardAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Staggered input animations
        const inputAnims = inputAnimations.map((anim, idx) =>
            Animated.sequence([
                Animated.delay(400 + idx * 100),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ])
        );

        // Button animation
        const buttonAnim2 = Animated.sequence([
            Animated.delay(700),
            Animated.timing(buttonAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]);

        // Links animation
        const linksAnims = linkAnimations.map((anim, idx) =>
            Animated.sequence([
                Animated.delay(900 + idx * 100),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ])
        );

        Animated.parallel([
            ...inputAnims,
            buttonAnim2,
            ...linksAnims,
        ]).start();
    }, []);

    const validateForm = (): boolean => {
        if (!email.trim()) {
            setFormError('Email tidak boleh kosong');
            return false;
        }
        if (!password) {
            setFormError('Password tidak boleh kosong');
            return false;
        }
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
                    {/* Logo with animation */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: logoAnim,
                                transform: [
                                    {
                                        scale: logoAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Image source={require('@/assets/images/hyp-logo-auth.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
                    </Animated.View>

                    {/* Card with fade and slide animation */}
                    <Animated.View
                        style={[
                            {
                                opacity: cardAnim,
                                transform: [
                                    {
                                        translateY: cardAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [30, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Surface style={styles.card} elevation={3}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.appTitle}>HYP Convert</Text>
                                <Text variant="bodyMedium" style={styles.subtitle}>
                                    Masuk ke akun Anda
                                </Text>
                            </View>

                            {/* Form */}
                            <View style={styles.form}>
                                {/* Email Input with animation */}
                                <Animated.View
                                    style={[
                                        {
                                            opacity: inputAnimations[0],
                                            transform: [
                                                {
                                                    translateX: inputAnimations[0].interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [-20, 0],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
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
                                </Animated.View>

                                {/* Password Input with animation */}
                                <Animated.View
                                    style={[
                                        {
                                            opacity: inputAnimations[1],
                                            transform: [
                                                {
                                                    translateX: inputAnimations[1].interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [-20, 0],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
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
                                </Animated.View>

                                {/* Captcha with animation */}
                                <Animated.View
                                    style={[
                                        {
                                            opacity: inputAnimations[2],
                                            transform: [
                                                {
                                                    translateX: inputAnimations[2].interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [-20, 0],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (captchaVerified) return;
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
                                </Animated.View>

                                {/* Error Messages */}
                                {(formError || error || captchaError) ? (
                                    <>
                                        <HelperText type="error" visible={true} style={styles.errorText}>
                                            <Text style={{ color: '#FF3B30', fontWeight: '600' }}>
                                                {formError || captchaError || (
                                                    error === 'EMAIL_NOT_CONFIRMED'
                                                        ? 'Email belum dikonfirmasi. Silakan cek inbox email Anda dan klik link konfirmasi.'
                                                        : error === 'INVALID_CREDENTIALS'
                                                            ? 'Email atau password salah. Jika belum punya akun, silakan daftar.'
                                                            : error
                                                )}
                                            </Text>
                                        </HelperText>
                                        {error === 'EMAIL_NOT_CONFIRMED' && (
                                            <View style={styles.confirmHint}>
                                                <MaterialCommunityIcons name="email-outline" size={16} color="#FF9500" />
                                                <Text style={styles.confirmHintText}>
                                                    Tidak menemukan email? Cek folder Spam/Junk.
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                ) : null}

                                {/* Login Button with animation */}
                                <Animated.View
                                    style={[
                                        {
                                            opacity: buttonAnim,
                                            transform: [
                                                {
                                                    scale: buttonAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0.9, 1],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
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
                                </Animated.View>

                                {/* Links with fade in animation */}
                                <Animated.View
                                    style={[
                                        styles.links,
                                        {
                                            opacity: linkAnimations[0],
                                        },
                                    ]}
                                >
                                    <Link href="/(auth)/forgot-password" asChild>
                                        <Button mode="text" textColor="#007AFF">
                                            Lupa Password?
                                        </Button>
                                    </Link>
                                </Animated.View>

                                <Animated.View
                                    style={[
                                        styles.registerLink,
                                        {
                                            opacity: linkAnimations[1],
                                        },
                                    ]}
                                >
                                    <Text style={styles.registerText}>Belum punya akun?</Text>
                                    <Link href="/(auth)/register" asChild>
                                        <Button mode="text" textColor="#007AFF">
                                            Daftar Sekarang
                                        </Button>
                                    </Link>
                                </Animated.View>
                            </View>
                        </Surface>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Registration Success Snackbar */}
            <Snackbar
                visible={showSuccessMessage}
                onDismiss={() => setShowSuccessMessage(false)}
                duration={6000}
                style={styles.snackbar}
                action={{
                    label: 'OK',
                    onPress: () => setShowSuccessMessage(false),
                }}
            >
                <Text style={{ color: '#fff' }}>✅ Pendaftaran berhasil! Silakan login dengan akun Anda.</Text>
            </Snackbar>

            {/* Email Confirmed Snackbar */}
            <Snackbar
                visible={showConfirmedMessage}
                onDismiss={() => setShowConfirmedMessage(false)}
                duration={5000}
                style={[styles.snackbar, { backgroundColor: '#007AFF' }]}
                action={{
                    label: 'OK',
                    onPress: () => setShowConfirmedMessage(false),
                }}
            >
                <Text style={{ color: '#fff' }}>✅ Email berhasil dikonfirmasi! Silakan login.</Text>
            </Snackbar>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
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
    subtitle: {
        color: '#8E8E93',
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
        backgroundColor: '#34C759',
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
    confirmHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,149,0,0.1)',
        borderRadius: 8,
        padding: 10,
        marginTop: -8,
    },
    confirmHintText: {
        color: '#FF9500',
        fontSize: 13,
        flex: 1,
    },
});
