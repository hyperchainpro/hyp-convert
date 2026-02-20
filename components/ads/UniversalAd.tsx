import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface UniversalAdProps {
    type: 'native' | 'interstitial' | 'popup';
    onClose?: () => void;
}

export const UniversalAd: React.FC<UniversalAdProps> = ({ type }) => {
    // Web implementation (Stub or custom web ad script logic)
    // For now, returning null to avoid showing mobile ads on web.
    // In future, this can render Google AdSense or similar web ads if configured.
    return null;
};

const styles = StyleSheet.create({});
