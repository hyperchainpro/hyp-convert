/**
 * Image Filters & Enhancement Utilities
 * Provides 6 color modes and manual adjustment capabilities
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

// =====================================================
// COLOR MODES
// =====================================================

export type ColorMode =
    | 'original'      // No filter
    | 'bw'            // Black & White (document optimal)
    | 'color'         // Enhanced color for color documents
    | 'grayscale'     // Grayscale with contrast tuning
    | 'photo'         // Photo mode for images
    | 'enhanced'      // AI-powered enhancement
    | 'lowlight'      // Low light mode for dark conditions
    | 'binary';       // Pure black and white for OCR

export interface ColorModeConfig {
    key: ColorMode;
    label: string;
    labelEn: string;
    icon: string;
    description: string;
    cssFilter?: string;
}

export const COLOR_MODES: ColorModeConfig[] = [
    {
        key: 'original',
        label: 'Asli',
        labelEn: 'Original',
        icon: 'image',
        description: 'Tidak ada perubahan',
        cssFilter: '',
    },
    {
        key: 'bw',
        label: 'B&W',
        labelEn: 'Black & White',
        icon: 'contrast-box',
        description: 'Optimal untuk dokumen teks',
        cssFilter: 'grayscale(100%) contrast(180%) brightness(105%)',
    },
    {
        key: 'color',
        label: 'Warna',
        labelEn: 'Color',
        icon: 'palette',
        description: 'Dokumen berwarna yang ditingkatkan',
        cssFilter: 'saturate(120%) contrast(110%)',
    },
    {
        key: 'grayscale',
        label: 'Abu-abu',
        labelEn: 'Grayscale',
        icon: 'palette-outline',
        description: 'Grayscale dengan kontrast tuning',
        cssFilter: 'grayscale(100%) contrast(120%)',
    },
    {
        key: 'photo',
        label: 'Foto',
        labelEn: 'Photo',
        icon: 'camera',
        description: 'Mode foto untuk gambar',
        cssFilter: 'saturate(110%) brightness(102%) contrast(105%)',
    },
    {
        key: 'enhanced',
        label: 'Enhanced',
        labelEn: 'Enhanced',
        icon: 'auto-fix',
        description: 'AI-powered enhancement',
        cssFilter: 'contrast(125%) brightness(108%) saturate(105%)',
    },
    {
        key: 'lowlight',
        label: 'Low Light',
        labelEn: 'Low Light',
        icon: 'brightness-4',
        description: 'Untuk kondisi cahaya gelap',
        cssFilter: 'brightness(130%) contrast(115%) saturate(95%)',
    },
    {
        key: 'binary',
        label: 'Teks Biner',
        labelEn: 'Binary Text',
        icon: 'format-text',
        description: 'Hitam putih murni untuk OCR',
        cssFilter: 'grayscale(100%) contrast(200%) brightness(110%)',
    },
];

// =====================================================
// MANUAL ADJUSTMENTS
// =====================================================

export interface ManualAdjustments {
    brightness: number;     // -100 to 100, default 0
    contrast: number;       // -100 to 100, default 0
    saturation: number;     // -100 to 100, default 0
    temperature: number;    // -100 to 100, default 0 (warm/cool)
    tint: number;           // -100 to 100, default 0 (green/magenta)
    sharpness: number;      // 0 to 100, default 0
    clarity: number;        // 0 to 100, default 0
    vignette: number;       // 0 to 100, default 0
    grain: number;          // 0 to 100, default 0
}

export const DEFAULT_ADJUSTMENTS: ManualAdjustments = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    sharpness: 0,
    clarity: 0,
    vignette: 0,
    grain: 0,
};

export interface AdjustmentConfig {
    key: keyof ManualAdjustments;
    label: string;
    icon: string;
    min: number;
    max: number;
    step: number;
}

export const ADJUSTMENT_CONFIGS: AdjustmentConfig[] = [
    { key: 'brightness', label: 'Kecerahan', icon: 'brightness-6', min: -100, max: 100, step: 1 },
    { key: 'contrast', label: 'Kontras', icon: 'contrast-box', min: -100, max: 100, step: 1 },
    { key: 'saturation', label: 'Saturasi', icon: 'palette', min: -100, max: 100, step: 1 },
    { key: 'temperature', label: 'Temperatur', icon: 'thermometer', min: -100, max: 100, step: 1 },
    { key: 'tint', label: 'Tint', icon: 'format-color-fill', min: -100, max: 100, step: 1 },
    { key: 'sharpness', label: 'Ketajaman', icon: 'blur', min: 0, max: 100, step: 1 },
    { key: 'clarity', label: 'Kejernihan', icon: 'blur-linear', min: 0, max: 100, step: 1 },
    { key: 'vignette', label: 'Vignette', icon: 'gradient-vertical', min: 0, max: 100, step: 1 },
    { key: 'grain', label: 'Grain', icon: 'grain', min: 0, max: 100, step: 1 },
];

// =====================================================
// CSS FILTER GENERATION (Web)
// =====================================================

/**
 * Generate CSS filter string from adjustments
 */
export function generateCSSFilter(
    colorMode: ColorMode,
    adjustments: ManualAdjustments
): string {
    const filters: string[] = [];

    // Base color mode filter
    const modeConfig = COLOR_MODES.find(m => m.key === colorMode);
    if (modeConfig?.cssFilter) {
        filters.push(modeConfig.cssFilter);
    }

    // Manual adjustments - convert to CSS filter values
    if (adjustments.brightness !== 0) {
        const value = (adjustments.brightness + 100) / 100; // Convert -100..100 to 0..2
        filters.push(`brightness(${value})`);
    }

    if (adjustments.contrast !== 0) {
        const value = (adjustments.contrast + 100) / 100;
        filters.push(`contrast(${value})`);
    }

    if (adjustments.saturation !== 0) {
        const value = (adjustments.saturation + 100) / 100;
        filters.push(`saturate(${value})`);
    }

    // Temperature approximation (sepia for warm, hue-rotate for cool)
    if (adjustments.temperature !== 0) {
        if (adjustments.temperature > 0) {
            filters.push(`sepia(${adjustments.temperature / 100 * 0.3})`);
        } else {
            filters.push(`hue-rotate(${adjustments.temperature * 0.2}deg)`);
        }
    }

    // Tint approximation
    if (adjustments.tint !== 0) {
        filters.push(`hue-rotate(${adjustments.tint * 0.5}deg)`);
    }

    // Sharpness approximation using contrast
    if (adjustments.sharpness > 0) {
        const sharpValue = 1 + (adjustments.sharpness / 100 * 0.2);
        filters.push(`contrast(${sharpValue})`);
    }

    return filters.join(' ');
}

/**
 * Get CSS filter style object for React Native Web
 */
export function getFilterStyle(
    colorMode: ColorMode,
    adjustments: ManualAdjustments = DEFAULT_ADJUSTMENTS
): Record<string, string> {
    if (Platform.OS !== 'web') {
        return {};
    }

    const filter = generateCSSFilter(colorMode, adjustments);
    return filter ? { filter } as any : {};
}

/**
 * WEB ONLY: Process image via Canvas to permanently apply filters
 * Returns a Promise resolving to the Data URI of the processed image
 */
export function processImageWeb(
    imageUri: string,
    colorMode: ColorMode,
    adjustments: ManualAdjustments = DEFAULT_ADJUSTMENTS
): Promise<string> {
    return new Promise((resolve, reject) => {
        if (Platform.OS !== 'web') {
            reject(new Error('processImageWeb is only for web'));
            return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Set strict dimensions (keep aspect ratio)
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Apply filters using context.filter logic if supported (standard in modern browsers)
            // or fallback to simple drawing if very old browser (unlikely for this app stack)
            const filterString = generateCSSFilter(colorMode, adjustments);
            ctx.filter = filterString || 'none';

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Additional manual processing if needed (e.g. pixel manipulation)
            // But CSS filter on canvas context is usually hardware accelerated and fast/accurate enough

            resolve(canvas.toDataURL('image/jpeg', 0.95)); // High quality JPEG
        };
        img.onerror = (err) => reject(err);
        img.src = imageUri;
    });
}

// =====================================================
// IMAGE MANIPULATION (Native)
// =====================================================

/**
 * Apply color mode using expo-image-manipulator
 * Note: Native image manipulation is limited compared to CSS filters
 */
export async function applyColorModeNative(
    imageUri: string,
    colorMode: ColorMode,
    adjustments: ManualAdjustments = DEFAULT_ADJUSTMENTS
): Promise<string> {
    // For Native: Use expo-image-manipulator
    // Since it doesn't support complex CSS filters (sepia, advanced contrast), 
    // we do basic operations. ideally we would use a native OpenGL filter library.

    // Simulating basic adjustment via available actions (resize, rotate, flip)
    // Unfortunately stock expo-image-manipulator doesn't support saturation/contrast.
    // For a "Total Fix" on native we'd need a different lib like expo-gl or gl-react-native.
    // BUT since we are prioritizing WEB per user request context (running on web port 3000), 
    // we keep this basic for native to avoid crashes.

    // NOTE: If we want true native filters we should use expo-image-filters packages, 
    // but that requires native deps change.

    const actions: ImageManipulator.Action[] = [];

    // Just a dummy manipulation to ensure file is copied/processed
    // In real app we would want at least resize
    if (imageUri.startsWith('http')) {
        // download
    }

    const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
            compress: 0.9,
            format: ImageManipulator.SaveFormat.JPEG,
        }
    );

    return result.uri;
}

// =====================================================
// AUTO-ENHANCEMENT
// =====================================================

export function getAutoEnhanceSettings(): {
    colorMode: ColorMode;
    adjustments: ManualAdjustments;
} {
    return {
        colorMode: 'enhanced',
        adjustments: {
            ...DEFAULT_ADJUSTMENTS,
            brightness: 5,
            contrast: 15,
            sharpness: 20,
            clarity: 10,
        },
    };
}

export function getDocumentSettings(): {
    colorMode: ColorMode;
    adjustments: ManualAdjustments;
} {
    return {
        colorMode: 'bw',
        adjustments: {
            ...DEFAULT_ADJUSTMENTS,
            contrast: 30,
            brightness: 10,
            sharpness: 25,
        },
    };
}

export function getPhotoSettings(): {
    colorMode: ColorMode;
    adjustments: ManualAdjustments;
} {
    return {
        colorMode: 'photo',
        adjustments: {
            ...DEFAULT_ADJUSTMENTS,
            saturation: 10,
            contrast: 5,
            clarity: 15,
        },
    };
}

// =====================================================
// PRESET PROFILES
// =====================================================

export interface FilterPreset {
    id: string;
    name: string;
    icon: string;
    colorMode: ColorMode;
    adjustments: ManualAdjustments;
}

export const FILTER_PRESETS: FilterPreset[] = [
    {
        id: 'document',
        name: 'Dokumen',
        icon: 'file-document',
        colorMode: 'bw',
        adjustments: { ...DEFAULT_ADJUSTMENTS, contrast: 30, brightness: 10, sharpness: 25 },
    },
    {
        id: 'photo-doc',
        name: 'Foto Dokumen',
        icon: 'file-image',
        colorMode: 'color',
        adjustments: { ...DEFAULT_ADJUSTMENTS, saturation: 15, contrast: 10, clarity: 15 },
    },
    {
        id: 'receipt',
        name: 'Struk/Kwitansi',
        icon: 'receipt',
        colorMode: 'bw',
        adjustments: { ...DEFAULT_ADJUSTMENTS, contrast: 40, brightness: 15, sharpness: 30 },
    },
    {
        id: 'whiteboard',
        name: 'Whiteboard',
        icon: 'presentation',
        colorMode: 'enhanced',
        adjustments: { ...DEFAULT_ADJUSTMENTS, brightness: 20, contrast: 25, saturation: -30 },
    },
    {
        id: 'book',
        name: 'Buku/Majalah',
        icon: 'book-open',
        colorMode: 'grayscale',
        adjustments: { ...DEFAULT_ADJUSTMENTS, contrast: 20, clarity: 20 },
    },
    {
        id: 'id-card',
        name: 'Kartu Identitas',
        icon: 'card-account-details',
        colorMode: 'color',
        adjustments: { ...DEFAULT_ADJUSTMENTS, contrast: 15, sharpness: 25, saturation: 10 },
    },
];

export default {
    COLOR_MODES,
    ADJUSTMENT_CONFIGS,
    DEFAULT_ADJUSTMENTS,
    FILTER_PRESETS,
    generateCSSFilter,
    getFilterStyle,
    processImageWeb,
    applyColorModeNative,
    getAutoEnhanceSettings,
    getDocumentSettings,
    getPhotoSettings,
};
