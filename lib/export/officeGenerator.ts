/**
 * Office & Archive Generator
 * Handles generation of DOCX, XLSX, and ZIP files
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
// import { ScannedPage } from '@/hooks/useDocumentStore';  <-- Not used in this file

// Helper to save file appropriately for platform
async function saveFile(
    content: string,
    filename: string,
    mimeType: string,
    encoding: FileSystem.EncodingType
): Promise<string> {
    if (Platform.OS === 'web') {
        // Convert content to Blob
        let blob: Blob;
        if (encoding === FileSystem.EncodingType.Base64) {
            // Decode base64
            const byteCharacters = atob(content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: mimeType });
        } else {
            // String content (UTF8)
            blob = new Blob([content], { type: mimeType });
        }

        // Create Blob URL
        return URL.createObjectURL(blob);
    } else {
        // Native: Write to cache directory
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
            encoding: encoding,
        });
        return fileUri;
    }
}

// =====================================================
// EXCEL / CSV (using xlsx)
// =====================================================

export async function generateExcel(
    data: any[],
    sheetName: string = 'Sheet1'
): Promise<string> {
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate buffer (base64)
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    return await saveFile(
        wbout,
        `export_${Date.now()}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        FileSystem.EncodingType.Base64
    );
}

export async function generateCSV(data: any[]): Promise<string> {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const csvOutput = XLSX.utils.sheet_to_csv(ws);

    return await saveFile(
        csvOutput,
        `export_${Date.now()}.csv`,
        'text/csv',
        FileSystem.EncodingType.UTF8
    );
}

// =====================================================
// WORD (using docx)
// =====================================================

export async function generateDOCX(
    content: string,
    title?: string,
    images: string[] = []
): Promise<string> {
    // Create paragraphs from text
    const paragraphs = content.split('\n').map(line =>
        new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 120 }, // Small space after line
        })
    );

    // Add title if exists
    if (title) {
        paragraphs.unshift(
            new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 240 },
            })
        );
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: paragraphs,
        }],
    });

    // Generate base64
    const buffer = await Packer.toBase64String(doc);

    return await saveFile(
        buffer,
        `export_${Date.now()}.docx`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        FileSystem.EncodingType.Base64
    );
}

// =====================================================
// ZIP ARCHIVE (using jszip)
// =====================================================

export async function generateZIP(
    files: { uri: string; name: string }[]
): Promise<string> {
    const zip = new JSZip();

    for (const file of files) {
        let content: string | ArrayBuffer;

        if (Platform.OS === 'web') {
            // Web: Fetch the Blob/File content
            try {
                const response = await fetch(file.uri);
                const blob = await response.blob();
                content = await blob.arrayBuffer();
                zip.file(file.name, content);
            } catch (e) {
                console.warn(`Failed to add file ${file.name} to zip on web`, e);
            }
        } else {
            // Native: Read as base64
            content = await FileSystem.readAsStringAsync(file.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            zip.file(file.name, content, { base64: true });
        }
    }

    const base64Content = await zip.generateAsync({ type: 'base64' });

    return await saveFile(
        base64Content,
        `archive_${Date.now()}.zip`,
        'application/zip',
        FileSystem.EncodingType.Base64
    );
}

export default {
    generateExcel,
    generateCSV,
    generateDOCX,
    generateZIP,
};
