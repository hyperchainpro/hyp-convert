/**
 * Cross-Platform File Utilities
 * Provides file operations that work on both web and native platforms
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Read file as string - works on web and native
 */
export const readAsStringAsync = async (uri: string): Promise<string> => {
    if (Platform.OS === 'web') {
        // Web implementation using fetch
        const response = await fetch(uri);
        return await response.text();
    } else {
        // Native implementation
        return await FileSystem.readAsStringAsync(uri);
    }
};

/**
 * Write string to file - works on web and native
 */
export const writeAsStringAsync = async (uri: string, content: string): Promise<string> => {
    if (Platform.OS === 'web') {
        // Web implementation using Blob
        const blob = new Blob([content], { type: 'text/plain' });
        return URL.createObjectURL(blob);
    } else {
        // Native implementation
        await FileSystem.writeAsStringAsync(uri, content);
        return uri;
    }
};

/**
 * Read file as base64 - works on web and native
 */
export const readAsBase64Async = async (uri: string): Promise<string> => {
    if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Remove data URL prefix to get pure base64
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } else {
        return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    }
};

/**
 * Get cache directory path
 */
export const getCacheDirectory = (): string => {
    if (Platform.OS === 'web') {
        // For web, we'll use blob URLs instead of file paths
        return 'blob://cache/';
    } else {
        return FileSystem.cacheDirectory || '';
    }
};

/**
 * Get document directory path
 */
export const getDocumentDirectory = (): string => {
    if (Platform.OS === 'web') {
        return 'blob://documents/';
    } else {
        return FileSystem.documentDirectory || '';
    }
};

/**
 * Create download link for web
 */
export const createDownloadLink = (blob: Blob, filename: string): string => {
    const url = URL.createObjectURL(blob);
    return url;
};

/**
 * Download file on web
 */
export const downloadFile = (uri: string, filename: string): void => {
    if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Read file from File object (web only)
 */
export const readFileAsync = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

/**
 * Read file as ArrayBuffer
 */
export const readAsArrayBufferAsync = async (uri: string): Promise<ArrayBuffer> => {
    if (Platform.OS === 'web') {
        const response = await fetch(uri);
        return await response.arrayBuffer();
    } else {
        // For native, read as base64 then convert to ArrayBuffer
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64
        });
        // Convert base64 to ArrayBuffer
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
};
