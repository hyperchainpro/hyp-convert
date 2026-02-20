import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { Text, Surface, Switch, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { AppSettings, getAppSettings, updateAppSettings, getAllUsers } from '@/lib/admin';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [stats, setStats] = useState({ users: 0, tokens: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const config = await getAppSettings();
            setSettings(config);
            setMessage(config.maintenance_message);

            const users = await getAllUsers();
            const totalTokens = users.reduce((acc, u) => acc + (u.hyp_tokens || 0), 0);
            setStats({ users: users.length, tokens: totalTokens });
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleBulkToken = async (amount: number) => {
        Alert.alert(
            'Konfirmasi Bulk Action',
            `Apakah Anda yakin ingin memberikan ${amount} token ke SEMUA user?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Ya, Berikan',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.rpc('reward_all_users', { reward_amount: amount });
                            if (error) {
                                // Fallback if RPC not defined
                                const { data: users } = await supabase.from('profiles').select('id, hyp_tokens');
                                if (users) {
                                    for (const u of users) {
                                        await supabase.from('profiles').update({ hyp_tokens: (u.hyp_tokens || 0) + amount }).eq('id', u.id);
                                    }
                                }
                            }
                            Alert.alert('Sukses', `Bonus ${amount} token telah didistribusikan.`);
                            loadData();
                        } catch (e) {
                            Alert.alert('Error', 'Gagal memproses bulk action.');
                        }
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        if (!settings) return;
        try {
            await updateAppSettings({
                maintenance_mode: settings.maintenance_mode,
                maintenance_message: message
            });
            Alert.alert('Success', 'Settings updated');
        } catch (e) {
            Alert.alert('Error', 'Failed to update settings');
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Button
                    icon="arrow-left"
                    mode="text"
                    textColor="#fff"
                    onPress={() => router.replace('/(tabs)')}
                    compact
                >
                    Back
                </Button>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>Admin Dashboard</Text>
            </View>

            {/* Quick Navigation */}
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
                <TouchableOpacity
                    style={[styles.navCard, { borderLeftColor: '#007AFF' }]}
                    onPress={() => router.push('/admin/users' as any)}
                >
                    <MaterialCommunityIcons name="account-group" size={28} color="#007AFF" />
                    <Text style={styles.navText}>Manage Users</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navCard, { borderLeftColor: '#FBBC05' }]}
                    onPress={() => router.push('/admin/ads' as any)}
                >
                    <MaterialCommunityIcons name="bullhorn" size={28} color="#FBBC05" />
                    <Text style={styles.navText}>Manage Ads</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsRow}>
                <Surface style={styles.statCard}>
                    <MaterialCommunityIcons name="account-group" size={24} color="#007AFF" />
                    <Text style={styles.statValue}>{stats.users}</Text>
                    <Text style={styles.statLabel}>Total Users</Text>
                </Surface>
                <Surface style={styles.statCard}>
                    <Image
                        source={require('@/assets/images/hyp-logo-auth.png')}
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                    />
                    <Text style={styles.statValue}>{stats.tokens}</Text>
                    <Text style={styles.statLabel}>Total HYP</Text>
                </Surface>
            </View>

            {/* Maintenance Control */}
            <Surface style={styles.section}>
                <View style={styles.row}>
                    <Text style={styles.label}>Maintenance Mode</Text>
                    <Switch
                        value={settings?.maintenance_mode}
                        onValueChange={(v) => setSettings(prev => prev ? ({ ...prev, maintenance_mode: v }) : null)}
                    />
                </View>
                <TextInput
                    label="Maintenance Message"
                    value={message}
                    onChangeText={setMessage}
                    mode="outlined"
                    style={styles.input}
                    multiline
                />
                <Button mode="contained" onPress={handleSave} style={styles.btn}>
                    Update Maintenance Settings
                </Button>
            </Surface>

            {/* Bulk Actions */}
            <Surface style={styles.section}>
                <Text style={[styles.label, { marginBottom: 12, fontWeight: 'bold' }]}>Bulk Token Management</Text>
                <Text style={{ color: '#8E8E93', fontSize: 13, marginBottom: 12 }}>
                    Berikan bonus token ke SELURUH user yang terdaftar.
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[10, 50, 100].map(amt => (
                        <Button
                            key={amt}
                            mode="outlined"
                            onPress={() => handleBulkToken(amt)}
                            style={{ flex: 1 }}
                        >
                            +{amt}
                        </Button>
                    ))}
                </View>
            </Surface>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
    section: { padding: 16, borderRadius: 12, backgroundColor: '#1C1C1E', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    label: { color: '#fff', fontSize: 16 },
    input: { marginBottom: 16, backgroundColor: '#2C2C2E' },
    btn: { marginTop: 8 },
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    statCard: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#1C1C1E', alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginVertical: 8 },
    statLabel: { color: '#8E8E93', fontSize: 12 },
    navCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        borderLeftWidth: 4,
        gap: 8,
    },
    navText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
