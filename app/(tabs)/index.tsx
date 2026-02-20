import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { Text, IconButton, Avatar } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentStore } from '@/hooks/useDocumentStore';
import { getConversionStats, getConversionHistory, getTokenBalance } from '@/lib/supabase';
import { formatFileSize, BIDIRECTIONAL_CONVERSIONS } from '@/constants/formats';
import { SecuritySettingsModal } from '@/components/security/SecuritySettingsModal';
import { UniversalAd } from '@/components/ads/UniversalAd';

interface ConversionHistoryItem {
    id: string;
    original_format: string;
    target_format: string;
    original_size: number;
    converted_at: string;
}

// Use first 8 bidirectional conversions for quick actions
const QUICK_ACTIONS = BIDIRECTIONAL_CONVERSIONS.slice(0, 8);

export default function DashboardScreen() {
    const { user, signOut } = useAuth();
    const { documents } = useDocumentStore();
    const [stats, setStats] = useState({ total: 0, totalSize: 0 });
    const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [securityModalVisible, setSecurityModalVisible] = useState(false);
    const [tokenBalance, setTokenBalance] = useState(0);

    const loadData = async () => {
        try {
            const [statsData, historyData, balance] = await Promise.all([
                getConversionStats(),
                getConversionHistory(5),
                getTokenBalance(),
            ]);
            setStats(statsData);
            setHistory(historyData);
            setTokenBalance(balance);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleQuickAction = (from: string, to: string) => {
        router.push({
            pathname: '/(tabs)/convert',
            params: { from: from.toLowerCase(), to: to.toLowerCase() },
        });
    };

    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    const formatDate = (dateStr: string | number) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
            }
        >
            <SecuritySettingsModal
                visible={securityModalVisible}
                onClose={() => setSecurityModalVisible(false)}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerLeft}
                    onPress={() => router.push('/profile')}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['#007AFF', '#5856D6']}
                        style={styles.avatarGradient}
                    >
                        <MaterialCommunityIcons name="account" size={24} color="#fff" />
                    </LinearGradient>
                    <View>
                        <Text variant="titleMedium" style={styles.greeting}>
                            Selamat datang! 👋
                        </Text>
                        <Text variant="bodySmall" style={styles.email}>
                            {user?.email || 'Pengguna'}
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.logoutBtn, { backgroundColor: 'rgba(0,122,255,0.15)' }]}
                        onPress={() => setSecurityModalVisible(true)}
                    >
                        <MaterialCommunityIcons name="cog" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Cards with Glassmorphism */}
            <View style={styles.statsContainer}>
                <LinearGradient
                    colors={['#FFFFFF', '#F2F2F7']}
                    style={styles.statCard}
                >
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
                        <Image source={require('@/assets/images/hyp-token-icon.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    </View>
                    <Text variant="headlineMedium" style={styles.statNumber}>{tokenBalance}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>HYP Tokens</Text>
                </LinearGradient>

                <LinearGradient
                    colors={['#FFFFFF', '#F2F2F7']}
                    style={styles.statCard}
                >
                    <View style={styles.statIconContainer}>
                        <MaterialCommunityIcons name="file-document-multiple" size={28} color="#007AFF" />
                    </View>
                    <Text variant="headlineMedium" style={styles.statNumber}>{stats.total}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>Total Konversi</Text>
                </LinearGradient>
            </View>

            {/* Native Ad Banner */}
            <UniversalAd type="native" />

            {/* Quick Actions - Bidirectional */}
            <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    ⚡ Konversi Cepat
                </Text>
                <Text style={styles.sectionSubtitle}>
                    Konversi dua arah • TXT ↔ PDF • JSON ↔ CSV
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickActionsScroll}
                >
                    {QUICK_ACTIONS.map((action: any, index: number) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleQuickAction(action.from, action.to)}
                            activeOpacity={0.8}
                            style={styles.quickActionCard}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                                <MaterialCommunityIcons
                                    name={action.icon as any}
                                    size={22}
                                    color={action.color}
                                />
                            </View>
                            <Text style={styles.quickActionText}>
                                {action.from}
                            </Text>
                            <MaterialCommunityIcons name="arrow-right" size={14} color="#8E8E93" />
                            <Text style={styles.quickActionText}>
                                {action.to}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Main Convert Button */}
            <TouchableOpacity
                onPress={() => router.push('/(tabs)/convert')}
                activeOpacity={0.9}
                style={styles.convertButtonContainer}
            >
                <LinearGradient
                    colors={['#007AFF', '#5856D6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.convertButton}
                >
                    <MaterialCommunityIcons name="file-swap" size={24} color="#fff" />
                    <Text style={styles.convertButtonText}>Mulai Konversi</Text>
                    <View style={styles.convertButtonBadge}>
                        <Text style={styles.convertButtonBadgeText}>80+ Format</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            {/* Features Highlight */}
            <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                        <MaterialCommunityIcons name="shield-check" size={18} color="#30D158" />
                    </View>
                    <Text style={styles.featureText}>100% Private</Text>
                </View>
                <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: 'rgba(255,159,10,0.15)' }]}>
                        <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FF9F0A" />
                    </View>
                    <Text style={styles.featureText}>Fast Convert</Text>
                </View>
                <View style={[styles.featureItem, { borderRightWidth: 0 }]}>
                    <View style={[styles.featureIcon, { backgroundColor: 'rgba(191,90,242,0.15)' }]}>
                        <MaterialCommunityIcons name="swap-horizontal" size={18} color="#BF5AF2" />
                    </View>
                    <Text style={styles.featureText}>Bidirectional</Text>
                </View>
            </View>

            {/* Recent Documents (Scanned) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        📄 Dokumen Terbaru
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/documents' as any)}
                        style={styles.seeAllBtn}
                    >
                        <Text style={styles.seeAllText}>Lihat Semua</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                {documents.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="file-document-outline" size={40} color="#48484A" />
                        <Text style={styles.emptyText}>Belum ada dokumen yang discan</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/scanner')}
                            style={{ marginTop: 12, paddingVertical: 8 }}
                        >
                            <Text style={{ color: '#007AFF', fontWeight: '600' }}>Scan Sekarang</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {documents.slice(0, 5).map((doc) => (
                            <TouchableOpacity
                                key={doc.id}
                                style={styles.docCard}
                                onPress={() => router.push({ pathname: '/(tabs)/documents' as any, params: { docId: doc.id } })}
                            >
                                <View style={styles.docThumb}>
                                    {doc.pages.length > 0 ? (
                                        <Image
                                            source={{ uri: doc.pages[0].editedUri }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <MaterialCommunityIcons name="file-document" size={32} color="#8E8E93" />
                                    )}
                                    <View style={styles.docBadge}>
                                        <Text style={styles.docBadgeText}>{doc.pages.length} Hal</Text>
                                    </View>
                                </View>
                                <Text numberOfLines={1} style={styles.docTitle}>{doc.name}</Text>
                                <Text style={styles.docDate}>{formatDate(doc.createdAt)}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Recent History (Conversions) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        📊 Riwayat Konversi
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/history')}
                        style={styles.seeAllBtn}
                    >
                        <Text style={styles.seeAllText}>Lihat Semua</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                {history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="history" size={40} color="#48484A" />
                        <Text style={styles.emptyText}>Belum ada riwayat konversi</Text>
                    </View>
                ) : (
                    history.map((item, index) => (
                        <View key={item.id} style={styles.historyItem}>
                            <View style={styles.historyIcon}>
                                <MaterialCommunityIcons name="file-sync" size={20} color="#007AFF" />
                            </View>
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyFormat}>
                                    {item.original_format.toUpperCase()} → {item.target_format.toUpperCase()}
                                </Text>
                                <Text style={styles.historyMeta}>
                                    {formatFileSize(item.original_size)} • {formatDate(item.converted_at)}
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#48484A" />
                        </View>
                    ))
                )}
            </View>
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7', // Light Background
    },
    docCard: {
        width: 120,
        marginRight: 4,
    },
    docThumb: {
        width: 120,
        height: 160,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 3,
    },
    docBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    docBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    docTitle: {
        color: '#000000',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    docDate: {
        color: '#8E8E93',
        fontSize: 11,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    greeting: {
        color: '#000000',
        fontWeight: '700',
    },
    email: {
        color: '#8E8E93',
    },
    logoutBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,59,48,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        elevation: 2,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        // backgroundColor handled inline for opacity
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statNumber: {
        color: '#000000',
        fontWeight: '700',
    },
    statLabel: {
        color: '#8E8E93',
        marginTop: 4,
    },

    // Section
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        color: '#000000',
        fontWeight: '700',
    },
    sectionSubtitle: {
        color: '#8E8E93',
        fontSize: 13,
        marginTop: -8,
        marginBottom: 14,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    seeAllText: {
        color: '#007AFF',
        fontWeight: '500',
        fontSize: 14,
    },

    // Quick Actions
    quickActionsScroll: {
        gap: 10,
    },
    quickActionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        elevation: 2,
    },
    quickActionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionText: {
        color: '#000000',
        fontWeight: '600',
        fontSize: 13,
    },

    // Convert Button
    convertButtonContainer: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0px 8px 16px rgba(0, 122, 255, 0.25)',
        elevation: 8,
    },
    convertButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
    },
    convertButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 17,
    },
    convertButtonBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    convertButtonBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },

    // Features
    featuresContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 24,
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        elevation: 2,
    },
    featureItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRightWidth: 1,
        borderRightColor: '#F2F2F7',
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        color: '#000000',
        fontSize: 12,
        fontWeight: '500',
    },

    // Empty State
    emptyState: {
        padding: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    emptyText: {
        color: '#8E8E93',
        marginTop: 12,
    },

    // History
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        elevation: 1,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0,122,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historyFormat: {
        color: '#000000',
        fontWeight: '600',
    },
    historyMeta: {
        color: '#8E8E93',
        fontSize: 12,
        marginTop: 2,
    },
});
