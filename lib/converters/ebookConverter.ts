/**
 * E-Book Converter Module
 * Handles: EPUB → Text/HTML/PDF
 * Uses JSZip to unpack EPUB (which is a ZIP container)
 * Parses container.xml → content.opf → spine to find reading order
 */

import JSZip from 'jszip';
import * as FileUtils from './fileUtils';
import { htmlToPDFAdvanced } from './advancedConverters';
import { Platform } from 'react-native';

// =========================================
// EPUB PARSING HELPERS
// =========================================

/**
 * Load ZIP data from URI
 */
const loadZipData = async (uri: string): Promise<JSZip> => {
    let zipData: any;
    if (Platform.OS === 'web') {
        const response = await fetch(uri);
        zipData = await response.arrayBuffer();
    } else {
        zipData = await FileUtils.readAsBase64Async(uri);
    }

    const loadOptions = Platform.OS === 'web' ? {} : { base64: true };
    return await JSZip.loadAsync(zipData, loadOptions);
};

/**
 * Find the content.opf file path from META-INF/container.xml
 */
const findContentOpfPath = async (zip: JSZip): Promise<string> => {
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) {
        // Fallback: search for .opf file directly
        const opfFile = Object.keys(zip.files).find(f => f.endsWith('.opf'));
        return opfFile || '';
    }

    const containerXml = await containerFile.async('string');
    // Extract rootfile full-path from container.xml
    const match = containerXml.match(/full-path="([^"]+)"/);
    return match ? match[1] : '';
};

/**
 * Parse content.opf to get spine reading order and manifest
 */
const parseContentOpf = async (zip: JSZip, opfPath: string): Promise<string[]> => {
    const opfFile = zip.file(opfPath);
    if (!opfFile) return [];

    const opfContent = await opfFile.async('string');
    const basePath = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

    // Parse manifest items (id -> href)
    const manifestItems: Record<string, string> = {};
    const manifestRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*\/?\s*>/gi;
    let match;
    while ((match = manifestRegex.exec(opfContent)) !== null) {
        manifestItems[match[1]] = basePath + match[2];
    }

    // Also try reversed attribute order
    const manifestRegex2 = /<item\s+[^>]*href="([^"]+)"[^>]*id="([^"]+)"[^>]*\/?\s*>/gi;
    while ((match = manifestRegex2.exec(opfContent)) !== null) {
        manifestItems[match[2]] = basePath + match[1];
    }

    // Parse spine (reading order)
    const spineItems: string[] = [];
    const spineRegex = /<itemref\s+[^>]*idref="([^"]+)"[^>]*\/?\s*>/gi;
    while ((match = spineRegex.exec(opfContent)) !== null) {
        const href = manifestItems[match[1]];
        if (href) {
            spineItems.push(href);
        }
    }

    // If spine parsing fails, fallback to all XHTML files in manifest
    if (spineItems.length === 0) {
        return Object.values(manifestItems).filter(href =>
            href.endsWith('.xhtml') || href.endsWith('.html') || href.endsWith('.htm')
        );
    }

    return spineItems;
};

/**
 * Strip HTML tags and clean up text
 */
const stripHtmlTags = (html: string): string => {
    let text = html;
    // Remove script and style
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    // Convert some block elements to line breaks
    text = text.replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    // Remove all remaining tags
    text = text.replace(/<[^>]+>/g, '');
    // Decode entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#039;/g, "'");
    // Clean whitespace
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    return text.trim();
};

// =========================================
// PUBLIC API
// =========================================

/**
 * Convert EPUB to HTML with proper reading order
 */
export const epubToHtml = async (epubUri: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        const zip = await loadZipData(epubUri);

        // Find content.opf path
        const opfPath = await findContentOpfPath(zip);

        // Get reading order
        let contentFiles: string[] = [];
        if (opfPath) {
            contentFiles = await parseContentOpf(zip, opfPath);
        }

        // Fallback: find all xhtml/html files
        if (contentFiles.length === 0) {
            contentFiles = Object.keys(zip.files).filter(f =>
                !f.startsWith('META-INF/') &&
                (f.endsWith('.xhtml') || f.endsWith('.html') || f.endsWith('.htm'))
            ).sort();
        }

        if (contentFiles.length === 0) {
            return { success: false, error: 'Tidak ada konten yang ditemukan di file EPUB' };
        }

        // Read and concatenate content in spine order
        let combinedHtml = '';
        for (const filePath of contentFiles) {
            const file = zip.file(filePath);
            if (file) {
                const content = await file.async('string');
                // Extract body content only
                const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                if (bodyMatch) {
                    combinedHtml += bodyMatch[1] + '\n<hr/>\n';
                } else {
                    combinedHtml += content + '\n<hr/>\n';
                }
            }
        }

        // Wrap in proper HTML
        const html = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>Converted EPUB</title>
                <style>
                    body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
                    h1, h2, h3 { color: #1a1a2e; }
                    p { margin: 0.8em 0; text-align: justify; }
                    hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
                    img { max-width: 100%; height: auto; }
                </style>
            </head>
            <body>
                ${combinedHtml}
            </body>
            </html>
        `;

        return { success: true, content: html };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Gagal mengkonversi EPUB' };
    }
};

/**
 * EPUB to plain Text with proper reading order
 */
export const epubToText = async (epubUri: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        const htmlResult = await epubToHtml(epubUri);
        if (!htmlResult.success || !htmlResult.content) {
            return htmlResult;
        }

        const text = stripHtmlTags(htmlResult.content);
        return { success: true, content: text };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Gagal mengkonversi EPUB ke Teks' };
    }
};

/**
 * Generic Ebook to PDF (via HTML extraction → PDF)
 */
export const ebookToPDF = async (uri: string, format: 'epub' | 'mobi' | 'azw3'): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        if (format !== 'epub') {
            return { success: false, error: `Konversi ${format.toUpperCase()} ke PDF belum didukung secara client-side. Silakan konversi ke EPUB terlebih dahulu.` };
        }

        const htmlResult = await epubToHtml(uri);
        if (!htmlResult.success || !htmlResult.content) {
            return { success: false, error: htmlResult.error || 'Konten EPUB kosong' };
        }

        return await htmlToPDFAdvanced(htmlResult.content);
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Gagal mengkonversi Ebook ke PDF' };
    }
};
