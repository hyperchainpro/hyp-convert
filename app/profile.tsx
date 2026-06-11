import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Share, Platform, Image } from 'react-native';
import { Text, Avatar, Button, ActivityIndicator, Surface, Divider } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, getTokenBalance, getReferralCode, getReferralStats, getTokenHistory } from '@/lib/supabase';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [profile, setProfile] = useState<any>(null);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [referralStats, setReferralStats] = useState({ totalReferrals: 0, totalBonus: 0, referrals: [] as any[] });
    const [tokenHistory, setTokenHistory] = useState<any[]>([]);
    const [secondaryDataLoading, setSecondaryDataLoading] = useState(true);

    // Load critical data first (fast)
    const loadCriticalData = async () => {
        if (!user?.id) return;
        try {
            const [profileData, balance] = await Promise.all([
                getProfile(user.id),
                getTokenBalance(user.id),
            ]);

            if (profileData) setProfile(profileData);
            setTokenBalance(balance);
        } catch (error) {
            console.error('Error loading critical data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load secondary data in background (slower but not blocking)
    const loadSecondaryData = async () => {
        if (!user?.id) return;
        try {
            const [refCode, refStats, history] = await Promise.all([
                getReferralCode(user.id),
                getReferralStats(user.id),
                getTokenHistory(20, user.id)
            ]);

            setReferralCode(refCode);
            setReferralStats(refStats);
            setTokenHistory(history);
        } catch (error) {
            console.error('Error loading secondary data:', error);
        } finally {
            setSecondaryDataLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadCriticalData();
            // Then load secondary data in background
            setTimeout(() => loadSecondaryData(), 100);
        }
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        if (user) {
            await Promise.all([loadCriticalData(), loadSecondaryData()]);
        }
        setRefreshing(false);
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        // Toast or simple feedback could be added here
        alert('Kode referral disalin!');
    };

    const shareReferral = async () => {
        if (!referralCode) return;
        const message = `Ayo gabung di HYP Convert! Gunakan kode referralku: ${referralCode} dan dapatkan bonus token!`;
        try {
            await Share.share({
                message,
                title: 'Undangan HYP Convert',
            });
        } catch (error) {
            console.error(error);
        }
    };

    // Social Media Sharing Functions
    const shareToWhatsApp = () => {
        if (!referralCode) return;
        const message = `Ayo gabung di HYP Convert! 🚀\n\nGunakan kode referralku: *${referralCode}* dan dapatkan bonus token! 🎁\n\nDownload sekarang!`;
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

        if (Platform.OS === 'web') {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        } else {
            // Use Linking for mobile
            import('expo-linking').then(({ default: Linking }) => {
                Linking.openURL(url).catch(() => {
                    alert('WhatsApp tidak terinstall');
                });
            });
        }
    };

    const shareToTwitter = () => {
        if (!referralCode) return;
        const text = `Ayo gabung di HYP Convert! 🚀 Gunakan kode referralku: ${referralCode} dan dapatkan bonus token! 🎁`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

        if (Platform.OS === 'web') {
            window.open(url, '_blank');
        } else {
            import('expo-linking').then(({ default: Linking }) => {
                Linking.openURL(url).catch(() => {
                    alert('Tidak dapat membuka Twitter');
                });
            });
        }
    };

    const shareToFacebook = () => {
        if (!referralCode) return;
        const message = `Ayo gabung di HYP Convert! Gunakan kode referralku: ${referralCode} dan dapatkan bonus token!`;
        const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(message)}`;

        if (Platform.OS === 'web') {
            window.open(url, '_blank');
        } else {
            import('expo-linking').then(({ default: Linking }) => {
                Linking.openURL(url).catch(() => {
                    alert('Facebook tidak terinstall');
                });
            });
        }
    };

    const shareToTelegram = () => {
        if (!referralCode) return;
        const message = `Ayo gabung di HYP Convert! 🚀\n\nGunakan kode referralku: ${referralCode} dan dapatkan bonus token! 🎁`;
        const url = `https://t.me/share/url?text=${encodeURIComponent(message)}`;

        if (Platform.OS === 'web') {
            window.open(url, '_blank');
        } else {
            import('expo-linking').then(({ default: Linking }) => {
                Linking.openURL(url).catch(() => {
                    alert('Telegram tidak terinstall');
                });
            });
        }
    };

    const shareToThreads = () => {
        if (!referralCode) return;
        const message = `Ayo gabung di HYP Convert! Gunakan kode referralku: ${referralCode} dan dapatkan bonus token!`;
        const url = `https://threads.net/intent/post?text=${encodeURIComponent(message)}`;

        if (Platform.OS === 'web') {
            window.open(url, '_blank');
        } else {
            import('expo-linking').then(({ default: Linking }) => {
                Linking.openURL(url).catch(() => {
                    alert('Threads tidak terinstall');
                });
            });
        }
    };

    const shareToDiscord = () => {
        if (!referralCode) return;
        alert('Untuk berbagi ke Discord, salin kode referral dan paste di Discord channel Anda.');
        copyToClipboard(`Ayo gabung di HYP Convert! 🚀\nGunakan kode referralku: ${referralCode} dan dapatkan bonus token! 🎁`);
    };

    const shareToInstagram = () => {
        if (!referralCode) return;
        alert('Instagram tidak mendukung sharing teks langsung. Kode referral sudah disalin, silakan paste di Instagram Story atau DM Anda.');
        copyToClipboard(`Ayo gabung di HYP Convert! 🚀\nGunakan kode referralku: ${referralCode} dan dapatkan bonus token! 🎁`);
    };

    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Non-blocking loader via Skeleton/Partial UI implemented in return
    // if (loading) return ... (REMOVED)

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true, // Force show header
                    headerTitle: 'Profil Saya',
                    headerStyle: { backgroundColor: '#F2F2F7' },
                    headerShadowVisible: false,
                    headerTintColor: '#000000',
                    contentStyle: { backgroundColor: '#F2F2F7' },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 0, marginRight: 16 }}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Fallback Custom Back Button (Visible if header fails or on specific web views) */}
            <TouchableOpacity
                style={styles.backButtonFloating}
                onPress={() => router.back()}
            >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#007AFF" />
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
            >
                {/* Header Profile */}
                <View style={styles.profileHeader}>
                    <LinearGradient
                        colors={['#007AFF', '#5856D6']}
                        style={styles.avatarContainer}
                    >
                        <MaterialCommunityIcons name="account" size={40} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.username}>{profile?.username || 'User'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>

                    {profile?.role === 'admin' && (
                        <View style={{ alignItems: 'center', gap: 12 }}>
                            <View style={styles.adminBadge}>
                                <MaterialCommunityIcons name="shield-check" size={14} color="#fff" />
                                <Text style={styles.adminBadgeText}>ADMIN</Text>
                            </View>
                            <Button
                                mode="contained"
                                buttonColor="#5856D6"
                                icon="view-dashboard"
                                onPress={() => router.push('/admin' as any)}
                                style={{ borderRadius: 8 }}
                            >
                                Dashboard Admin
                            </Button>
                        </View>
                    )}
                </View>

                {/* Tokens Card */}
                <View style={styles.section}>
                    <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.tokenCard}
                    >
                        <View style={styles.tokenHeader}>
                            <Text style={styles.tokenLabel}>Saldo Token</Text>
                            <Image source={require('@/assets/images/hyp-token-icon.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                        </View>
                        <Text style={styles.tokenBalance}>{tokenBalance}</Text>
                        <Text style={styles.tokenSub}>HYP Tokens</Text>
                    </LinearGradient>
                </View>

                {/* Referral Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kode Referral</Text>
                    <Surface style={styles.referralCard} elevation={2}>
                        <View style={styles.referralCodeContainer}>
                            <Text style={styles.referralCode}>{referralCode || 'Generate...'}</Text>
                            <View style={styles.referralActions}>
                                <TouchableOpacity onPress={() => copyToClipboard(referralCode || '')}>
                                    <MaterialCommunityIcons name="content-copy" size={20} color="#007AFF" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={shareReferral}>
                                    <MaterialCommunityIcons name="share-variant" size={20} color="#007AFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Divider style={styles.divider} />

                        {/* Social Media Sharing */}
                        <View style={styles.socialShareSection}>
                            <Text style={styles.socialShareTitle}>Bagikan ke Sosial Media</Text>
                            <View style={styles.socialButtonsGrid}>
                                <TouchableOpacity
                                    style={[styles.socialButton, { backgroundColor: '#25D366' }]}
                                    onPress={shareToWhatsApp}
                                >
                                    <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
                                    <Text style={styles.socialButtonText}>WhatsApp</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.socialButton, { backgroundColor: '#E4405F' }]}
                                    onPress={shareToInstagram}
                                >
                                    <MaterialCommunityIcons name="instagram" size={24} color="#fff" />
                                    <Text style={styles.socialButtonText}>Instagram</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.socialButton, { backgroundColor: '#000000' }]}
                                    onPress={shareToTwitter}
                                >
                                    <MaterialCommunityIcons name="twitter" size={24} color="#fff" />
                                    <Text style={styles.socialButtonText}>X</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                                    onPress={shareToFacebook}
                                >
                                    <MaterialCommunityIcons name="facebook" size={24} color="#fff" />
                                    <Text style={styles.socialButtonText}>Facebook</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.socialButton, { backgroundColor: '#0088CC' }]}
                                    onPress={shareToTelegram}
                                >
                                    <MaterialCommunityIcons name="send-circle" size={24} color="#fff" />
                                    <Text style={styles.socialButtonText}>Telegram</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.socialButton, { backgroundColor: '#000000' }]}
                                    onPress={shareToThreads}
                                >
                                    <MaterialCommunityIcons name="at" size={24} color="#fff" />
                                    <Text style={styles.socialButtonText}>Threads</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.socialButton, { backgroundColor: '#5865F2' }]}
                                    onPress={shareToDiscord}
                                >
                                    <MaterialCommunityIcons name={"discord" as any} size={24} color="#fff" />
                                    <Text style={styles.socialButtonText}>Discord</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Divider style={styles.divider} />
                        <View style={styles.referralStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{referralStats.totalReferrals}</Text>
                                <Text style={styles.statLabel}>Teman</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{referralStats.totalBonus}</Text>
                                <Text style={styles.statLabel}>Token Bonus</Text>
                            </View>
                        </View>
                    </Surface>
                </View>

                {/* Transaction History */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Riwayat Token</Text>
                    {tokenHistory.length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <MaterialCommunityIcons name="history" size={32} color="#8E8E93" />
                            <Text style={styles.emptyText}>Belum ada transaksi</Text>
                        </View>
                    ) : (
                        <View style={styles.historyList}>
                            {tokenHistory.map((item) => (
                                <View key={item.id} style={styles.historyItem}>
                                    <View style={[
                                        styles.historyIcon,
                                        { backgroundColor: item.amount > 0 ? 'rgba(48,209,88,0.1)' : 'rgba(255,59,48,0.1)' }
                                    ]}>
                                        <MaterialCommunityIcons
                                            name={item.amount > 0 ? "arrow-down-left" : "arrow-up-right"}
                                            size={20}
                                            color={item.amount > 0 ? "#30D158" : "#FF3B30"}
                                        />
                                    </View>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyType}>
                                            {item.amount > 0 ? 'Terima Token' : 'Pakai Token'}
                                        </Text>
                                        <Text style={styles.historyDesc}>{item.description}</Text>
                                        <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                                    </View>
                                    <Text style={[
                                        styles.historyAmount,
                                        { color: item.amount > 0 ? "#30D158" : "#FF3B30" }
                                    ]}>
                                        {item.amount > 0 ? '+' : ''}{item.amount}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <Button
                    mode="outlined"
                    onPress={handleLogout}
                    textColor="#FF3B30"
                    style={styles.logoutButton}
                    icon="logout"
                >
                    Keluar
                </Button>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    // Back button fallback
    backButtonFloating: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 50,
        left: 20,
        zIndex: 100,
        backgroundColor: '#fff',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 3,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
    },
    content: {
        padding: 20,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        boxShadow: '0px 4px 8px rgba(0, 122, 255, 0.3)',
        elevation: 5,
    },
    username: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 12,
    },
    adminBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5856D6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    adminBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 12,
    },
    tokenCard: {
        padding: 24,
        borderRadius: 20,
        boxShadow: '0px 4px 10px rgba(255, 165, 0, 0.3)',
        elevation: 5,
    },
    tokenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tokenLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        fontWeight: '600',
    },
    tokenBalance: {
        color: '#fff',
        fontSize: 40,
        fontWeight: '800',
        marginBottom: 4,
    },
    tokenSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    referralCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
    },
    referralCodeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    referralCode: {
        fontSize: 20,
        fontWeight: '700',
        color: '#007AFF',
        letterSpacing: 1,
    },
    referralActions: {
        flexDirection: 'row',
        gap: 16,
    },
    divider: {
        marginBottom: 16,
    },
    referralStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    statLabel: {
        fontSize: 12,
        color: '#8E8E93',
    },
    socialShareSection: {
        marginTop: 8,
        marginBottom: 8,
    },
    socialShareTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 12,
    },
    socialButtonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
        minWidth: 100,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 3,
    },
    socialButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    historyList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historyType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    historyDesc: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 2,
    },
    historyDate: {
        fontSize: 10,
        color: '#C7C7CC',
    },
    historyAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyHistory: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
    },
    emptyText: {
        color: '#8E8E93',
        marginTop: 8,
    },
    logoutButton: {
        borderColor: '#FF3B30',
        borderWidth: 1,
    },
});
