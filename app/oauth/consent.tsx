import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ConsentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(false);

    // Mock data if params are missing (for preview)
    const appName = params.client_name || 'External App';
    const scopes = (params.scope as string)?.split(' ') || ['read_profile', 'offline_access'];

    const handleAllow = async () => {
        setLoading(true);
        try {
            // In a real implementation, you would call the Supabase API to approve the consent
            // and then redirect back to the client's callback URL.
            // For now, we'll simulate a success and go back to dashboard or show success.
            console.log('Consent Allowed for:', params.client_id);

            // Simulation delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Since we don't have the full backend logic for the "Supabase OAuth Server" flow 
            // set up in this client-side code, we basically show this visual confirmation.
            // Typically you'd do: router.replace(params.redirect_uri + '?code=...');

            alert('Access Granted! (Simulation)');
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeny = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f0f23', '#1a1a2e']}
                style={styles.background}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <Surface style={styles.card} elevation={4}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="shield-account" size={48} color="#6366f1" />
                        </View>
                        <Text variant="headlineSmall" style={styles.title}>
                            Otorisasi Akses
                        </Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            <Text style={styles.appName}>{appName}</Text> meminta akses ke akun HYP Convert Anda.
                        </Text>
                    </View>

                    <Divider style={styles.divider} />

                    {/* Permissions List */}
                    <View style={styles.permissionsSection}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Aplikasi ini akan dapat:
                        </Text>

                        {scopes.map((scope, index) => (
                            <View key={index} style={styles.permissionItem}>
                                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#22c55e" />
                                <Text style={styles.permissionText}>
                                    {formatScope(scope)}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* User Info Preview */}
                    <Surface style={styles.userPreview}>
                        <MaterialCommunityIcons name="account-circle" size={32} color="#94a3b8" />
                        <View style={styles.userInfo}>
                            <Text style={styles.userLabel}>Masuk sebagai</Text>
                            <Text style={styles.userEmail}>user@example.com</Text>
                        </View>
                    </Surface>

                    <View style={styles.warningBox}>
                        <MaterialCommunityIcons name="information-outline" size={16} color="#eab308" />
                        <Text style={styles.warningText}>
                            Pastikan Anda mempercayai aplikasi ini sebelum memberikan akses.
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            onPress={handleDeny}
                            style={styles.denyButton}
                            textColor="#94a3b8"
                            disabled={loading}
                        >
                            Tolak
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleAllow}
                            style={styles.allowButton}
                            buttonColor="#6366f1"
                            loading={loading}
                            disabled={loading}
                        >
                            Izinkan
                        </Button>
                    </View>
                </Surface>
            </ScrollView>
        </View>
    );
}

function formatScope(scope: string): string {
    switch (scope) {
        case 'read_profile': return 'Melihat data profil dan email Anda';
        case 'offline_access': return 'Mengakses akun Anda saat offline';
        case 'write_documents': return 'Membuat dan mengedit dokumen';
        default: return scope.replace(/_/g, ' ');
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f23',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        backgroundColor: '#1e1e2d',
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    appName: {
        fontWeight: 'bold',
        color: '#fff',
    },
    divider: {
        backgroundColor: '#2d2d44',
        marginVertical: 16,
    },
    permissionsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#e2e8f0',
        marginBottom: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 12,
    },
    permissionText: {
        color: '#cbd5e1',
        flex: 1,
        fontSize: 14,
    },
    userPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#2d2d44',
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    userInfo: {
        flex: 1,
    },
    userLabel: {
        color: '#64748b',
        fontSize: 12,
    },
    userEmail: {
        color: '#e2e8f0',
        fontWeight: '500',
    },
    warningBox: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderRadius: 8,
        marginBottom: 24,
        gap: 8,
    },
    warningText: {
        color: '#eab308',
        fontSize: 12,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    denyButton: {
        flex: 1,
        borderColor: '#475569',
    },
    allowButton: {
        flex: 1,
    },
});
