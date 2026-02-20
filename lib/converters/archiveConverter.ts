/**
 * Archive & Container Format Utilities
 * Handles reading/writing ZIP-based formats (EPUB, ODT, DOCX inner xml, etc.)
 * 
 * Uses JSZip with proper base64 loading for mobile platforms
 */

import JSZip from 'jszip';
import * as FileUtils from './fileUtils';
import { Platform } from 'react-native';

/**
 * Load a ZIP file from URI, returning a JSZip instance.
 * Handles the platform difference (web: ArrayBuffer, mobile: base64).
 */
export const loadZip = async (zipUri: string): Promise<JSZip> => {
    let zipData: any;
    let loadOptions: JSZip.JSZipLoadOptions = {};

    if (Platform.OS === 'web') {
        const response = await fetch(zipUri);
        zipData = await response.arrayBuffer();
    } else {
        // Mobile: read as base64, tell JSZip it's base64
        zipData = await FileUtils.readAsBase64Async(zipUri);
        loadOptions = { base64: true };
    }

    return await JSZip.loadAsync(zipData, loadOptions);
};

/**
 * Reads a specific file inside a ZIP archive (e.g., getting content.xml from an ODT)
 */
export const readFileInZip = async (zipUri: string, innerFilename: string): Promise<string> => {
    try {
        const zip = await loadZip(zipUri);

        // Try exact match first
        let file = zip.file(innerFilename);

        if (!file) {
            // Try case-insensitive search
            const lowerTarget = innerFilename.toLowerCase();
            const found = Object.keys(zip.files).find(key => key.toLowerCase() === lowerTarget);
            if (found) {
                file = zip.file(found);
            }
        }

        if (!file) {
            // Try partial match
            const found = Object.keys(zip.files).find(key => key.includes(innerFilename));
            if (found) {
                file = zip.file(found);
            }
        }

        if (!file) {
            throw new Error(`File '${innerFilename}' not found in archive. Available: ${Object.keys(zip.files).slice(0, 10).join(', ')}`);
        }

        return await file.async('string');
    } catch (e) {
        throw new Error(`Failed to read zip content: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
};

/**
 * List all files inside a ZIP archive
 */
export const listZipContents = async (zipUri: string): Promise<{ name: string; dir: boolean; size: number }[]> => {
    try {
        const zip = await loadZip(zipUri);
        const entries: { name: string; dir: boolean; size: number }[] = [];

        zip.forEach((relativePath, zipEntry) => {
            entries.push({
                name: relativePath,
                dir: zipEntry.dir,
                size: 0, // JSZip doesn't expose individual entry sizes directly
            });
        });

        return entries;
    } catch (e) {
        throw new Error(`Failed to list zip contents: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
};

/**
 * Extracts text content from matching files in a ZIP archive.
 * For XML/HTML files, it strips tags to get plain text.
 * For text files, returns content directly.
 */
export const extractTextFromZip = async (
    zipUri: string,
    extensions: string[] = ['xml', 'html', 'xhtml', 'txt']
): Promise<string> => {
    try {
        const zip = await loadZip(zipUri);
        let combinedText = '';

        // Sort files for consistent ordering
        const fileNames = Object.keys(zip.files).sort();

        for (const relativePath of fileNames) {
            const file = zip.files[relativePath];
            if (file.dir) continue;

            const ext = relativePath.split('.').pop()?.toLowerCase();
            if (ext && extensions.includes(ext)) {
                const text = await file.async('string');

                let cleanText: string;
                if (ext === 'txt') {
                    cleanText = text.trim();
                } else {
                    // Strip XML/HTML tags more carefully
                    cleanText = text
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                        .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n')
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]+>/g, '')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/[ \t]+/g, ' ')
                        .replace(/\n\s*\n\s*\n/g, '\n\n')
                        .trim();
                }

                if (cleanText) {
                    combinedText += `\n\n--- [${relativePath}] ---\n\n${cleanText}`;
                }
            }
        }

        return combinedText.trim();
    } catch (e) {
        throw new Error(`Extraction failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
};

/**
 * Create a ZIP file from a map of filename → content
 */
export const createZip = async (
    files: Record<string, string | Uint8Array>
): Promise<string> => {
    try {
        const zip = new JSZip();

        for (const [filename, content] of Object.entries(files)) {
            if (typeof content === 'string') {
                zip.file(filename, content);
            } else {
                zip.file(filename, content, { binary: true });
            }
        }

        if (Platform.OS === 'web') {
            const blob = await zip.generateAsync({ type: 'blob' });
            return URL.createObjectURL(blob);
        } else {
            const base64 = await zip.generateAsync({ type: 'base64' });
            return await FileUtils.writeAsStringAsync(
                `${FileUtils.getCacheDirectory()}archive.zip`,
                base64,
                { encoding: 'base64' }
            );
        }
    } catch (e) {
        throw new Error(`ZIP creation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
};
