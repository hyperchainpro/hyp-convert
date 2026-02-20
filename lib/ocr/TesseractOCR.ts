/**
 * Tesseract.js OCR Engine
 * Provides 100% offline text recognition with 50+ language support
 */

import { Platform } from 'react-native';

// =====================================================
// TYPES
// =====================================================

export interface OCRResult {
    text: string;
    confidence: number;
    blocks: TextBlock[];
    language: string;
    processingTime: number;
}

export interface TextBlock {
    text: string;
    confidence: number;
    bbox: BoundingBox;
    lines: TextLine[];
}

export interface TextLine {
    text: string;
    confidence: number;
    bbox: BoundingBox;
    words: TextWord[];
}

export interface TextWord {
    text: string;
    confidence: number;
    bbox: BoundingBox;
}

export interface BoundingBox {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export interface OCRProgress {
    status: string;
    progress: number;
}

// =====================================================
// SUPPORTED LANGUAGES
// =====================================================

export const OCR_LANGUAGES = [
    { code: 'eng', name: 'English', nativeName: 'English' },
    { code: 'ind', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'chi_sim', name: 'Chinese Simplified', nativeName: '简体中文' },
    { code: 'chi_tra', name: 'Chinese Traditional', nativeName: '繁體中文' },
    { code: 'jpn', name: 'Japanese', nativeName: '日本語' },
    { code: 'kor', name: 'Korean', nativeName: '한국어' },
    { code: 'ara', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hin', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'tha', name: 'Thai', nativeName: 'ไทย' },
    { code: 'vie', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'msa', name: 'Malay', nativeName: 'Bahasa Melayu' },
    { code: 'fra', name: 'French', nativeName: 'Français' },
    { code: 'deu', name: 'German', nativeName: 'Deutsch' },
    { code: 'spa', name: 'Spanish', nativeName: 'Español' },
    { code: 'ita', name: 'Italian', nativeName: 'Italiano' },
    { code: 'por', name: 'Portuguese', nativeName: 'Português' },
    { code: 'rus', name: 'Russian', nativeName: 'Русский' },
    { code: 'nld', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'pol', name: 'Polish', nativeName: 'Polski' },
    { code: 'tur', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'ukr', name: 'Ukrainian', nativeName: 'Українська' },
    { code: 'ces', name: 'Czech', nativeName: 'Čeština' },
    { code: 'ell', name: 'Greek', nativeName: 'Ελληνικά' },
    { code: 'heb', name: 'Hebrew', nativeName: 'עברית' },
    { code: 'swe', name: 'Swedish', nativeName: 'Svenska' },
    { code: 'dan', name: 'Danish', nativeName: 'Dansk' },
    { code: 'fin', name: 'Finnish', nativeName: 'Suomi' },
    { code: 'nor', name: 'Norwegian', nativeName: 'Norsk' },
    { code: 'hun', name: 'Hungarian', nativeName: 'Magyar' },
    { code: 'ron', name: 'Romanian', nativeName: 'Română' },
    { code: 'bul', name: 'Bulgarian', nativeName: 'Български' },
    { code: 'hrv', name: 'Croatian', nativeName: 'Hrvatski' },
    { code: 'slk', name: 'Slovak', nativeName: 'Slovenčina' },
    { code: 'slv', name: 'Slovenian', nativeName: 'Slovenščina' },
    { code: 'srp', name: 'Serbian', nativeName: 'Српски' },
    { code: 'cat', name: 'Catalan', nativeName: 'Català' },
    { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
    { code: 'lit', name: 'Lithuanian', nativeName: 'Lietuvių' },
    { code: 'lav', name: 'Latvian', nativeName: 'Latviešu' },
    { code: 'est', name: 'Estonian', nativeName: 'Eesti' },
    { code: 'ben', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'tam', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'tel', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'mal', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'kan', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'guj', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'mar', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'pan', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'mya', name: 'Myanmar', nativeName: 'မြန်မာ' },
    { code: 'khm', name: 'Khmer', nativeName: 'ភាសាខ្មែរ' },
];

// =====================================================
// OCR ENGINE CLASS
// =====================================================

class TesseractOCR {
    private worker: any = null;
    private isInitialized: boolean = false;
    private currentLanguage: string = 'eng';
    private onProgress: ((progress: OCRProgress) => void) | null = null;

    /**
     * Initialize the OCR worker
     */
    async initialize(language: string = 'eng'): Promise<void> {
        if (Platform.OS !== 'web') {
            console.warn('Tesseract.js OCR is optimized for web. Limited support on native.');
            return;
        }

        try {
            // Dynamic import for web only
            const Tesseract = await import('tesseract.js');

            this.worker = await Tesseract.createWorker(language, 1, {
                logger: (m: any) => {
                    if (this.onProgress && m.status) {
                        this.onProgress({
                            status: m.status,
                            progress: m.progress || 0,
                        });
                    }
                },
            });

            this.currentLanguage = language;
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Tesseract:', error);
            throw new Error('OCR initialization failed');
        }
    }

    /**
     * Change the recognition language
     */
    async setLanguage(language: string): Promise<void> {
        if (!this.isInitialized || !this.worker) {
            await this.initialize(language);
            return;
        }

        if (language !== this.currentLanguage) {
            await this.worker.reinitialize(language);
            this.currentLanguage = language;
        }
    }

    /**
     * Set progress callback
     */
    setProgressCallback(callback: (progress: OCRProgress) => void): void {
        this.onProgress = callback;
    }

    /**
     * Recognize text in an image
     */
    async recognizeText(imageUri: string, language?: string): Promise<OCRResult> {
        const startTime = Date.now();

        if (!this.isInitialized) {
            await this.initialize(language || 'eng');
        }

        if (language && language !== this.currentLanguage) {
            await this.setLanguage(language);
        }

        if (!this.worker) {
            throw new Error('OCR worker not initialized');
        }

        try {
            const result = await this.worker.recognize(imageUri);
            const data = result.data;

            // Convert Tesseract result to our format
            const blocks: TextBlock[] = data.blocks?.map((block: any) => ({
                text: block.text,
                confidence: block.confidence,
                bbox: {
                    x0: block.bbox.x0,
                    y0: block.bbox.y0,
                    x1: block.bbox.x1,
                    y1: block.bbox.y1,
                },
                lines: block.lines?.map((line: any) => ({
                    text: line.text,
                    confidence: line.confidence,
                    bbox: {
                        x0: line.bbox.x0,
                        y0: line.bbox.y0,
                        x1: line.bbox.x1,
                        y1: line.bbox.y1,
                    },
                    words: line.words?.map((word: any) => ({
                        text: word.text,
                        confidence: word.confidence,
                        bbox: {
                            x0: word.bbox.x0,
                            y0: word.bbox.y0,
                            x1: word.bbox.x1,
                            y1: word.bbox.y1,
                        },
                    })) || [],
                })) || [],
            })) || [];

            return {
                text: data.text,
                confidence: data.confidence,
                blocks,
                language: this.currentLanguage,
                processingTime: Date.now() - startTime,
            };
        } catch (error) {
            console.error('OCR recognition failed:', error);
            throw new Error('Text recognition failed');
        }
    }

    /**
     * Recognize text from multiple images
     */
    async recognizeMultiple(imageUris: string[], language?: string): Promise<OCRResult[]> {
        const results: OCRResult[] = [];

        for (const uri of imageUris) {
            const result = await this.recognizeText(uri, language);
            results.push(result);
        }

        return results;
    }

    /**
     * Detect the language of text in an image
     */
    async detectLanguage(imageUri: string): Promise<string> {
        // For simplicity, we'll try English first and return based on confidence
        // A more sophisticated approach would use a separate language detection model
        if (!this.isInitialized) {
            await this.initialize('eng');
        }

        try {
            const result = await this.recognizeText(imageUri, 'eng');

            // Simple heuristic: if confidence is low, might be a different language
            // In production, you'd use a proper language detection algorithm
            if (result.confidence < 50) {
                return 'unknown';
            }

            return 'eng';
        } catch {
            return 'unknown';
        }
    }

    /**
     * Terminate the worker
     */
    async terminate(): Promise<void> {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isInitialized = false;
        }
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return OCR_LANGUAGES;
    }

    /**
     * Check if initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const ocrEngine = new TesseractOCR();

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Format OCR result as plain text
 */
export function formatOCRText(result: OCRResult): string {
    return result.text.trim();
}

/**
 * Format OCR result with line breaks preserved
 */
export function formatOCRWithLines(result: OCRResult): string {
    return result.blocks
        .map(block => block.lines.map(line => line.text).join('\n'))
        .join('\n\n');
}

/**
 * Search for text in OCR result
 */
export function searchInOCR(result: OCRResult, query: string): TextWord[] {
    const lowerQuery = query.toLowerCase();
    const matches: TextWord[] = [];

    for (const block of result.blocks) {
        for (const line of block.lines) {
            for (const word of line.words) {
                if (word.text.toLowerCase().includes(lowerQuery)) {
                    matches.push(word);
                }
            }
        }
    }

    return matches;
}

/**
 * Extract numbers from OCR result (useful for receipts)
 */
export function extractNumbers(result: OCRResult): string[] {
    const numberPattern = /[\d.,]+/g;
    const matches = result.text.match(numberPattern) || [];
    return matches.filter(m => m.length > 0);
}

/**
 * Extract email addresses from OCR result
 */
export function extractEmails(result: OCRResult): string[] {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = result.text.match(emailPattern) || [];
    return matches;
}

/**
 * Extract phone numbers from OCR result
 */
export function extractPhoneNumbers(result: OCRResult): string[] {
    const phonePattern = /(?:\+\d{1,3}\s?)?(?:\(\d{1,4}\)\s?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    const matches = result.text.match(phonePattern) || [];
    return matches.filter(m => m.replace(/\D/g, '').length >= 7);
}

/**
 * Extract URLs from OCR result
 */
export function extractURLs(result: OCRResult): string[] {
    const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
    const matches = result.text.match(urlPattern) || [];
    return matches;
}

/**
 * Calculate average confidence of OCR result
 */
export function getAverageConfidence(result: OCRResult): number {
    if (result.blocks.length === 0) return 0;

    const totalConfidence = result.blocks.reduce((sum, block) => sum + block.confidence, 0);
    return totalConfidence / result.blocks.length;
}

export default ocrEngine;
