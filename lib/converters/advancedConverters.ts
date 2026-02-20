/**
 * Advanced Document Converters
 * Central high-level conversion functions with proper library usage
 * 
 * Libraries:
 *  - mammoth: DOCX → HTML/Text
 *  - docx: Text/HTML → DOCX generation
 *  - xlsx/SheetJS: Excel ↔ CSV/JSON
 *  - papaparse: CSV ↔ JSON
 *  - marked: Markdown → HTML
 *  - turndown: HTML → Markdown
 *  - fast-xml-parser: XML ↔ JSON
 *  - jspdf: HTML → PDF (web)
 *  - expo-print: HTML → PDF (mobile)
 */

import { Platform } from 'react-native';
import * as FileUtils from './fileUtils';

// Dynamic imports to prevent crashes
let mammothLib: any = null;
try { mammothLib = require('mammoth'); } catch (e) { /* optional */ }

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

// =========================================
// PDF CONVERSIONS
// =========================================

/**
 * Convert text to PDF (Universal)
 */
export const textToPDFAdvanced = async (text: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        if (Platform.OS === 'web') {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            const splitText = doc.splitTextToSize(text, 180); // 180mm width (A4 is 210mm)
            doc.text(splitText, 15, 15);

            const blob = doc.output('blob');
            const uri = URL.createObjectURL(blob);
            return { uri, success: true };
        } else {
            // Native: HTML approach is easier
            const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            const html = `
            <html>
                <body style="font-family: Helvetica; padding: 20px;">
                    ${escapedText}
                </body>
            </html>`;
            return await htmlToPDFAdvanced(html);
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Text to PDF failed' };
    }
};

/**
 * Convert HTML to PDF (Universal)
 */
export const htmlToPDFAdvanced = async (html: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        const Print = await import('expo-print');
        const { uri } = await Print.printToFileAsync({
            html,
            base64: false
        });
        return { uri, success: true };
    } catch (error) {
        console.error('HTML to PDF Error:', error);
        // Fallback for web if printToFileAsync fails (it shouldn't if setup correctly)
        if (Platform.OS === 'web') {
            try {
                const { jsPDF } = await import('jspdf');
                const doc = new jsPDF();
                // Very basic HTML text extraction fallback
                const text = html.replace(/<[^>]*>/g, '\n');
                const splitText = doc.splitTextToSize(text, 180);
                doc.text(splitText, 15, 15);
                const blob = doc.output('blob');
                const uri = URL.createObjectURL(blob);
                return { uri, success: true };
            } catch (e) {
                return { success: false, error: 'HTML to PDF failed on Web' };
            }
        }
        return { success: false, error: error instanceof Error ? error.message : 'HTML to PDF conversion failed' };
    }
};

// =========================================
// IMAGE CONVERSIONS
// =========================================

/**
 * Convert Image to PDF
 */
export const imageToPDF = async (imageUri: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        if (Platform.OS === 'web') {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Need to fetch blob first if it's blob: URI
            let imgData = imageUri;
            if (imageUri.startsWith('blob:')) {
                const res = await fetch(imageUri);
                const blob = await res.blob();
                const reader = new FileReader();
                imgData = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            const imgRatio = imgProps.width / imgProps.height;
            const pdfRatio = pdfWidth / pdfHeight;

            let w, h;
            if (imgRatio > pdfRatio) {
                w = pdfWidth;
                h = pdfWidth / imgRatio;
            } else {
                h = pdfHeight;
                w = pdfHeight * imgRatio;
            }
            const x = (pdfWidth - w) / 2;
            const y = (pdfHeight - h) / 2;

            doc.addImage(imgData, 'JPEG', x, y, w, h);
            const blob = doc.output('blob');
            const uri = URL.createObjectURL(blob);
            return { uri, success: true };
        } else {
            const Print = await import('expo-print');
            const html = `<img src="${imageUri}" style="width: 100%; height: 100%; object-fit: contain;" />`;
            const { uri } = await Print.printToFileAsync({ html });
            return { uri, success: true };
        }
    } catch (error) {
        return { success: false, error: 'Image to PDF failed' };
    }
};

/**
 * Convert Image to Text (OCR)
 */
export const imageToText = async (imageUri: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        // Dynamic import to avoid cycles/crashes
        const { default: ocrEngine } = await import('@/lib/ocr/TesseractOCR');
        await ocrEngine.initialize('eng'); // Default to English or detect?
        const result = await ocrEngine.recognizeText(imageUri);
        return { content: result.text, success: true };
    } catch (error) {
        console.error('OCR Error:', error);
        return { success: false, error: 'OCR failed. Check network or image format.' };
    }
};

// =========================================
// DOCX CONVERSIONS
// =========================================

/**
 * Convert DOCX to HTML using Mammoth
 */
export const docxToHTML = async (uri: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        if (!mammothLib) {
            return { success: false, error: 'Library mammoth tidak tersedia' };
        }
        const arrayBuffer = await FileUtils.readAsArrayBufferAsync(uri);
        const result = await mammothLib.convertToHtml(
            { arrayBuffer },
            {
                includeDefaultStyleMap: true,
                convertImage: mammothLib.images.imgElement((image: any) => {
                    return image.read('base64').then((imageBuffer: string) => ({
                        src: `data:${image.contentType};base64,${imageBuffer}`,
                    }));
                }),
            }
        );
        return { content: result.value, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'DOCX to HTML failed' };
    }
};

/**
 * Convert DOCX to plain text using Mammoth
 */
export const docxToText = async (uri: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        if (!mammothLib) {
            return { success: false, error: 'Library mammoth tidak tersedia' };
        }
        const arrayBuffer = await FileUtils.readAsArrayBufferAsync(uri);
        const result = await mammothLib.extractRawText({ arrayBuffer });
        return { content: result.value, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'DOCX to text failed' };
    }
};

/**
 * Convert text to DOCX using docx library
 * Creates a professional-looking document with proper formatting
 */
export const textToDOCX = async (text: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        const sections = text.split('\n\n');
        const children: Paragraph[] = [];

        for (const section of sections) {
            const lines = section.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();

                // Detect headers (lines that look like titles)
                if (trimmed.startsWith('# ')) {
                    children.push(new Paragraph({
                        text: trimmed.substring(2),
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 240, after: 120 },
                    }));
                } else if (trimmed.startsWith('## ')) {
                    children.push(new Paragraph({
                        text: trimmed.substring(3),
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 },
                    }));
                } else if (trimmed.startsWith('### ')) {
                    children.push(new Paragraph({
                        text: trimmed.substring(4),
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 160, after: 80 },
                    }));
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: '• ' + trimmed.substring(2), size: 24 })],
                        spacing: { before: 40, after: 40 },
                        indent: { left: 360 },
                    }));
                } else if (trimmed) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: trimmed, size: 24 })],
                        spacing: { before: 60, after: 60 },
                    }));
                } else {
                    children.push(new Paragraph({ text: '' }));
                }
            }
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                    },
                },
                children,
            }],
        });

        const blob = await Packer.toBlob(doc);

        if (Platform.OS === 'web') {
            const uri = URL.createObjectURL(blob);
            return { uri, success: true };
        } else {
            // Mobile: save as file
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onloadend = async () => {
                    try {
                        const base64 = (reader.result as string).split(',')[1];
                        const uri = await FileUtils.writeAsStringAsync(
                            `${FileUtils.getCacheDirectory()}converted.docx`,
                            base64,
                            { encoding: 'base64' }
                        );
                        resolve({ uri, success: true });
                    } catch (e) {
                        resolve({ success: false, error: 'Failed to save DOCX' });
                    }
                };
                reader.readAsDataURL(blob);
            });
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Text to DOCX failed' };
    }
};

// =========================================
// EXCEL CONVERSIONS
// =========================================

/**
 * Convert XLSX to CSV using SheetJS
 * Handles multiple sheets by converting the first one
 */
export const xlsxToCSV = async (uri: string): Promise<{ content?: string; uri?: string; success: boolean; error?: string }> => {
    try {
        const arrayBuffer = await FileUtils.readAsArrayBufferAsync(uri);
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const csv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });

        const outputUri = await FileUtils.writeAsStringAsync(
            `${FileUtils.getCacheDirectory()}converted.csv`,
            csv
        );

        return { content: csv, uri: outputUri, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'XLSX to CSV failed' };
    }
};

/**
 * Convert XLSX to JSON using SheetJS
 */
export const xlsxToJSON = async (uri: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        const arrayBuffer = await FileUtils.readAsArrayBufferAsync(uri);
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

        // Convert all sheets
        const result: Record<string, any[]> = {};
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            result[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        }

        // If only one sheet, unwrap
        const jsonData = workbook.SheetNames.length === 1
            ? result[workbook.SheetNames[0]]
            : result;

        const jsonString = JSON.stringify(jsonData, null, 2);
        return { content: jsonString, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'XLSX to JSON failed' };
    }
};

/**
 * Convert XLSX to HTML table
 */
export const xlsxToHTML = async (uri: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        const arrayBuffer = await FileUtils.readAsArrayBufferAsync(uri);
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
                th { background: #4361ee; color: white; font-weight: 600; }
                tr:nth-child(even) { background: #f8f9fa; }
                tr:hover { background: #e9ecef; }
                h2 { color: #1a1a2e; margin-top: 20px; }
            </style>
        </head>
        <body>`;

        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const htmlTable = XLSX.utils.sheet_to_html(worksheet);
            html += `<h2>${sheetName}</h2>${htmlTable}`;
        }

        html += '</body></html>';
        return { content: html, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'XLSX to HTML failed' };
    }
};

/**
 * Convert CSV to XLSX using SheetJS
 */
export const csvToXLSX = async (csvContent: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        const parsed = Papa.parse(csvContent, { dynamicTyping: true, skipEmptyLines: true });
        const worksheet = XLSX.utils.aoa_to_sheet(parsed.data as any[][]);

        // Auto-size columns
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const colWidths: any[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxWidth = 8;
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell && cell.v) {
                    maxWidth = Math.max(maxWidth, String(cell.v).length);
                }
            }
            colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
        }
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const uri = URL.createObjectURL(blob);

        return { uri, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'CSV to XLSX failed' };
    }
};

/**
 * Convert JSON to XLSX
 */
export const jsonToXLSX = async (jsonContent: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        const data = JSON.parse(jsonContent);
        const rows = Array.isArray(data) ? data : [data];

        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Auto-size columns
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const colWidths: any[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxWidth = 10;
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell && cell.v) {
                    maxWidth = Math.max(maxWidth, String(cell.v).length);
                }
            }
            colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
        }
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const uri = URL.createObjectURL(blob);

        return { uri, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'JSON to XLSX failed' };
    }
};

// =========================================
// CSV CONVERSIONS
// =========================================

/**
 * Convert CSV to JSON using PapaParse
 */
export const csvToJSONAdvanced = async (csvContent: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        const result = Papa.parse(csvContent, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (h: string) => h.trim(),
        });

        if (result.errors.length > 0 && result.data.length === 0) {
            return { success: false, error: `Parse errors: ${result.errors[0].message}` };
        }

        const jsonString = JSON.stringify(result.data, null, 2);
        return { content: jsonString, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'CSV to JSON failed' };
    }
};

/**
 * Convert JSON to CSV using PapaParse
 */
export const jsonToCSVAdvanced = async (jsonContent: string): Promise<{ content?: string; uri?: string; success: boolean; error?: string }> => {
    try {
        let data = JSON.parse(jsonContent);

        // Handle non-array JSON by wrapping
        if (!Array.isArray(data)) {
            if (typeof data === 'object' && data !== null) {
                data = [data];
            } else {
                return { success: false, error: 'JSON harus berupa array atau objek' };
            }
        }

        const csv = Papa.unparse(data, {
            quotes: true,
            header: true,
        });

        const outputUri = await FileUtils.writeAsStringAsync(
            `${FileUtils.getCacheDirectory()}converted.csv`,
            csv
        );

        return { content: csv, uri: outputUri, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'JSON to CSV failed' };
    }
};

// =========================================
// MARKDOWN CONVERSIONS
// =========================================

/**
 * Convert Markdown to HTML using marked (with fallback)
 */
export const markdownToHTMLAdvanced = async (markdown: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        let html: string;
        try {
            const { marked } = await import('marked');
            html = await marked(markdown);
        } catch {
            // Fallback to showdown
            try {
                const Showdown = require('showdown');
                const converter = new Showdown.Converter({ tables: true, ghCodeBlocks: true });
                html = converter.makeHtml(markdown);
            } catch {
                // Last resort: basic
                html = markdown
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*)\*/gim, '<em>$1</em>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>');
                html = `<p>${html}</p>`;
            }
        }
        return { content: html, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Markdown to HTML failed' };
    }
};

/**
 * Convert HTML to Markdown using Turndown (with fallback)
 */
export const htmlToMarkdown = async (html: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        let markdown: string;
        try {
            const TurndownService = require('turndown');
            const turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
            });
            markdown = turndownService.turndown(html);
        } catch {
            // Fallback basic
            markdown = html
                .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
                .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
                .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
                .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
                .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&');
        }
        return { content: markdown, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'HTML to Markdown failed' };
    }
};

// =========================================
// XML/JSON CONVERSIONS
// =========================================

/**
 * Convert XML to JSON using fast-xml-parser
 */
export const xmlToJSONAdvanced = async (xml: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseTagValue: true,
            trimValues: true,
        });
        const result = parser.parse(xml);
        const jsonString = JSON.stringify(result, null, 2);

        return { content: jsonString, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'XML to JSON failed' };
    }
};

/**
 * Convert JSON to XML using fast-xml-parser
 */
export const jsonToXML = async (jsonContent: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        let data = JSON.parse(jsonContent);

        // Wrap arrays in root element
        if (Array.isArray(data)) {
            data = { root: { item: data } };
        }

        const builder = new XMLBuilder({
            format: true,
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            suppressEmptyNode: true,
        });
        const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(data);

        return { content: xml, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'JSON to XML failed' };
    }
};

/**
 * Convert DOCX to PDF
 * Chain: DOCX -> HTML -> PDF
 */
export const docxToPDF = async (uri: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        const { content, success, error } = await docxToHTML(uri);
        if (!success || !content) return { success: false, error: error || 'DOCX parse failed' };

        // Wrap in clean styling for PDF
        const styledHtml = `
            <html>
                <body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.5;">
                    ${content}
                </body>
            </html>`;

        return await htmlToPDFAdvanced(styledHtml);
    } catch (e) {
        return { success: false, error: 'DOCX to PDF failed' };
    }
};

/**
 * Convert Excel (XLSX) to PDF
 * Chain: XLSX -> HTML Table -> PDF
 */
export const xlsxToPDF = async (uri: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        const arrayBuffer = await FileUtils.readAsArrayBufferAsync(uri);
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

        // Convert first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const htmlTable = XLSX.utils.sheet_to_html(worksheet);

        const styledHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: monospace; padding: 20px; }
                        table { border-collapse: collapse; width: 100%; border: 1px solid #ccc; }
                        th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 10px; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                    </style>
                </head>
                <body>
                    <h2 style="font-family: Arial;">${sheetName}</h2>
                    ${htmlTable}
                </body>
            </html>
        `;
        return await htmlToPDFAdvanced(styledHtml);
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Excel to PDF failed' };
    }
};

/**
 * Convert PDF to DOCX (Text Extraction)
 * Extracts text and puts it into a new DOCX
 */
export const pdfToDOCX = async (uri: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        let textContent = '';

        if (Platform.OS === 'web') {
            try {
                // @ts-ignore
                const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
                // Set worker - essential for web
                pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

                const loadingTask = pdfjs.getDocument(uri);
                const pdf = await loadingTask.promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContentItem = await page.getTextContent();
                    const strings = textContentItem.items.map((item: any) => item.str);
                    textContent += strings.join(' ') + '\n\n';
                }
            } catch (webErr) {
                console.warn('PDF.js web error:', webErr);
                return { success: false, error: 'Gagal membaca PDF di browser' };
            }
        } else {
            // Native TODO: Integrate native PDF reader if possible, or skip
            // For now, return specific message
            return { success: false, error: 'PDF to DOCX saat ini hanya tersedia di Web' };
        }

        if (!textContent) {
            return { success: false, error: 'Tidak ada teks yang ditemukan dalam PDF (mungkin gambar?)' };
        }

        return await textToDOCX(textContent);

    } catch (e) {
        console.error(e);
        return { success: false, error: 'PDF to DOCX failed' };
    }
};

/**
 * Convert PDF to Images (ZIP archive of images)
 * Web: Uses pdf.js -> canvas -> zip
 */
export const pdfToImages = async (uri: string, format: 'png' | 'jpeg'): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        if (Platform.OS === 'web') {
            // @ts-ignore
            const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
            pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

            const loadingTask = pdfjs.getDocument(uri);
            const pdf = await loadingTask.promise;

            if (pdf.numPages === 0) return { success: false, error: 'PDF is empty' };

            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            const imagesFolder = zip.folder("images");

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better quality

                const canvas = document.createElement('canvas'); // Use native canvas if available? In React Native Web = HTMLCanvasElement
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // @ts-ignore
                await page.render({ canvasContext: context, viewport }).promise;

                const dataUrl = canvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`);
                const base64Data = dataUrl.split(',')[1];

                imagesFolder?.file(`page_${i}.${format}`, base64Data, { base64: true });
            }

            const content = await zip.generateAsync({ type: 'base64' });
            // For zip, we might return base64 content or blob URI.
            // FileUtils.writeAsStringAsync expects string content. 
            // If "content" is returned, convert.tsx writes key "content".
            // But if we return "uri", we need a blob URI.

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUri = URL.createObjectURL(zipBlob);
            return { uri: zipUri, success: true };

        } else {
            return { success: false, error: 'PDF to Images saat ini hanya tersedia di Web' };
        }
    } catch (e) {
        console.error(e);
        return { success: false, error: 'PDF to Images failed: ' + (e instanceof Error ? e.message : String(e)) };
    }
};

/**
 * Convert Image Format (e.g. HEIC -> JPG, WEBP -> PNG)
 */
export const convertImageFormat = async (uri: string, format: 'png' | 'jpeg'): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
        const saveFormat = format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG;

        const result = await manipulateAsync(
            uri,
            [],
            { format: saveFormat, compress: 0.9 } // 90% quality
        );

        return { uri: result.uri, success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Image conversion failed: ' + (e instanceof Error ? e.message : String(e)) };
    }
};

/**
 * PDF to Text (Simple Extraction)
 */
export const pdfToText = async (uri: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        if (Platform.OS === 'web') {
            // @ts-ignore
            const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
            pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

            const loadingTask = pdfjs.getDocument(uri);
            const pdf = await loadingTask.promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const strings = textContent.items.map((item: any) => item.str);
                fullText += strings.join(' ') + '\n\n';
            }

            return { content: fullText, success: true };
        } else {
            return { success: false, error: 'PDF to Text saat ini hanya tersedia di Web' };
        }
    } catch (e) {
        return { success: false, error: 'PDF to Text failed' };
    }
};
