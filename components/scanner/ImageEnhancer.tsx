/**
 * Image Enhancer Component
 * Provides 6 color modes and manual adjustment sliders for image editing
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Text, IconButton, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ColorMode,
    ManualAdjustments,
    COLOR_MODES,
    ADJUSTMENT_CONFIGS,
    DEFAULT_ADJUSTMENTS,
    FILTER_PRESETS,
    getFilterStyle,
    FilterPreset,
} from '@/lib/imageFilters';

// =====================================================
// TYPES
// =====================================================

interface ImageEnhancerProps {
    colorMode: ColorMode;
    adjustments: ManualAdjustments;
    onColorModeChange: (mode: ColorMode) => void;
    onAdjustmentsChange: (adjustments: ManualAdjustments) => void;
    onApplyPreset?: (preset: FilterPreset) => void;
    showPresets?: boolean;
    compact?: boolean;
}

// =====================================================
// SLIDER COMPONENT (Custom for web compatibility)
// =====================================================

interface SliderProps {
    value: number;
    min: number;
    max: number;
    step: number;
    onValueChange: (value: number) => void;
    label: string;
    icon: string;
}

const CustomSlider: React.FC<SliderProps> = ({
    value,
    min,
    max,
    step,
    onValueChange,
    label,
    icon,
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const handleChange = (e: any) => {
        const newValue = Platform.OS === 'web'
            ? parseFloat(e.target.value)
            : parseFloat(e.nativeEvent.text);
        onValueChange(newValue);
    };

    return (
        <View style={sliderStyles.container}>
            <View style={sliderStyles.header}>
                <MaterialCommunityIcons name={icon as any} size={16} color="#8E8E93" />
                <Text style={sliderStyles.label}>{label}</Text>
                <Text style={sliderStyles.value}>{value > 0 ? `+${value}` : value}</Text>
            </View>
            {Platform.OS === 'web' ? (
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleChange}
                    style={{
                        width: '100%',
                        height: 4,
                        background: `linear-gradient(to right, #007AFF ${percentage}%, #3A3A3C ${percentage}%)`,
                        borderRadius: 4,
                        outline: 'none',
                        cursor: 'pointer',
                        appearance: 'none' as any,
                        WebkitAppearance: 'none' as any,
                    }}
                />
            ) : (
                <View style={sliderStyles.track}>
                    <View style={[sliderStyles.fill, { width: `${percentage}%` }]} />
                    <View style={[sliderStyles.thumb, { left: `${percentage}%` }]} />
                </View>
            )}
        </View>
    );
};

const sliderStyles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    label: {
        flex: 1,
        color: '#ffffff',
        fontSize: 14,
    },
    value: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'right',
    },
    track: {
        height: 4,
        backgroundColor: '#3A3A3C',
        borderRadius: 2,
        position: 'relative',
    },
    fill: {
        position: 'absolute',
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
    thumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        top: -6,
        marginLeft: -8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
});

// =====================================================
// MAIN COMPONENT
// =====================================================

export const ImageEnhancer: React.FC<ImageEnhancerProps> = ({
    colorMode,
    adjustments,
    onColorModeChange,
    onAdjustmentsChange,
    onApplyPreset,
    showPresets = true,
    compact = false,
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [activeTab, setActiveTab] = useState<'modes' | 'adjust' | 'presets'>('modes');

    const handleAdjustmentChange = useCallback((key: keyof ManualAdjustments, value: number) => {
        onAdjustmentsChange({
            ...adjustments,
            [key]: value,
        });
    }, [adjustments, onAdjustmentsChange]);

    const handleReset = useCallback(() => {
        onAdjustmentsChange(DEFAULT_ADJUSTMENTS);
        onColorModeChange('original');
    }, [onAdjustmentsChange, onColorModeChange]);

    const handlePresetApply = useCallback((preset: FilterPreset) => {
        onColorModeChange(preset.colorMode);
        onAdjustmentsChange(preset.adjustments);
        onApplyPreset?.(preset);
    }, [onColorModeChange, onAdjustmentsChange, onApplyPreset]);

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.colorModesRow}>
                        {COLOR_MODES.map((mode) => (
                            <TouchableOpacity
                                key={mode.key}
                                onPress={() => onColorModeChange(mode.key)}
                                style={[
                                    styles.compactModeChip,
                                    colorMode === mode.key && styles.compactModeChipActive,
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={mode.icon as any}
                                    size={16}
                                    color={colorMode === mode.key ? '#fff' : '#8E8E93'}
                                />
                                <Text
                                    style={[
                                        styles.compactModeText,
                                        colorMode === mode.key && styles.compactModeTextActive,
                                    ]}
                                >
                                    {mode.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    onPress={() => setActiveTab('modes')}
                    style={[styles.tab, activeTab === 'modes' && styles.tabActive]}
                >
                    <MaterialCommunityIcons
                        name="palette"
                        size={18}
                        color={activeTab === 'modes' ? '#007AFF' : '#8E8E93'}
                    />
                    <Text style={[styles.tabText, activeTab === 'modes' && styles.tabTextActive]}>
                        Mode
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('adjust')}
                    style={[styles.tab, activeTab === 'adjust' && styles.tabActive]}
                >
                    <MaterialCommunityIcons
                        name="tune"
                        size={18}
                        color={activeTab === 'adjust' ? '#007AFF' : '#8E8E93'}
                    />
                    <Text style={[styles.tabText, activeTab === 'adjust' && styles.tabTextActive]}>
                        Adjust
                    </Text>
                </TouchableOpacity>
                {showPresets && (
                    <TouchableOpacity
                        onPress={() => setActiveTab('presets')}
                        style={[styles.tab, activeTab === 'presets' && styles.tabActive]}
                    >
                        <MaterialCommunityIcons
                            name="auto-fix"
                            size={18}
                            color={activeTab === 'presets' ? '#007AFF' : '#8E8E93'}
                        />
                        <Text style={[styles.tabText, activeTab === 'presets' && styles.tabTextActive]}>
                            Preset
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                    <MaterialCommunityIcons name="refresh" size={18} color="#FF453A" />
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                {/* Color Modes Tab */}
                {activeTab === 'modes' && (
                    <View style={styles.modesGrid}>
                        {COLOR_MODES.map((mode) => (
                            <TouchableOpacity
                                key={mode.key}
                                onPress={() => onColorModeChange(mode.key)}
                                style={[
                                    styles.modeCard,
                                    colorMode === mode.key && styles.modeCardActive,
                                ]}
                            >
                                <View style={[
                                    styles.modeIconContainer,
                                    colorMode === mode.key && styles.modeIconContainerActive,
                                ]}>
                                    <MaterialCommunityIcons
                                        name={mode.icon as any}
                                        size={24}
                                        color={colorMode === mode.key ? '#fff' : '#8E8E93'}
                                    />
                                </View>
                                <Text style={[
                                    styles.modeName,
                                    colorMode === mode.key && styles.modeNameActive,
                                ]}>
                                    {mode.label}
                                </Text>
                                <Text style={styles.modeDescription} numberOfLines={1}>
                                    {mode.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Adjustments Tab */}
                {activeTab === 'adjust' && (
                    <View style={styles.adjustContainer}>
                        {ADJUSTMENT_CONFIGS.slice(0, showAdvanced ? undefined : 4).map((config) => (
                            <CustomSlider
                                key={config.key}
                                value={adjustments[config.key]}
                                min={config.min}
                                max={config.max}
                                step={config.step}
                                label={config.label}
                                icon={config.icon}
                                onValueChange={(value) => handleAdjustmentChange(config.key, value)}
                            />
                        ))}

                        {!showAdvanced && ADJUSTMENT_CONFIGS.length > 4 && (
                            <TouchableOpacity
                                onPress={() => setShowAdvanced(true)}
                                style={styles.showMoreBtn}
                            >
                                <Text style={styles.showMoreText}>
                                    Tampilkan lebih banyak pengaturan
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#007AFF" />
                            </TouchableOpacity>
                        )}

                        {showAdvanced && (
                            <TouchableOpacity
                                onPress={() => setShowAdvanced(false)}
                                style={styles.showMoreBtn}
                            >
                                <Text style={styles.showMoreText}>Sembunyikan</Text>
                                <MaterialCommunityIcons name="chevron-up" size={20} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Presets Tab */}
                {activeTab === 'presets' && (
                    <View style={styles.presetsGrid}>
                        {FILTER_PRESETS.map((preset) => (
                            <TouchableOpacity
                                key={preset.id}
                                onPress={() => handlePresetApply(preset)}
                                style={styles.presetCard}
                            >
                                <LinearGradient
                                    colors={['rgba(0,122,255,0.2)', 'rgba(88,86,214,0.2)']}
                                    style={styles.presetGradient}
                                >
                                    <MaterialCommunityIcons
                                        name={preset.icon as any}
                                        size={28}
                                        color="#007AFF"
                                    />
                                    <Text style={styles.presetName}>{preset.name}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        overflow: 'hidden',
    },
    compactContainer: {
        paddingVertical: 8,
    },
    colorModesRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 4,
    },
    compactModeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#2C2C2E',
    },
    compactModeChipActive: {
        backgroundColor: '#007AFF',
    },
    compactModeText: {
        fontSize: 13,
        color: '#8E8E93',
    },
    compactModeTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
        paddingHorizontal: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 14,
        color: '#8E8E93',
    },
    tabTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    resetBtn: {
        paddingHorizontal: 12,
        justifyContent: 'center',
    },

    // Tab Content
    tabContent: {
        padding: 16,
        maxHeight: 300,
    },

    // Modes Grid
    modesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    modeCard: {
        width: '30%',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#2C2C2E',
    },
    modeCardActive: {
        backgroundColor: 'rgba(0,122,255,0.2)',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    modeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3A3A3C',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    modeIconContainerActive: {
        backgroundColor: '#007AFF',
    },
    modeName: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: '600',
        marginBottom: 2,
    },
    modeNameActive: {
        color: '#007AFF',
    },
    modeDescription: {
        fontSize: 10,
        color: '#8E8E93',
        textAlign: 'center',
    },

    // Adjustments
    adjustContainer: {
        gap: 4,
    },
    showMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 12,
    },
    showMoreText: {
        fontSize: 14,
        color: '#007AFF',
    },

    // Presets Grid
    presetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    presetCard: {
        width: '47%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    presetGradient: {
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    presetName: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '600',
    },
});

export default ImageEnhancer;
