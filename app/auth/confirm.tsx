import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, ActivityIndicator, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type ConfirmStatus = 'loading' | 'success' | 'error';

export default function AuthConfirmScreen() {
    const [status, setStatus] = useState<ConfirmStatus>('loading');
    const [message, setMessage] = useState('Memverifikasi email Anda...');

    useEffect(() => {
        if (Platform.OS !== 'web') {
            // Mobile: handled by deep link, redirect to login
            setStatus('success');
            setMessage('Email berhasil dikonfirmasi!');
            setTimeout(() => router.replace('/(auth)/login'), 2000);
            return;
        }

        const handleConfirm = async () => {
            try {
                // Parse hash fragment from URL (Supabase sends tokens in hash)
                const hash = window.location.hash;
                const params = new URLSearchParams(hash.replace('#', ''));

                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');
                const type = params.get('type'); // 'signup' or 'recovery'
                const errorCode = params.get('error_code');
                const errorDesc = params.get('error_description');

                // Handle error in URL
                if (errorCode || errorDesc) {
                    console.error('[AuthConfirm] Error in URL:', errorCode, errorDesc);
                    setStatus('error');
                    setMessage(
                        errorDesc?.includes('expired')
                            ? 'Link konfirmasi sudah kadaluarsa. Silakan daftar ulang.'
                            : `Verifikasi gagal: ${errorDesc || errorCode}`
                    );
                    return;
                }

                if (!accessToken || !refreshToken) {
                    // Try query params as fallback (some Supabase versions)
                    const searchParams = new URLSearchParams(window.location.search);
                    const tokenHash = searchParams.get('token_hash');
                    const confirmType = searchParams.get('type');

                    if (tokenHash && confirmType) {
                        // PKCE flow - verify OTP
                        const { error } = await supabase.auth.verifyOtp({
                            token_hash: tokenHash,
                            type: confirmType as any,
                        });

                        if (error) {
                            console.error('[AuthConfirm] OTP verify error:', error);
                            setStatus('error');
                            setMessage(
                                error.message?.includes('expired')
                                    ? 'Link konfirmasi sudah kadaluarsa. Silakan daftar ulang.'
                                    : 'Verifikasi gagal. Silakan coba lagi.'
                            );
                            return;
                        }

                        setStatus('success');
                        setMessage('Email berhasil dikonfirmasi! Mengalihkan ke halaman login...');
                        setTimeout(() => {
                            window.location.href = '/login?confirmed=true';
                        }, 2000);
                        return;
                    }

                    console.error('[AuthConfirm] No tokens or token_hash found in URL');
                    setStatus('error');
                    setMessage('Link konfirmasi tidak valid. Silakan coba lagi.');
                    return;
                }

                // Set session with tokens from URL
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    console.error('[AuthConfirm] setSession error:', error);
                    setStatus('error');
                    setMessage('Verifikasi gagal. Link mungkin sudah kadaluarsa.');
                    return;
                }

                // Sign out immediately after confirmation so user logs in fresh
                await supabase.auth.signOut();

                setStatus('success');
                setMessage('Email berhasil dikonfirmasi! Mengalihkan ke halaman login...');

                setTimeout(() => {
                    window.location.href = '/login?confirmed=true';
                }, 2000);

            } catch (err) {
                console.error('[AuthConfirm] Unexpected error:', err);
                setStatus('error');
                setMessage('Terjadi kesalahan. Silakan coba lagi.');
            }
        };

        handleConfirm();
    }, []);

    const handleRetry = () => {
        window.location.href = '/register';
    };

    return (
        <View style={styles.container}>
            <Surface style={styles.card} elevation={3}>
                <View style={styles.content}>
                    {status === 'loading' && (
                        <>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.title}>Memverifikasi Email</Text>
                            <Text style={styles.subtitle}>{message}</Text>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <MaterialCommunityIcons
                                name="check-circle"
                                size={64}
                                color="#30D158"
                            />
                            <Text style={[styles.title, { color: '#30D158' }]}>
                                Email Terkonfirmasi!
                            </Text>
                            <Text style={styles.subtitle}>{message}</Text>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <MaterialCommunityIcons
                                name="alert-circle"
                                size={64}
                                color="#FF3B30"
                            />
                            <Text style={[styles.title, { color: '#FF3B30' }]}>
                                Verifikasi Gagal
                            </Text>
                            <Text style={styles.subtitle}>{message}</Text>
                            <Text
                                style={styles.retryLink}
                                onPress={handleRetry}
                            >
                                Kembali ke halaman daftar
                            </Text>
                        </>
                    )}
                </View>
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        padding: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },
    content: {
        alignItems: 'center',
        gap: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        marginTop: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
    },
    retryLink: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: '600',
        marginTop: 8,
    },
});
