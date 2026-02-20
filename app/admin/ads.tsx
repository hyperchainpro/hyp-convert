import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Surface, TextInput, Button, ActivityIndicator, Switch, Divider } from 'react-native-paper';
import { AdConfig, getAdConfigs, updateAdConfig, createAdConfig } from '@/lib/admin';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdsManager() {
    const [ads, setAds] = useState<AdConfig[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getAdConfigs();

        // Ensure we have entries for all types (mock logic if db empty)
        const types: ('native' | 'interstitial' | 'popup')[] = ['native', 'interstitial', 'popup'];
        const fullData = [...data];

        for (const type of types) {
            if (!fullData.find(a => a.ad_type === type)) {
                fullData.push({ id: `temp_${type}`, ad_type: type, script_content: '<!-- Insert Script Here -->', is_active: false });
            }
        }

        setAds(fullData);
        setLoading(false);
    };

    const handleSave = async (ad: AdConfig) => {
        try {
            if (ad.id.startsWith('temp_')) {
                const { id, ...newAd } = ad;
                await createAdConfig(newAd);
            } else {
                await updateAdConfig(ad.id, {
                    script_content: ad.script_content,
                    android_ad_unit_id: ad.android_ad_unit_id,
                    is_active: ad.is_active
                });
            }
            Alert.alert('Success', `Saved ${ad.ad_type} config`);
            loadData();
        } catch (e) {
            Alert.alert('Error', 'Failed to save');
        }
    };

    const updateLocal = (index: number, field: string, value: any) => {
        const newAds = [...ads];
        newAds[index] = { ...newAds[index], [field]: value };
        setAds(newAds);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

    const renderAdMobGuide = () => (
        <Surface style={styles.guideCard}>
            <View style={styles.guideHeader}>
                <MaterialCommunityIcons name="google-ads" size={24} color="#FBBC05" />
                <Text style={styles.guideTitle}>Google AdMob Setup</Text>
            </View>
            <Text style={styles.guideText}>
                Untuk memasang iklan AdMob (Web), masukkan script unit iklan Anda di bawah ini. Pastikan script menyertakan tag <Text style={styles.codeText}>&lt;script async src="..."&gt;</Text> dari Google AdSense/AdMob.
            </Text>
        </Surface>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Button
                    icon="arrow-left"
                    mode="text"
                    textColor="#fff"
                    onPress={() => router.back()}
                    compact
                >
                    Back
                </Button>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>Ad Scripts Manager</Text>
            </View>

            {ads.map((ad, index) => (
                <Surface key={ad.id || ad.ad_type} style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons
                                name={ad.ad_type === 'native' ? 'card-text-outline' : ad.ad_type === 'interstitial' ? 'fullscreen' : 'message-alert'}
                                size={20}
                                color="#007AFF"
                            />
                            <Text style={styles.typeLabel}>{ad.ad_type.toUpperCase()} AD</Text>
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={{ color: '#888', marginRight: 8, fontSize: 12 }}>{ad.is_active ? 'ENABLED' : 'DISABLED'}</Text>
                            <Switch
                                value={ad.is_active}
                                onValueChange={(v) => updateLocal(index, 'is_active', v)}
                                color="#30D158"
                            />
                        </View>
                    </View>
                    <Divider style={styles.divider} />

                    {/* Native App Config */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={[styles.helperText, { color: '#30D158', fontWeight: 'bold' }]}>Android AdMob Unit ID:</Text>
                        <TextInput
                            mode="outlined"
                            value={ad.android_ad_unit_id || ''}
                            onChangeText={(v) => updateLocal(index, 'android_ad_unit_id', v)}
                            style={styles.input}
                            textColor="#fff"
                            placeholder="ca-app-pub-xxxxxxxx/xxxxxxxx"
                            placeholderTextColor="#444"
                            theme={{ colors: { background: '#2C2C2E' } }}
                        />
                    </View>

                    {/* Web Config */}
                    <View style={{ marginBottom: 12 }}>
                        <Text style={styles.helperText}>Web Script (HTML/AdSense):</Text>
                        <TextInput
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            value={ad.script_content}
                            onChangeText={(v) => updateLocal(index, 'script_content', v)}
                            style={styles.input}
                            textColor="#fff"
                            placeholder="<!-- Paste your AdMob/AdSense code here -->"
                            placeholderTextColor="#444"
                            theme={{ colors: { background: '#2C2C2E' } }}
                        />
                    </View>

                    <Button
                        mode="contained"
                        onPress={() => handleSave(ad)}
                        buttonColor="#007AFF"
                        style={{ borderRadius: 8 }}
                        contentStyle={{ height: 44 }}
                    >
                        Save {ad.ad_type.charAt(0).toUpperCase() + ad.ad_type.slice(1)} Config
                    </Button>
                </Surface>
            ))}

            {renderAdMobGuide()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
    card: { padding: 16, borderRadius: 12, backgroundColor: '#1C1C1E', marginBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    typeLabel: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
    switchRow: { flexDirection: 'row', alignItems: 'center' },
    divider: { backgroundColor: '#333', marginBottom: 12 },
    helperText: { color: '#8E8E93', marginBottom: 8 },
    input: { marginBottom: 16, backgroundColor: '#2C2C2E', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13 },
    guideCard: { padding: 16, borderRadius: 12, backgroundColor: '#1C1C1E', borderLeftWidth: 4, borderLeftColor: '#FBBC05' },
    guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    guideTitle: { color: '#FBBC05', fontWeight: 'bold', fontSize: 16 },
    guideText: { color: '#8E8E93', fontSize: 13, lineHeight: 18 },
    codeText: { fontFamily: 'monospace', color: '#fff', backgroundColor: '#333', paddingHorizontal: 4 },
});
