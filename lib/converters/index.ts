/**
 * Master File Converter Router
 * Orchestrates conversions across specialized modules
 */

import { Platform } from 'react-native';
import * as FileUtils from './fileUtils';

// Import Sub-Modules
import { convertImageFormat, imageToPDF } from './imageConverter';
import {
    textToPDFAdvanced, htmlToPDFAdvanced,
    docxToHTML, docxToText, textToDOCX,
    xlsxToCSV, xlsxToJSON, xlsxToHTML, csvToXLSX, jsonToXLSX,
    csvToJSONAdvanced, jsonToCSVAdvanced,
    markdownToHTMLAdvanced, htmlToMarkdown,
    xmlToJSONAdvanced, jsonToXML
} from './advancedConverters';
import {
    docxToHtmlEnhanced, docxToTextEnhanced,
    markdownToHTMLEnhanced, htmlToMarkdownEnhanced,
    textToHTMLEnhanced, htmlToTextEnhanced
} from './documentConverter';
import { convertScientificData } from './scientificConverter';
import { epubToHtml, epubToText, ebookToPDF } from './ebookConverter';
import { textToPPTX, pptxToText, markdownToPPTX } from './presentationConverter';
import { svgToHtml, svgToImage, svgToPdf } from './vectorConverter';
import { extractTextFromZip, listZipContents, createZip } from './archiveConverter';
import { pdfToText, protectPDF, addWatermark, markdownToPDF } from './pdfConverter';
import { tsvToCsv, csvToTsv, iniToJson, logToJson, srtToJson } from './dataConverter';
import { imageToText, batchOCR, terminateOCRWorker, getSupportedLanguages } from './ocrConverter';

// =========================================
// TYPES
// =========================================

export interface ConversionResult {
    uri?: string;
    content?: string;
    success: boolean;
    error?: string;
}

// =========================================
// MAIN ROUTER
// =========================================

export const convertFile = async (
    sourceUri: string,
    sourceFormat: string,
    targetFormat: string,
    options: any = {}
): Promise<ConversionResult> => {
    try {
        const from = sourceFormat.toLowerCase();
        const to = targetFormat.toLowerCase();

        console.log(`[Router] Converting: ${from} → ${to}`);

        // ==================================================
        // 1. IMAGE & DESIGN
        // ==================================================
        const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'heic', 'ico', 'tiff', 'svg'];

        if (imageFormats.includes(from)) {
            // SVG Special Case
            if (from === 'svg') {
                if (to === 'html') {
                    const result = await svgToHtml(sourceUri);
                    if (result.success && result.content) {
                        const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.html`, result.content);
                        return { ...result, uri: outputUri };
                    }
                    return result;
                }
                // SVG to PDF
                if (to === 'pdf') {
                    return await svgToPdf(sourceUri);
                }
                // SVG to PNG/JPG/WebP via Canvas
                if (to === 'png' || to === 'jpg' || to === 'jpeg' || to === 'webp') {
                    return await svgToImage(sourceUri, to as any, options);
                }
            }

            // Standard Image -> Image
            if (['jpg', 'jpeg', 'png', 'webp'].includes(to)) {
                const result = await convertImageFormat(sourceUri, to as any, options);
                return { uri: result.uri, success: true };
            }
            // Image -> PDF
            if (to === 'pdf') {
                try {
                    const pdfUri = await imageToPDF(sourceUri, options);
                    return { uri: pdfUri, success: true };
                } catch (e) {
                    throw new Error("Image to PDF failed: " + (e instanceof Error ? e.message : String(e)));
                }
            }

            // Image -> Text (OCR)
            if (to === 'txt') {
                const result = await imageToText(sourceUri, options);
                if (result.success && result.content) {
                    const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.txt`, result.content);
                    return { ...result, uri: outputUri };
                }
                return result;
            }
        }


        // ==================================================
        // 2. DOCUMENTS (WORD, PDF, TXT, MD)
        // ==================================================
        const docFormats = ['docx', 'docm', 'dotx', 'txt', 'text', 'html', 'htm', 'md', 'markdown', 'rtf'];

        if (docFormats.includes(from)) {
            // DOCX Family
            if (['docx', 'docm', 'dotx'].includes(from)) {
                if (to === 'html' || to === 'htm') {
                    const content = await docxToHtmlEnhanced(sourceUri);
                    const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.html`, content);
                    return { content, uri: outputUri, success: true };
                }
                if (to === 'txt') {
                    const content = await docxToTextEnhanced(sourceUri);
                    const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.txt`, content);
                    return { content, uri: outputUri, success: true };
                }
                if (to === 'pdf') {
                    // Fallback: Docx -> Html -> Pdf
                    const html = await docxToHtmlEnhanced(sourceUri);
                    return await htmlToPDFAdvanced(html);
                }
            }

            // Text/MD/HTML Family
            if (from === 'txt' || from === 'text') {
                const textContent = await FileUtils.readAsStringAsync(sourceUri);
                if (to === 'pdf') return await textToPDFAdvanced(textContent);
                if (to === 'html') {
                    const content = textToHTMLEnhanced(textContent);
                    const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.html`, content);
                    return { content, uri: outputUri, success: true };
                }
                if (to === 'docx') return await textToDOCX(textContent);
                if (to === 'pptx') return await textToPPTX(textContent);
            }

            if (from === 'html' || from === 'htm') {
                const htmlContent = await FileUtils.readAsStringAsync(sourceUri);
                if (to === 'pdf') return await htmlToPDFAdvanced(htmlContent);
                if (to === 'txt') {
                    const content = htmlToTextEnhanced(htmlContent);
                    const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.txt`, content);
                    return { content, uri: outputUri, success: true };
                }
                if (to === 'md' || to === 'markdown') {
                    const content = htmlToMarkdownEnhanced(htmlContent);
                    const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.md`, content);
                    return { content, uri: outputUri, success: true };
                }
            }

            if (from === 'md' || from === 'markdown') {
                const mdContent = await FileUtils.readAsStringAsync(sourceUri);
                if (to === 'html') {
                    const content = markdownToHTMLEnhanced(mdContent);
                    const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.html`, content);
                    return { content, uri: outputUri, success: true };
                }
                if (to === 'pdf') {
                    const html = markdownToHTMLEnhanced(mdContent);
                    return await htmlToPDFAdvanced(html);
                }
            }
        }

        // ==================================================
        // 2b. PDF HANDLING
        // ==================================================
        if (from === 'pdf') {
            // PDF -> Text
            if (to === 'txt') {
                const result = await pdfToText(sourceUri);
                if (result.success && result.text) {
                    const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.txt`, result.text);
                    return { ...result, uri: outputUri, content: result.text };
                }
                return { success: false, error: result.error || 'PDF extraction failed' };
            }

            // PDF -> PDF (Security/Watermark)
            if (to === 'pdf') {
                if (options.password) {
                    return await protectPDF(sourceUri, options.password);
                }
                if (options.watermark) {
                    return await addWatermark(sourceUri, options.watermark);
                }
                // If no options, just copy?
                return { success: true, uri: sourceUri };
            }
        }

        // ==================================================
        // 3. SPREADSHEETS (EXCEL, CSV, ODS)
        // ==================================================
        if (['xlsx', 'xlsm', 'xlsb', 'csv', 'ods'].includes(from)) {
            // XLSX Family (xlsm, xlsb handled by xlsx lib usually)
            if (['xlsx', 'xlsm', 'xlsb'].includes(from)) {
                if (to === 'csv') return await xlsxToCSV(sourceUri);
                if (to === 'json') return await xlsxToJSON(sourceUri);
                if (to === 'html') return await xlsxToHTML(sourceUri);
            }

            if (from === 'csv') {
                const csvContent = await FileUtils.readAsStringAsync(sourceUri);
                if (to === 'xlsx') return await csvToXLSX(csvContent);
                if (to === 'json') return await csvToJSONAdvanced(csvContent);
                if (to === 'sql') return await convertScientificData(sourceUri, 'csv', 'sql', options);
            }
        }

        // ==================================================
        // 4. PRESENTATION (PPTX)
        // ==================================================
        if (from === 'pptx') {
            if (to === 'txt') {
                const result = await pptxToText(sourceUri);
                if (result.success && result.content) {
                    const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.txt`, result.content);
                    return { ...result, uri: outputUri };
                }
                return result;
            }
        }

        // ==================================================
        // 5. DATA & SCIENTIFIC
        // ==================================================
        // Group all data formats
        const dataFormats = ['json', 'yaml', 'yml', 'toml', 'xml', 'sql'];
        if (dataFormats.includes(from)) {
            const standardFrom = from === 'yml' ? 'yaml' : from;
            const standardTo = to === 'yml' ? 'yaml' : to;

            if ([...dataFormats, 'csv'].includes(standardTo)) {
                return await convertScientificData(sourceUri, standardFrom as any, standardTo as any, options);
            }
        }

        // ==================================================
        // 6. E-BOOKS & ARCHIVES
        // ==================================================
        if (['epub', 'mobi', 'azw3', 'odt', 'ods', 'odp', 'pages', 'numbers', 'key'].includes(from)) {
            // Proper Ebooks
            if (['epub'].includes(from)) {
                if (to === 'html') {
                    const result = await epubToHtml(sourceUri);
                    if (result.success && result.content) {
                        const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.html`, result.content);
                        return { ...result, uri: outputUri };
                    }
                    return result;
                }
                if (to === 'txt') {
                    const result = await epubToText(sourceUri);
                    if (result.success && result.content) {
                        const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.txt`, result.content);
                        return { ...result, uri: outputUri };
                    }
                    return result;
                }
                if (to === 'pdf') {
                    return await ebookToPDF(sourceUri, from as any);
                }
            }

            // Fallback for other Zip-based formats (ODT, PAGES, etc) -> Text Extraction
            if (to === 'txt') {
                const text = await extractTextFromZip(sourceUri);
                const outputUri = await FileUtils.writeAsStringAsync(`${FileUtils.getCacheDirectory()}converted.txt`, text);
                return { content: text, uri: outputUri, success: true };
            }
        }

        // ==================================================
        // 7. NEW FORMATS (TSV, INI, LOG, SRT)
        // ==================================================

        if (from === 'tsv') {
            if (to === 'csv') return await tsvToCsv(sourceUri);
            if (to === 'json') {
                const result = await tsvToCsv(sourceUri); // Convert to CSV first
                if (result.success && result.content) {
                    return await csvToJSONAdvanced(result.content); // Then CSV to JSON
                }
                return result;
            }
        }

        if (from === 'csv' && to === 'tsv') {
            return await csvToTsv(sourceUri);
        }

        if (from === 'ini' && to === 'json') return await iniToJson(sourceUri);
        if (from === 'log' && to === 'json') return await logToJson(sourceUri);
        if (from === 'srt' && to === 'json') return await srtToJson(sourceUri);

        return {
            success: false,
            error: `Conversion from ${from} to ${to} is available via Fallback or Text Extraction only, or not supported.`
        };

    } catch (error) {
        console.error('Master Conversion Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown major error during conversion'
        };
    }
};

/**
 * Batch Conversion
 * Process multiple files in parallel (or sequential if resources constrained)
 */
export const convertBatch = async (
    items: { sourceUri: string; sourceFormat: string; targetFormat: string; options?: any }[],
    onProgress?: (completed: number, total: number) => void
): Promise<ConversionResult[]> => {
    const results: ConversionResult[] = [];
    let completed = 0;

    // Simple parallel execution
    // In production, we might want a queue for heavy tasks (like OCR/Video)
    const promises = items.map(async (item) => {
        try {
            const result = await convertFile(item.sourceUri, item.sourceFormat, item.targetFormat, item.options);
            results[items.indexOf(item)] = result; // Keep order
        } catch (error) {
            results[items.indexOf(item)] = {
                success: false,
                error: error instanceof Error ? error.message : 'Batch item failed'
            };
        } finally {
            completed++;
            if (onProgress) onProgress(completed, items.length);
        }
    });

    await Promise.all(promises);
    return results;
};

// =========================================
// LEGACY HELPERS (Preserved for compatibility)
// =========================================

export const readTextFile = async (uri: string): Promise<{ success: boolean; content?: string; error?: string }> => {
    try {
        const content = await FileUtils.readAsStringAsync(uri);
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to read file' };
    }
};

export const convertImage = async (uri: string, optionsOrFormat: any, quality: number = 0.9) => {
    try {
        let options: any = {};
        let targetFormat = 'png';

        if (typeof optionsOrFormat === 'string') {
            // Legacy signature: (uri, format, quality)
            targetFormat = optionsOrFormat;
            options = { quality };
        } else {
            // New signature: (uri, { format, quality })
            options = optionsOrFormat || {};
            targetFormat = options.format || 'png';
        }

        // Normalize format
        targetFormat = targetFormat === 'jpg' || targetFormat === 'jpeg' ? 'jpeg' :
            targetFormat === 'webp' ? 'webp' : 'png';

        const result = await convertImageFormat(uri, targetFormat as any, options);
        return { success: true, uri: result.uri };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Image conversion failed' };
    }
};

// Re-export PDF converters
export * from './pdfConverter';

// Re-export OCR converters
export { imageToText, batchOCR, terminateOCRWorker, getSupportedLanguages } from './ocrConverter';

// Re-export Vector converters
export { svgToHtml, svgToImage, svgToPdf } from './vectorConverter';

// Re-export Archive utilities
export { extractTextFromZip, listZipContents, createZip } from './archiveConverter';

// Re-export Presentation converters
export { textToPPTX, pptxToText, markdownToPPTX } from './presentationConverter';

// Re-export Ebook converters
export { epubToHtml, epubToText, ebookToPDF } from './ebookConverter';

// =========================================
// BACKWARD COMPATIBILITY EXPORTS
// =========================================
export { textToPDFAdvanced as textToPDF, htmlToPDFAdvanced as htmlToPDF } from './advancedConverters';
export { docxToHTML as docxToHtml, docxToText as docxToText } from './advancedConverters';
export { xlsxToJSON as excelToJson, xlsxToCSV as excelToCsv, xlsxToHTML as excelToHtml } from './advancedConverters';
export { jsonToXLSX as jsonToExcel } from './advancedConverters';
export { csvToJSONAdvanced as csvToJson, jsonToCSVAdvanced as jsonToCsv } from './advancedConverters';
export { xmlToJSONAdvanced as xmlToJson } from './advancedConverters';
export { markdownToPDF } from './pdfConverter';
export { protectPDF, addWatermark } from './pdfConverter';
