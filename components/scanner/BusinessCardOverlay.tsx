import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 1.586; // Standard credit card / business card ratio (85.6mm / 53.98mm)
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

interface BusinessCardOverlayProps {
    active: boolean;
}

export function BusinessCardOverlay({ active }: BusinessCardOverlayProps) {
    if (!active) return null;

    return (
        <View style={[styles.container, { pointerEvents: 'none' } as any]}>
            {/* Darkened Backgrounds */}
            <View style={styles.topMask} />
            <View style={styles.centerRow}>
                <View style={styles.sideMask} />
                <View style={styles.cardFrame}>
                    {/* Corners */}
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />

                    <LinearGradient
                        colors={['rgba(255,255,255,0.1)', 'transparent', 'rgba(255,255,255,0.1)']}
                        style={styles.scanLine}
                    />
                </View>
                <View style={styles.sideMask} />
            </View>
            <View style={styles.bottomMask}>
                <Surface style={styles.instructionTag} elevation={2}>
                    <Text style={styles.instructionText}>
                        Posisikan kartu nama di dalam kotak
                    </Text>
                </Surface>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    topMask: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    centerRow: {
        flexDirection: 'row',
        height: CARD_HEIGHT,
    },
    sideMask: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    bottomMask: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        paddingTop: 30,
    },
    cardFrame: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderRadius: 12,
        position: 'relative',
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: '#007AFF',
        borderWidth: 3,
    },
    topLeft: {
        top: -2,
        left: -2,
        borderBottomWidth: 0,
        borderRightWidth: 0,
        borderTopLeftRadius: 12,
    },
    topRight: {
        top: -2,
        right: -2,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderTopRightRadius: 12,
    },
    bottomLeft: {
        bottom: -2,
        left: -2,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomLeftRadius: 12,
    },
    bottomRight: {
        bottom: -2,
        right: -2,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderBottomRightRadius: 12,
    },
    instructionTag: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    instructionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    scanLine: {
        width: '100%',
        height: 2,
        backgroundColor: '#007AFF',
        opacity: 0.5,
        position: 'absolute',
        top: '50%',
    }
});
