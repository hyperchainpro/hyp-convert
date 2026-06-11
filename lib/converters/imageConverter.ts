/**
 * Enhanced Image Converter using Pica
 * High-quality image resizing and format conversion
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Conditional import for web-only library
let Pica: any = null;
let pica: any = null;

if (Platform.OS === 'web') {
    Pica = require('pica');
    pica = Pica();
}

interface ImageConversionOptions {
    quality?: number; // 0.1 - 1.0
    maxWidth?: number;
    maxHeight?: number;
    format?: 'png' | 'jpg' | 'jpeg' | 'webp';
    preserveExif?: boolean;
}

/**
 * Convert image to different format with high quality
 * Uses pica for web, expo-image-manipulator for mobile
 */
export const convertImageFormat = async (
    sourceUri: string,
    targetFormat: 'png' | 'jpg' | 'jpeg' | 'webp',
    options: ImageConversionOptions = {}
): Promise<{ uri: string; size: number }> => {
    const {
        quality = 0.92, // High quality by default
        maxWidth,
        maxHeight,
    } = options;

    try {
        if (Platform.OS === 'web') {
            return await convertImageWeb(sourceUri, targetFormat, quality, maxWidth, maxHeight);
        } else {
            return await convertImageMobile(sourceUri, targetFormat, quality, maxWidth, maxHeight);
        }
    } catch (error) {
        console.error('Image conversion error:', error);
        throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Web-based conversion using Pica for superior quality
 */
const convertImageWeb = async (
    sourceUri: string,
    targetFormat: string,
    quality: number,
    maxWidth?: number,
    maxHeight?: number
): Promise<{ uri: string; size: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
            try {
                const canvas = document.createElement('canvas');

                // Calculate dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (maxWidth && width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (maxHeight && height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                // Use pica for high-quality resize
                const resizedCanvas = await pica.resize(img, canvas, {
                    quality: 3, // Highest quality (0-3)
                    alpha: true,
                    unsharpAmount: 80, // Slight sharpen
                    unsharpRadius: 0.6,
                    unsharpThreshold: 2,
                });

                // Convert to target format
                const mimeType = targetFormat === 'png' ? 'image/png' :
                    targetFormat === 'webp' ? 'image/webp' :
                        'image/jpeg';

                const blob = await pica.toBlob(resizedCanvas, mimeType, quality);
                const uri = URL.createObjectURL(blob);

                resolve({
                    uri,
                    size: blob.size,
                });
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = sourceUri;
    });
};

/**
 * Mobile-based conversion using expo-image-manipulator
 */
const convertImageMobile = async (
    sourceUri: string,
    targetFormat: string,
    quality: number,
    maxWidth?: number,
    maxHeight?: number
): Promise<{ uri: string; size: number }> => {
    const format = targetFormat === 'png' ? ImageManipulator.SaveFormat.PNG :
        targetFormat === 'webp' ? ImageManipulator.SaveFormat.WEBP :
            ImageManipulator.SaveFormat.JPEG;

    const actions: ImageManipulator.Action[] = [];

    // Add resize if needed
    if (maxWidth || maxHeight) {
        actions.push({
            resize: {
                width: maxWidth,
                height: maxHeight,
            },
        });
    }

    const result = await ImageManipulator.manipulateAsync(
        sourceUri,
        actions,
        {
            compress: quality,
            format,
        }
    );

    const fileInfo = await FileSystem.getInfoAsync(result.uri);

    return {
        uri: result.uri,
        size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
    };
};

/**
 * Convert image to PDF with high quality
 */
export const imageToPDF = async (
    imageUri: string,
    options: {
        title?: string;
        pageSize?: 'A4' | 'Letter';
        quality?: number;
    } = {}
): Promise<string> => {
    const { title = 'Converted Image', pageSize = 'A4' } = options;

    try {
        // Dynamically import pdf-lib
        const { PDFDocument, PageSizes } = await import('pdf-lib/es/index.js');

        // Create new PDF
        const pdfDoc = await PDFDocument.create();
        const pageDimensions = pageSize === 'Letter' ? PageSizes.Letter : PageSizes.A4;
        const page = pdfDoc.addPage(pageDimensions);

        // Read image file
        let imageBytes: ArrayBuffer;
        if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            imageBytes = await response.arrayBuffer();
        } else {
            // Expo: read as base64
            const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            imageBytes = bytes.buffer;
        }

        // Embed image (Try JPG then PNG, or convert if needed)
        let image;
        try {
            // First try treating as JPG
            try {
                image = await pdfDoc.embedJpg(imageBytes);
            } catch (e) {
                // If not JPG, try PNG
                image = await pdfDoc.embedPng(imageBytes);
            }
        } catch (e) {
            // If both fail, it might be a format not directly supported by pdf-lib (BMP, WebP, etc.)
            // We convert it to PNG first using our own converter
            try {
                const { uri: pngUri } = await convertImageFormat(imageUri, 'png', { quality: 1.0 });

                // Read the converted PNG
                let pngBytes: ArrayBuffer;
                if (Platform.OS === 'web') {
                    const response = await fetch(pngUri);
                    pngBytes = await response.arrayBuffer();
                } else {
                    const base64 = await FileSystem.readAsStringAsync(pngUri, { encoding: FileSystem.EncodingType.Base64 });
                    const binaryString = atob(base64);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    pngBytes = bytes.buffer;
                }

                // Now embed the converted PNG
                image = await pdfDoc.embedPng(pngBytes);
            } catch (conversionError) {
                console.error('Image fallback conversion failed:', conversionError);
                throw new Error("Could not embed image (unsupported format and conversion failed)");
            }
        }

        // Calculate scaling
        const { width, height } = image.scale(1);
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        const margin = 50;

        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);

        const scale = Math.min(availableWidth / width, availableHeight / height, 1);
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Draw image
        page.drawImage(image, {
            x: (pageWidth - scaledWidth) / 2,
            y: (pageHeight - scaledHeight) / 2,
            width: scaledWidth,
            height: scaledHeight,
        });

        // Save
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        return URL.createObjectURL(blob);

    } catch (error) {
        throw new Error(`PDF creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Batch convert multiple images
 */
export const batchConvertImages = async (
    imageUris: string[],
    targetFormat: 'png' | 'jpg' | 'jpeg' | 'webp',
    options: ImageConversionOptions = {},
    onProgress?: (progress: number) => void
): Promise<Array<{ uri: string; size: number; originalUri: string }>> => {
    const results: Array<{ uri: string; size: number; originalUri: string }> = [];

    for (let i = 0; i < imageUris.length; i++) {
        const result = await convertImageFormat(imageUris[i], targetFormat, options);
        results.push({
            ...result,
            originalUri: imageUris[i],
        });

        if (onProgress) {
            onProgress((i + 1) / imageUris.length);
        }
    }

    return results;
};

/**
 * Optimize image (reduce file size while maintaining quality)
 */
export const optimizeImage = async (
    sourceUri: string,
    targetSizeKB?: number
): Promise<{ uri: string; size: number; compressionRatio: number }> => {
    // Binary search for optimal quality
    let minQuality = 0.5;
    let maxQuality = 0.95;
    let bestResult: { uri: string; size: number } | null = null;
    const targetSize = targetSizeKB ? targetSizeKB * 1024 : undefined;

    // If no target size, just use high quality
    if (!targetSize) {
        const result = await convertImageFormat(sourceUri, 'jpg', { quality: 0.85 });
        const originalInfo = Platform.OS === 'web'
            ? { size: 0 }
            : await FileSystem.getInfoAsync(sourceUri);
        const originalSize = originalInfo && 'size' in originalInfo ? originalInfo.size : result.size;

        return {
            ...result,
            compressionRatio: originalSize > 0 ? result.size / originalSize : 1,
        };
    }

    // Binary search for target size
    for (let i = 0; i < 5; i++) {
        const quality = (minQuality + maxQuality) / 2;
        const result = await convertImageFormat(sourceUri, 'jpg', { quality });

        if (result.size <= targetSize) {
            bestResult = result;
            minQuality = quality; // Try higher quality
        } else {
            maxQuality = quality; // Need lower quality
        }
    }

    if (!bestResult) {
        // Fallback to lowest quality
        bestResult = await convertImageFormat(sourceUri, 'jpg', { quality: minQuality });
    }

    const originalInfo = Platform.OS === 'web'
        ? { size: 0 }
        : await FileSystem.getInfoAsync(sourceUri);
    const originalSize = originalInfo && 'size' in originalInfo ? originalInfo.size : bestResult.size;

    return {
        ...bestResult,
        compressionRatio: originalSize > 0 ? bestResult.size / originalSize : 1,
    };
};
