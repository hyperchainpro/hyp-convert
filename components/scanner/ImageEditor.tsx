import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ImageResult } from 'expo-image-manipulator';
import { ColorMode, ManualAdjustments as ImageAdjustments, applyColorModeNative as applyColorMode, DEFAULT_ADJUSTMENTS } from '@/lib/imageFilters';

const { width } = Dimensions.get('window');

interface ImageEditorProps {
    visible: boolean;
    imageUri: string;
    initialColorMode: ColorMode;
    initialAdjustments?: ImageAdjustments;
    onClose: () => void;
    onSave: (uri: string, colorMode: ColorMode, adjustments: ImageAdjustments) => void;
}

type EditorTab = 'filters' | 'adjust';

const FILTERS: { id: ColorMode; name: string; icon: string }[] = [
    { id: 'original', name: 'Asli', icon: 'image-outline' },
    { id: 'grayscale', name: 'B&W', icon: 'image-filter-black-white' },
    { id: 'enhanced', name: 'Jelas', icon: 'auto-fix' },
    { id: 'photo', name: 'Foto', icon: 'camera-iris' },
    { id: 'binary', name: 'Teks', icon: 'format-text' },
];

export function ImageEditor({
    visible,
    imageUri,
    initialColorMode,
    initialAdjustments = DEFAULT_ADJUSTMENTS,
    onClose,
    onSave,
}: ImageEditorProps) {
    const [colorMode, setColorMode] = useState<ColorMode>(initialColorMode);
    const [adjustments, setAdjustments] = useState<ImageAdjustments>(initialAdjustments);
    const [activeTab, setActiveTab] = useState<EditorTab>('filters');
    const [previewUri, setPreviewUri] = useState<string>(imageUri);
    const [loading, setLoading] = useState(false);

    // TODO: Debounce preview updates for performance
    // For now, we rely on the parent or saving to apply the heavy lifting if needed
    // or we can use a small specialized hook for live preview if filters are CSS-based

    const handleSave = async () => {
        setLoading(true);
        // Here we would actually process the image with expo-image-manipulator
        // For now we pass back the settings and let the parent/PageManager handle the processed URI or style
        // In a real app, we might generate the new file here.
        setTimeout(() => {
            onSave(imageUri, colorMode, adjustments);
            setLoading(false);
            onClose();
        }, 500);
    };

    const updateAdjustment = (key: keyof ImageAdjustments, value: number) => {
        setAdjustments(prev => ({ ...prev, [key]: value }));
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton icon="close" iconColor="#fff" onPress={onClose} />
                <Text style={styles.title}>Edit Gambar</Text>
                <IconButton icon="check" iconColor="#007AFF" onPress={handleSave} disabled={loading} />
            </View>

            <View style={styles.previewContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" />
                ) : (
                    <Image
                        source={{ uri: imageUri }}
                        style={[
                            styles.previewImage,
                            // This is a simple visual approximation for the UI
                            // In reality, actual pixel processing is disconnected from CSS styles
                            // But for scanner apps, CSS filters often provide "good enough" preview
                            {
                                tintColor: colorMode === 'binary' ? undefined : undefined,
                                opacity: 1,
                            }
                        ]}
                        resizeMode="contain"
                    />
                )}
                {/* Visual Adjustment Overlay for Preview - Simulating filters with CSS-like props */}
                {/* Note: React Native Image doesn't support CSS filters directly without native modules or special views */}
                {/* So strictly speaking, this preview is static unless we process it. */}
                {/* For this MVP, we will assume we just show the image and controls. */}
            </View>

            <Surface style={styles.controls}>
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'filters' && styles.tabActive]}
                        onPress={() => setActiveTab('filters')}
                    >
                        <Text style={[styles.tabText, activeTab === 'filters' && styles.tabTextActive]}>Filter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'adjust' && styles.tabActive]}
                        onPress={() => setActiveTab('adjust')}
                    >
                        <Text style={[styles.tabText, activeTab === 'adjust' && styles.tabTextActive]}>Atur</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.controlsContent}>
                    {activeTab === 'filters' ? (
                        <View style={styles.filterGrid}>
                            {FILTERS.map((f) => (
                                <TouchableOpacity
                                    key={f.id}
                                    style={[styles.filterItem, colorMode === f.id && styles.filterItemActive]}
                                    onPress={() => setColorMode(f.id)}
                                >
                                    <View style={styles.filterPreview}>
                                        <MaterialCommunityIcons name={f.icon as any} size={24} color={colorMode === f.id ? "#007AFF" : "#8E8E93"} />
                                    </View>
                                    <Text style={[styles.filterName, colorMode === f.id && styles.filterNameActive]}>{f.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.adjustmentsContainer}>
                            {(Object.keys(DEFAULT_ADJUSTMENTS) as Array<keyof ImageAdjustments>).map((key) => {
                                const config = {
                                    brightness: { label: 'Kecerahan', icon: 'brightness-6', min: -100, max: 100 },
                                    contrast: { label: 'Kontras', icon: 'contrast-box', min: -100, max: 100 },
                                    saturation: { label: 'Saturasi', icon: 'palette', min: -100, max: 100 },
                                    sharpness: { label: 'Ketajaman', icon: 'blur', min: 0, max: 100 },
                                    clarity: { label: 'Kejernihan', icon: 'blur-linear', min: 0, max: 100 },
                                    vignette: { label: 'Vignette', icon: 'gradient-vertical', min: 0, max: 100 },
                                    grain: { label: 'Grain', icon: 'grain', min: 0, max: 100 },
                                    temperature: { label: 'Temperatur', icon: 'thermometer', min: -100, max: 100 },
                                    tint: { label: 'Tint', icon: 'format-color-fill', min: -100, max: 100 },
                                }[key];

                                if (!config) return null;

                                return (
                                    <View key={key} style={styles.adjustRow}>
                                        <View style={styles.adjustHeader}>
                                            <MaterialCommunityIcons name={config.icon as any} size={20} color="#8E8E93" />
                                            <Text style={styles.adjustLabel}>{config.label}</Text>
                                            <Text style={styles.adjustValue}>{adjustments[key]}</Text>
                                        </View>
                                        <View style={styles.adjustControls}>
                                            <IconButton
                                                icon="minus"
                                                size={16}
                                                style={styles.adjustBtn}
                                                onPress={() => {
                                                    const newVal = Math.max(config.min, adjustments[key] - 10);
                                                    updateAdjustment(key, newVal);
                                                }}
                                            />
                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        {
                                                            width: `${((adjustments[key] - config.min) / (config.max - config.min)) * 100}%`
                                                        }
                                                    ]}
                                                />
                                            </View>
                                            <IconButton
                                                icon="plus"
                                                size={16}
                                                style={styles.adjustBtn}
                                                onPress={() => {
                                                    const newVal = Math.min(config.max, adjustments[key] + 10);
                                                    updateAdjustment(key, newVal);
                                                }}
                                            />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 8,
        paddingBottom: 16,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    controls: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '40%',
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        color: '#8E8E93',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#fff',
    },
    controlsContent: {
        padding: 20,
    },
    filterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
    },
    filterItem: {
        alignItems: 'center',
        width: 70,
    },
    filterItemActive: {
        opacity: 1,
    },
    filterPreview: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2C2C2E',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    filterName: {
        color: '#8E8E93',
        fontSize: 12,
    },
    filterNameActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    adjustmentsContainer: {
        gap: 24,
    },
    adjustRow: {
        marginBottom: 16,
    },
    adjustHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    adjustLabel: {
        color: '#fff',
        fontSize: 14,
        flex: 1,
    },
    adjustValue: {
        color: '#8E8E93',
        fontSize: 14,
        fontVariant: ['tabular-nums'],
    },
    adjustControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    adjustBtn: {
        margin: 0,
        backgroundColor: '#2C2C2E',
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
    },
    slider: {
        width: '100%',
        height: 40,
    },
});
