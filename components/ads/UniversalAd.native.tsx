import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useAdManager } from '@/hooks/useAdManager';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    BannerAd,
    BannerAdSize,
    TestIds,
    InterstitialAd,
    AdEventType,
} from 'react-native-google-mobile-ads';
import { AD_CONFIG } from '@/constants/ads';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Use Test IDs in development if desired, or verify production IDs
// For now, we default to Test IDs if we are in development mode to avoid policy violations
const USE_TEST_IDS = __DEV__;

interface UniversalAdProps {
    type: 'native' | 'interstitial' | 'popup';
    onClose?: () => void;
}

export const UniversalAd: React.FC<UniversalAdProps> = ({ type, onClose }) => {
    const { getAdByType, awardAdReward } = useAdManager();
    const [adLoaded, setAdLoaded] = useState(false);
    const interstitialRef = useRef<InterstitialAd | null>(null);
    const [error, setError] = useState(false);

    // Get dynamic config from Admin
    const adConfig = getAdByType(type);

    // Determine Ad Unit ID
    // Priority: DEV Mode ? TEST_ID : (DB_ID || CONSTANT_ID)
    const getUnitId = () => {
        if (USE_TEST_IDS) {
            return type === 'interstitial' || type === 'popup' ? TestIds.INTERSTITIAL : TestIds.BANNER;
        }

        // In Production, try DB first, then Fallback
        if (adConfig) {
            if (Platform.OS === 'android' && adConfig.android_ad_unit_id) return adConfig.android_ad_unit_id;
            if (Platform.OS === 'ios' && adConfig.ios_ad_unit_id) return adConfig.ios_ad_unit_id;
        }

        // Final Fallback to Constants
        return type === 'native' ? AD_CONFIG.native : AD_CONFIG.interstitial;
    };

    const unitId = getUnitId();

    useEffect(() => {
        if (!unitId) return;

        if (type === 'interstitial' || type === 'popup') {
            const interstitial = InterstitialAd.createForAdRequest(unitId, {
                requestNonPersonalizedAdsOnly: true,
            });

            const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
                setAdLoaded(true);
                interstitial.show();
            });

            const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
                awardAdReward('interstitial_ad_view');
                onClose?.();
            });

            const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (err) => {
                console.error('Interstitial Ad Error:', err);
                setError(true);
                onClose?.();
            });

            interstitial.load();
            interstitialRef.current = interstitial;

            return () => {
                unsubscribeLoaded();
                unsubscribeClosed();
                unsubscribeError();
            };
        }
    }, [type, onClose, unitId]);

    // Render Native / Banner
    if (type === 'native') {
        return (
            <Surface style={styles.bannerContainer}>
                <View style={styles.bannerHeader}>
                    <Text style={styles.sponsoredLabel}>Sponsored</Text>
                </View>
                <View style={styles.bannerContent}>
                    <BannerAd
                        unitId={unitId} // Using Banner functionality for native-like placement
                        size={BannerAdSize.MEDIUM_RECTANGLE}
                        requestOptions={{
                            requestNonPersonalizedAdsOnly: true,
                        }}
                        onAdLoaded={() => setAdLoaded(true)}
                        onAdFailedToLoad={(error) => {
                            console.error('Native Ad Failed to Load: ', error);
                            setError(true);
                        }}
                    />
                </View>
            </Surface>
        );
    }

    // Since Interstitial is full screen and handled by listeners, we don't return visual component here
    // But for 'popup' type which might expect a UI component if it fails, we handle via listeners.
    return null;
};

const styles = StyleSheet.create({
    // ==================== FULL SCREEN OVERLAY ====================
    fullScreenOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    modalContainer: {
        width: SCREEN_WIDTH * 0.9,
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    closeBtn: {
        padding: 4,
    },
    modalAdContent: {
        width: '100%',
        aspectRatio: 1.2, // Responsive height based on width
        maxHeight: SCREEN_HEIGHT * 0.4,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rewardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        backgroundColor: '#E8F5E9',
    },
    rewardText: {
        color: '#2E7D32',
        fontWeight: '600',
        fontSize: 14,
    },

    // ==================== NATIVE BANNER ====================
    bannerContainer: {
        marginVertical: 12,
        marginHorizontal: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 3,
    },
    bannerHeader: {
        paddingHorizontal: 12,
        paddingTop: 8,
        alignItems: 'flex-start',
    },
    bannerContent: {
        width: '100%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sponsoredLabel: {
        fontSize: 10,
        color: '#8E8E93',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },

    // ==================== PLACEHOLDER ====================
    placeholderAd: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    placeholderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginTop: 10,
    },
    placeholderDesc: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
});
