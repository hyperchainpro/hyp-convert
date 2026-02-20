/**
 * OCR Converter Module using Tesseract.js
 * Optimized with worker caching and progress reporting
 */

import { Platform } from 'react-native';

export interface OCROptions {
    language?: string; // 'eng', 'ind', 'jpn', etc.
    logger?: (m: any) => void;
    onProgress?: (progress: number) => void;
}

interface OCRResult {
    success: boolean;
    content?: string;
    confidence?: number;
    error?: string;
}

// Worker cache for performance
let cachedWorker: any = null;
let cachedLanguage: string = '';

/**
 * Get or create a cached Tesseract worker
 */
const getWorker = async (language: string, logger?: (m: any) => void): Promise<any> => {
    const Tesseract = await import('tesseract.js');

    // Reuse worker if language matches
    if (cachedWorker && cachedLanguage === language) {
        return cachedWorker;
    }

    // Terminate old worker if exists
    if (cachedWorker) {
        try {
            await cachedWorker.terminate();
        } catch (e) {
            // Ignore termination errors
        }
    }

    // Create new worker
    const worker = await Tesseract.createWorker(language, 1, {
        logger: logger || ((m: any) => {
            if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
        }),
    });

    cachedWorker = worker;
    cachedLanguage = language;

    return worker;
};

/**
 * Perform OCR on an image
 * Uses worker caching for better performance on repeated calls
 */
export const performOCR = async (imageUri: string, options: OCROptions = {}): Promise<string> => {
    try {
        if (Platform.OS !== 'web') {
            console.warn('Tesseract.js dioptimalkan untuk Web. Performa di mobile mungkin bervariasi.');
        }

        const lang = options.language || 'eng';

        // Create a progress-aware logger
        const logger = (m: any) => {
            if (options.onProgress && m.status === 'recognizing text') {
                options.onProgress(m.progress);
            }
            if (options.logger) {
                options.logger(m);
            }
        };

        const worker = await getWorker(lang, logger);

        const result = await worker.recognize(imageUri);

        if (!result.data.text.trim()) {
            return '[Tidak ada teks yang terdeteksi pada gambar ini. Pastikan gambar jelas dan beresolusi cukup tinggi.]';
        }

        return result.data.text;
    } catch (error) {
        console.error('OCR Failed:', error);
        throw new Error(`OCR gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Image to Text (OCR) wrapper with confidence info
 */
export const imageToText = async (imageUri: string, options: OCROptions = {}): Promise<OCRResult> => {
    try {
        const Tesseract = await import('tesseract.js');
        const lang = options.language || 'eng';

        const worker = await getWorker(lang, options.logger);
        const result = await worker.recognize(imageUri);

        const text = result.data.text.trim();

        if (!text) {
            return {
                success: true,
                content: '[Tidak ada teks yang terdeteksi pada gambar ini.]',
                confidence: 0,
            };
        }

        return {
            success: true,
            content: text,
            confidence: result.data.confidence,
        };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'OCR gagal' };
    }
};

/**
 * Batch OCR - process multiple images
 */
export const batchOCR = async (
    imageUris: string[],
    options: OCROptions = {},
    onItemProgress?: (index: number, total: number) => void
): Promise<OCRResult[]> => {
    const results: OCRResult[] = [];

    for (let i = 0; i < imageUris.length; i++) {
        if (onItemProgress) {
            onItemProgress(i, imageUris.length);
        }

        const result = await imageToText(imageUris[i], options);
        results.push(result);
    }

    return results;
};

/**
 * Cleanup: Terminate the cached worker
 * Call this when the user navigates away or the component unmounts
 */
export const terminateOCRWorker = async (): Promise<void> => {
    if (cachedWorker) {
        try {
            await cachedWorker.terminate();
        } catch (e) {
            // Ignore
        }
        cachedWorker = null;
        cachedLanguage = '';
    }
};

/**
 * Get supported OCR languages
 */
export const getSupportedLanguages = (): { code: string; name: string }[] => {
    return [
        { code: 'eng', name: 'English' },
        { code: 'ind', name: 'Indonesian' },
        { code: 'jpn', name: 'Japanese' },
        { code: 'chi_sim', name: 'Chinese (Simplified)' },
        { code: 'chi_tra', name: 'Chinese (Traditional)' },
        { code: 'kor', name: 'Korean' },
        { code: 'ara', name: 'Arabic' },
        { code: 'hin', name: 'Hindi' },
        { code: 'tha', name: 'Thai' },
        { code: 'vie', name: 'Vietnamese' },
        { code: 'fra', name: 'French' },
        { code: 'deu', name: 'German' },
        { code: 'spa', name: 'Spanish' },
        { code: 'por', name: 'Portuguese' },
        { code: 'ita', name: 'Italian' },
        { code: 'rus', name: 'Russian' },
        { code: 'nld', name: 'Dutch' },
        { code: 'pol', name: 'Polish' },
        { code: 'tur', name: 'Turkish' },
        { code: 'msa', name: 'Malay' },
    ];
};
