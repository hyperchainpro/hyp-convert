/**
 * Corner Editor Component
 * Visual UI for adjusting document corners with drag handles
 */

import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    Image,
    PanResponder,
    Dimensions,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Circle, Line } from 'react-native-svg';
import {
    Corners,
    Point,
    getDefaultCorners,
    findClosestCorner,
    validateCorners,
} from '@/lib/documentDetection';

// =====================================================
// TYPES
// =====================================================

interface CornerEditorProps {
    imageUri: string;
    corners: Corners;
    onCornersChange: (corners: Corners) => void;
    onConfirm: () => void;
    onCancel: () => void;
    containerWidth?: number;
    containerHeight?: number;
}

// =====================================================
// CORNER HANDLE COMPONENT
// =====================================================

interface CornerHandleProps {
    position: Point;
    isActive: boolean;
    onDrag: (position: Point) => void;
    containerWidth: number;
    containerHeight: number;
}

const CornerHandle: React.FC<CornerHandleProps> = ({
    position,
    isActive,
    onDrag,
    containerWidth,
    containerHeight,
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
            },
            onPanResponderMove: (_, gestureState) => {
                const newX = Math.max(0, Math.min(containerWidth, position.x + gestureState.dx));
                const newY = Math.max(0, Math.min(containerHeight, position.y + gestureState.dy));
                onDrag({ x: newX, y: newY });
            },
            onPanResponderRelease: () => {
                setIsDragging(false);
            },
        })
    ).current;

    return (
        <View
            {...panResponder.panHandlers}
            style={[
                handleStyles.container,
                {
                    left: position.x - 20,
                    top: position.y - 20,
                },
                isDragging && handleStyles.dragging,
                isActive && handleStyles.active,
            ]}
        >
            <View style={[
                handleStyles.inner,
                isDragging && handleStyles.innerDragging,
            ]} />
            <View style={handleStyles.crosshairH} />
            <View style={handleStyles.crosshairV} />
        </View>
    );
};

const handleStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    inner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,122,255,0.8)',
        borderWidth: 3,
        borderColor: '#ffffff',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.5)',
        elevation: 5,
    },
    innerDragging: {
        backgroundColor: '#30D158',
        transform: [{ scale: 1.2 }],
    },
    dragging: {
        zIndex: 200,
    },
    active: {
        transform: [{ scale: 1.1 }],
    },
    crosshairH: {
        position: 'absolute',
        width: 40,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    crosshairV: {
        position: 'absolute',
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
});

// =====================================================
// MAIN COMPONENT
// =====================================================

export const CornerEditor: React.FC<CornerEditorProps> = ({
    imageUri,
    corners,
    onCornersChange,
    onConfirm,
    onCancel,
    containerWidth: propWidth,
    containerHeight: propHeight,
}) => {
    const { width: screenWidth } = Dimensions.get('window');
    const containerWidth = propWidth || screenWidth - 32;
    const containerHeight = propHeight || containerWidth * 1.4;

    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [activeCorner, setActiveCorner] = useState<keyof Corners | null>(null);
    const [isValid, setIsValid] = useState(true);

    const handleImageLoad = useCallback((event: any) => {
        const { width, height } = event.nativeEvent.source || { width: containerWidth, height: containerHeight };
        setImageSize({ width, height });
    }, [containerWidth, containerHeight]);

    const handleCornerDrag = useCallback((cornerKey: keyof Corners, position: Point) => {
        const newCorners = {
            ...corners,
            [cornerKey]: position,
        };

        const valid = validateCorners(newCorners);
        setIsValid(valid);
        onCornersChange(newCorners);
    }, [corners, onCornersChange]);

    const handleReset = useCallback(() => {
        const defaultCorners = getDefaultCorners(containerWidth, containerHeight);
        onCornersChange(defaultCorners);
        setIsValid(true);
    }, [containerWidth, containerHeight, onCornersChange]);

    const handleAutoDetect = useCallback(() => {
        // Placeholder for auto-detection
        // In a real implementation, this would call the detectEdges function
        const defaultCorners = getDefaultCorners(containerWidth, containerHeight);
        const paddedCorners: Corners = {
            topLeft: { x: defaultCorners.topLeft.x * 1.1, y: defaultCorners.topLeft.y * 1.1 },
            topRight: { x: defaultCorners.topRight.x * 0.9, y: defaultCorners.topRight.y * 1.1 },
            bottomRight: { x: defaultCorners.bottomRight.x * 0.9, y: defaultCorners.bottomRight.y * 0.9 },
            bottomLeft: { x: defaultCorners.bottomLeft.x * 1.1, y: defaultCorners.bottomLeft.y * 0.9 },
        };
        onCornersChange(paddedCorners);
    }, [containerWidth, containerHeight, onCornersChange]);

    // Generate polygon points for SVG
    const polygonPoints = `
        ${corners.topLeft.x},${corners.topLeft.y}
        ${corners.topRight.x},${corners.topRight.y}
        ${corners.bottomRight.x},${corners.bottomRight.y}
        ${corners.bottomLeft.x},${corners.bottomLeft.y}
    `;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
                    <MaterialCommunityIcons name="close" size={24} color="#FF453A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sesuaikan Sudut</Text>
                <TouchableOpacity onPress={onConfirm} style={styles.headerBtn} disabled={!isValid}>
                    <MaterialCommunityIcons
                        name="check"
                        size={24}
                        color={isValid ? '#30D158' : '#48484A'}
                    />
                </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
                <MaterialCommunityIcons name="gesture-tap" size={16} color="#8E8E93" />
                <Text style={styles.instructionsText}>
                    Seret sudut untuk menyesuaikan area dokumen
                </Text>
            </View>

            {/* Editor Canvas */}
            <View style={[styles.canvas, { width: containerWidth, height: containerHeight }]}>
                {/* Background Image */}
                <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoad={handleImageLoad}
                />

                {/* Overlay with cutout */}
                <View style={styles.overlay}>
                    <Svg width={containerWidth} height={containerHeight} style={StyleSheet.absoluteFill}>
                        {/* Semi-transparent overlay */}
                        <Polygon
                            points={`0,0 ${containerWidth},0 ${containerWidth},${containerHeight} 0,${containerHeight}`}
                            fill="rgba(0,0,0,0.5)"
                        />

                        {/* Document area (transparent) */}
                        <Polygon
                            points={polygonPoints}
                            fill="transparent"
                            stroke={isValid ? '#007AFF' : '#FF453A'}
                            strokeWidth={2}
                            strokeDasharray="5,5"
                        />

                        {/* Edge lines */}
                        <Line
                            x1={corners.topLeft.x}
                            y1={corners.topLeft.y}
                            x2={corners.topRight.x}
                            y2={corners.topRight.y}
                            stroke={isValid ? '#007AFF' : '#FF453A'}
                            strokeWidth={2}
                        />
                        <Line
                            x1={corners.topRight.x}
                            y1={corners.topRight.y}
                            x2={corners.bottomRight.x}
                            y2={corners.bottomRight.y}
                            stroke={isValid ? '#007AFF' : '#FF453A'}
                            strokeWidth={2}
                        />
                        <Line
                            x1={corners.bottomRight.x}
                            y1={corners.bottomRight.y}
                            x2={corners.bottomLeft.x}
                            y2={corners.bottomLeft.y}
                            stroke={isValid ? '#007AFF' : '#FF453A'}
                            strokeWidth={2}
                        />
                        <Line
                            x1={corners.bottomLeft.x}
                            y1={corners.bottomLeft.y}
                            x2={corners.topLeft.x}
                            y2={corners.topLeft.y}
                            stroke={isValid ? '#007AFF' : '#FF453A'}
                            strokeWidth={2}
                        />
                    </Svg>
                </View>

                {/* Corner Handles */}
                <CornerHandle
                    position={corners.topLeft}
                    isActive={activeCorner === 'topLeft'}
                    onDrag={(pos) => handleCornerDrag('topLeft', pos)}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                />
                <CornerHandle
                    position={corners.topRight}
                    isActive={activeCorner === 'topRight'}
                    onDrag={(pos) => handleCornerDrag('topRight', pos)}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                />
                <CornerHandle
                    position={corners.bottomRight}
                    isActive={activeCorner === 'bottomRight'}
                    onDrag={(pos) => handleCornerDrag('bottomRight', pos)}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                />
                <CornerHandle
                    position={corners.bottomLeft}
                    isActive={activeCorner === 'bottomLeft'}
                    onDrag={(pos) => handleCornerDrag('bottomLeft', pos)}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                />
            </View>

            {/* Validation Warning */}
            {!isValid && (
                <View style={styles.warning}>
                    <MaterialCommunityIcons name="alert" size={16} color="#FF9500" />
                    <Text style={styles.warningText}>
                        Sudut tidak valid. Pastikan membentuk persegi empat.
                    </Text>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity onPress={handleAutoDetect} style={styles.actionBtn}>
                    <LinearGradient
                        colors={['#5856D6', '#AF52DE']}
                        style={styles.actionBtnGradient}
                    >
                        <MaterialCommunityIcons name="auto-fix" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>Auto Deteksi</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleReset} style={styles.actionBtnOutline}>
                    <MaterialCommunityIcons name="refresh" size={20} color="#007AFF" />
                    <Text style={styles.actionBtnOutlineText}>Reset</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    instructions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: '#1C1C1E',
    },
    instructionsText: {
        fontSize: 14,
        color: '#8E8E93',
    },
    canvas: {
        alignSelf: 'center',
        marginVertical: 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1C1C1E',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    warning: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,149,0,0.2)',
        marginHorizontal: 16,
        borderRadius: 8,
    },
    warningText: {
        fontSize: 13,
        color: '#FF9500',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    actionBtn: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    actionBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
    actionBtnOutline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    actionBtnOutlineText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
    },
});

export default CornerEditor;
