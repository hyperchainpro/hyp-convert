import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
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

// Action card data structure for 2x2 grid
const ACTION_CARDS = [
    {
        id: 'scan',
        title: 'Scan',
        icon: 'camera' as const,
        gradient: ['#FFE5B4', '#FFD699'] as const,
        iconColor: '#FFA500',
        route: '/(tabs)/scanner' as const,
    },
    {
        id: 'edit',
        title: 'Edit',
        icon: 'pencil' as const,
        gradient: ['#B4E5FF', '#99D6FF'] as const,
        iconColor: '#0099FF',
        route: '/(tabs)/documents' as const,
    },
    {
        id: 'convert',
        title: 'Convert',
        icon: 'file-swap' as const,
        gradient: ['#B4D6FF', '#99CCFF'] as const,
        iconColor: '#0052CC',
        route: '/(tabs)/convert' as const,
    },
    {
        id: 'ask-ai',
        title: 'Ask AI',
        icon: 'brain' as const,
        gradient: ['#FFD4E5', '#FFC0D9'] as const,
        iconColor: '#FF6B9D',
        route: '/(tabs)/convert' as const,
    },
] as const;

export default function DashboardScreen() {
    const { user, signOut } = useAuth();
    const { documents } = useDocumentStore();
    const [stats, setStats] = useState({ total: 0, totalSize: 0 });
    const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [securityModalVisible, setSecurityModalVisible] = useState(false);
    const [tokenBalance, setTokenBalance] = useState(0);

    // Animation refs for action cards
    const cardAnimations = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;

    // Scale animation for button press
    const [scaleAnims] = useState([
        new Animated.Value(1),
        new Animated.Value(1),
        new Animated.Value(1),
        new Animated.Value(1),
    ]);

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

    // Staggered animation for cards on mount
    useEffect(() => {
        const animations = cardAnimations.map((anim, index) =>
            Animated.sequence([
                Animated.delay(index * 100),
                Animated.spring(anim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ])
        );
        Animated.parallel(animations).start();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleActionCardPress = (index: number, route: string) => {
        // Scale animation
        Animated.sequence([
            Animated.timing(scaleAnims[index], {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnims[index], {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate after a short delay
        setTimeout(() => {
            router.push(route);
        }, 150);
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

            {/* Header with Logo and Greeting */}
            <View style={styles.headerTop}>
                <View style={styles.headerTitleSection}>
                    <View style={styles.logoAndTitle}>
                        <MaterialCommunityIcons name="folder-open" size={24} color="#007AFF" />
                        <Text style={styles.appName}>HYP Convert</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.settingsBtn}
                    onPress={() => setSecurityModalVisible(true)}
                >
                    <MaterialCommunityIcons name="cog" size={20} color="#8E8E93" />
                </TouchableOpacity>
            </View>

            {/* Greeting */}
            <Text style={styles.greeting}>Hi {user?.email?.split('@')[0] || 'User'}</Text>

            {/* Action Cards Grid - 2x2 */}
            <View style={styles.actionGrid}>
                {ACTION_CARDS.map((card, index) => {
                    const row = Math.floor(index / 2);
                    const col = index % 2;

                    return (
                        <Animated.View
                            key={card.id}
                            style={[
                                styles.actionCardWrapper,
                                col === 0 && { marginRight: 8 },
                                {
                                    opacity: cardAnimations[index],
                                    transform: [
                                        {
                                            translateY: cardAnimations[index].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [20, 0],
                                            }),
                                        },
                                        {
                                            scale: scaleAnims[index],
                                        },
                                    ],
                                },
                            ]}
                        >
                            <TouchableOpacity
                                onPress={() => handleActionCardPress(index, card.route)}
                                activeOpacity={0.8}
                                style={styles.actionCard}
                            >
                                <LinearGradient
                                    colors={card.gradient}
                                    style={styles.actionCardGradient}
                                >
                                    <View style={styles.actionCardContent}>
                                        <MaterialCommunityIcons
                                            name={card.icon as any}
                                            size={40}
                                            color={card.iconColor}
                                        />
                                        <Text style={styles.actionCardTitle}>{card.title}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </View>

            {/* Native Ad Banner */}
            <UniversalAd type="native" />

            {/* Recent Activity Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>

                <View style={styles.recentActivityContainer}>
                    {/* Left Activity */}
                    <TouchableOpacity style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: 'rgba(200, 150, 100, 0.2)' }]}>
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#E67E22" />
                        </View>
                        <View style={styles.activityInfo}>
                            <Text style={styles.activityTitle}>PDF to Word</Text>
                            <Text style={styles.activityTime}>1 hours ago</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Right Activity */}
                    <TouchableOpacity style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: 'rgba(100, 150, 200, 0.2)' }]}>
                            <MaterialCommunityIcons name="image-search" size={24} color="#3498DB" />
                        </View>
                        <View style={styles.activityInfo}>
                            <Text style={styles.activityTitle}>Image Scan</Text>
                            <Text style={styles.activityTime}>1 hours ago</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Navigation Tabs Hint */}
            <View style={styles.section}>
                <View style={styles.navigationHint}>
                    <View style={styles.navTab}>
                        <View style={[styles.navIcon, { backgroundColor: 'rgba(0, 122, 255, 0.2)' }]}>
                            <MaterialCommunityIcons name="view-dashboard" size={20} color="#007AFF" />
                        </View>
                        <Text style={styles.navLabel}>Dashboard</Text>
                    </View>
                    <View style={styles.navTab}>
                        <MaterialCommunityIcons name="folder" size={20} color="#8E8E93" />
                        <Text style={styles.navLabel}>Files</Text>
                    </View>
                    <View style={styles.navTab}>
                        <MaterialCommunityIcons name="history" size={20} color="#8E8E93" />
                        <Text style={styles.navLabel}>History</Text>
                    </View>
                    <View style={styles.navTab}>
                        <MaterialCommunityIcons name="account" size={20} color="#8E8E93" />
                        <Text style={styles.navLabel}>Profile</Text>
                    </View>
                </View>
            </View>

            {/* Recent Documents */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Documents</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/documents' as any)}>
                        <Text style={styles.seeAllLink}>See All</Text>
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

            {/* Recent History */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Conversions</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                        <Text style={styles.seeAllLink}>See All</Text>
                    </TouchableOpacity>
                </View>

                {history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="history" size={40} color="#48484A" />
                        <Text style={styles.emptyText}>Belum ada riwayat konversi</Text>
                    </View>
                ) : (
                    history.map((item) => (
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },

    // Header
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitleSection: {
        flex: 1,
    },
    logoAndTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    appName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
    },
    settingsBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 20,
    },

    // Action Grid
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 24,
        gap: 16,
    },
    actionCardWrapper: {
        width: '48%',
    },
    actionCard: {
        overflow: 'hidden',
        borderRadius: 20,
    },
    actionCardGradient: {
        paddingVertical: 32,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    actionCardContent: {
        alignItems: 'center',
        gap: 12,
    },
    actionCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
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
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    seeAllLink: {
        color: '#007AFF',
        fontWeight: '500',
        fontSize: 14,
    },

    // Recent Activity
    recentActivityContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    activityItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    activityIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000000',
    },
    activityTime: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 2,
    },

    // Navigation Hint
    navigationHint: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    navTab: {
        alignItems: 'center',
        gap: 4,
    },
    navIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#8E8E93',
    },

    // Document Card
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
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
