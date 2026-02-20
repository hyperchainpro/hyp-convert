import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Surface } from 'react-native-paper';

const { width } = Dimensions.get('window');
const CARD_ASPECT_RATIO = 1.586; // Standard ID-1 format (85.60 × 53.98 mm)
const CARD_WIDTH = Math.min(width * 0.9, 400);
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;

interface IDCardOverlayProps {
    active: boolean;
}

export function IDCardOverlay({ active }: IDCardOverlayProps) {
    if (!active) return null;

    return (
        <View style={[styles.container, { pointerEvents: 'none' } as any]}>
            {/* Main Mask */}
            <View style={styles.topMask} />
            <View style={styles.centerRow}>
                <View style={styles.sideMask} />
                <View style={styles.cardFrame}>
                    {/* Corners */}
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />

                    {/* Photo Placeholder Guide */}
                    <View style={styles.photoGuide} />
                </View>
                <View style={styles.sideMask} />
            </View>
            <View style={styles.bottomMask}>
                <Surface style={styles.instructionTag} elevation={2}>
                    <Text style={styles.instructionText}>
                        Posisikan KTP di sini. Pastikan foto dan teks jelas.
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
        borderColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderRadius: 12,
        position: 'relative',
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#30D158',
        borderWidth: 4,
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
    photoGuide: {
        position: 'absolute',
        right: 20,
        top: '20%',
        width: CARD_HEIGHT * 0.45,
        height: CARD_HEIGHT * 0.55,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        borderStyle: 'dashed',
        borderRadius: 4,
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
});
