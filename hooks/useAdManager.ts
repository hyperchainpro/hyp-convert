import { useState, useEffect } from 'react';
import { getAdConfigs, AdConfig } from '@/lib/admin';
import { addTokensToUser, getCurrentUser } from '@/lib/supabase';

export const useAdManager = () => {
    const [ads, setAds] = useState<AdConfig[]>([]);
    const [interstitialVisible, setInterstitialVisible] = useState(false);
    const [activeInterstitial, setActiveInterstitial] = useState<AdConfig | null>(null);

    useEffect(() => {
        loadAds();
    }, []);

    const loadAds = async () => {
        const configs = await getAdConfigs();
        setAds(configs.filter(ad => ad.is_active));
    };

    const getAdByType = (type: 'native' | 'interstitial' | 'popup') => {
        return ads.find(ad => ad.ad_type === type);
    };

    const showInterstitial = () => {
        const ad = getAdByType('interstitial');
        if (ad) {
            setActiveInterstitial(ad);
            setInterstitialVisible(true);
        }
    };

    const closeInterstitial = async () => {
        setInterstitialVisible(false);
        setActiveInterstitial(null);
        // Reward user logic could go here or in the ad component itself
        await awardAdReward('interstitial_view');
    };

    const awardAdReward = async (reason: string) => {
        try {
            const user = await getCurrentUser();
            if (user) {
                // Reward 10 tokens
                await addTokensToUser(user.id, 10, 'ad_reward', `Reward for ${reason}`);
                console.log('Reward awarded for:', reason);
            }
        } catch (error) {
            console.error('Failed to award ad tokens:', error);
        }
    };

    return {
        ads,
        getAdByType,
        showInterstitial,
        closeInterstitial,
        interstitialVisible,
        activeInterstitial,
        awardAdReward
    };
};
