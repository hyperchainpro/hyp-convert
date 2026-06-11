import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import {
    convertImage,
    textToPDF,
    htmlToPDF,
    markdownToPDF,
    docxToHtml,
    docxToText,
    excelToJson,
    excelToCsv,
    csvToJson,
    jsonToCsv,
    xmlToJson,
    readTextFile,
} from '@/lib/converters';
import {
    yamlToJson,
    jsonToYaml,
    tsvToCsv,
    csvToTsv,
    tomlToJson,
    iniToJson,
    logToJson,
    sqlToJson,
    srtToJson,
    mdToHtml,
    htmlToMd,
} from '@/lib/converters/dataConverter';
import {
    getFileExtension,
    getOutputFormats,
    isFormatSupported,
    formatFileSize,
    FILE_SIZE_LIMITS,
    SUPPORTED_FORMATS,
} from '@/constants/formats';
import { saveConversionHistory } from '@/lib/supabase';

interface FileInfo {
    uri: string;
    name: string;
    size: number;
    type: string;
    extension: string;
}

interface ConversionState {
    selectedFile: FileInfo | null;
    outputFormat: string;
    isConverting: boolean;
    progress: number;
    result: {
        uri?: string;
        content?: string;
        success: boolean;
        error?: string;
    } | null;
    error: string | null;
}

export const useConversion = () => {
    const [state, setState] = useState<ConversionState>({
        selectedFile: null,
        outputFormat: '',
        isConverting: false,
        progress: 0,
        result: null,
        error: null,
    });

    const pickDocument = useCallback(async () => {
        try {
            console.log("Picking document...");
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                console.log("Document picking canceled");
                return { success: false, canceled: true };
            }

            if (!result.assets || result.assets.length === 0) {
                console.error("No assets found in result");
                setState(prev => ({ ...prev, error: 'Gagal membaca file: Tidak ada file dipilih' }));
                return { success: false, error: 'Tidak ada file dipilih' };
            }

            const file = result.assets[0];
            console.log("File picked:", file.name, file.uri);

            // Robust extension detection
            let extension = getFileExtension(file.name);
            if (!extension && file.mimeType) {
                // Fallback attempt to guess extension from mime
                const mimeExt = file.mimeType.split('/')[1];
                if (mimeExt) extension = mimeExt;
            }

            // Check format support
            if (!isFormatSupported(extension)) {
                console.warn(`Format .${extension} not supported`);
                setState(prev => ({
                    ...prev,
                    error: `Format .${extension} tidak valid atau belum didukung`,
                    selectedFile: null // Reset on error
                }));
                return { success: false, error: `Format .${extension} tidak valid saat ini` };
            }

            // Check file size
            const sizeLimit = Platform.OS === 'web'
                ? FILE_SIZE_LIMITS.web
                : FILE_SIZE_LIMITS.mobile;

            if (file.size && file.size > sizeLimit) {
                const limitStr = formatFileSize(sizeLimit);
                setState(prev => ({
                    ...prev,
                    error: `Ukuran file melebihi batas ${limitStr}`,
                    selectedFile: null
                }));
                return { success: false, error: `Ukuran file melebihi batas ${limitStr}` };
            }

            const fileInfo: FileInfo = {
                uri: file.uri,
                name: file.name,
                size: file.size || 0,
                type: file.mimeType || '',
                extension,
            };

            // Set default output format
            const availableFormats = getOutputFormats(extension);
            console.log("Available output formats:", availableFormats);

            setState(prev => ({
                ...prev,
                selectedFile: fileInfo,
                outputFormat: availableFormats[0] || '',
                result: null,
                error: null,
            }));

            return { success: true, file: fileInfo };
        } catch (error) {
            console.error('Error in pickDocument:', error);
            const message = error instanceof Error ? error.message : 'Gagal memilih file';
            setState(prev => ({ ...prev, error: message }));
            return { success: false, error: message };
        }
    }, []);

    const pickImage = useCallback(async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setState(prev => ({
                    ...prev,
                    error: 'Izin akses galeri diperlukan',
                }));
                return { success: false, error: 'Izin akses galeri diperlukan' };
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
            });

            if (result.canceled) {
                return { success: false, canceled: true };
            }

            const asset = result.assets[0];
            const fileName = asset.uri.split('/').pop() || 'image';
            const extension = getFileExtension(fileName);

            const fileInfo: FileInfo = {
                uri: asset.uri,
                name: fileName,
                size: asset.fileSize || 0,
                type: asset.mimeType || `image/${extension}`,
                extension: extension || 'jpg',
            };

            const availableFormats = getOutputFormats(fileInfo.extension);

            setState(prev => ({
                ...prev,
                selectedFile: fileInfo,
                outputFormat: availableFormats[0] || 'png',
                result: null,
                error: null,
            }));

            return { success: true, file: fileInfo };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal memilih gambar';
            setState(prev => ({ ...prev, error: message }));
            return { success: false, error: message };
        }
    }, []);

    const setOutputFormat = useCallback((format: string) => {
        setState(prev => ({ ...prev, outputFormat: format, result: null }));
    }, []);

    const convert = useCallback(async (quality: number = 0.9) => {
        const { selectedFile, outputFormat } = state;

        if (!selectedFile || !outputFormat) {
            setState(prev => ({
                ...prev,
                error: 'Pilih file dan format output terlebih dahulu',
            }));
            return { success: false, error: 'File atau format tidak dipilih' };
        }

        setState(prev => ({
            ...prev,
            isConverting: true,
            progress: 0,
            result: null,
            error: null,
        }));

        try {
            const { extension, uri } = selectedFile;
            let result: { success: boolean; uri?: string; content?: string; error?: string };

            // Image conversions (extended to all image formats)
            if (SUPPORTED_FORMATS.IMAGE_INPUT.includes(extension)) {
                setState(prev => ({ ...prev, progress: 30 }));

                if (outputFormat === 'pdf') {
                    // Convert image to PDF
                    const imageResult = await convertImage(uri, {
                        format: 'jpg' as 'png' | 'jpg' | 'webp',
                        quality,
                    });
                    if (imageResult.success && imageResult.uri) {
                        const pdfResult = await htmlToPDF(`<img src="${imageResult.uri}" style="max-width:100%;height:auto;">`);
                        result = { success: pdfResult.success, uri: pdfResult.uri, error: pdfResult.error };
                    } else {
                        result = { success: false, error: imageResult.error };
                    }
                } else {
                    const imageResult = await convertImage(uri, {
                        format: outputFormat as 'png' | 'jpg' | 'webp',
                        quality,
                    });
                    result = {
                        success: imageResult.success,
                        uri: imageResult.uri,
                        error: imageResult.error,
                    };
                }
            }
            // Text to PDF/HTML/MD
            else if (extension === 'txt') {
                setState(prev => ({ ...prev, progress: 30 }));

                const textResult = await readTextFile(uri);
                if (!textResult.success || !textResult.content) {
                    throw new Error(textResult.error || 'Gagal membaca file teks');
                }

                setState(prev => ({ ...prev, progress: 60 }));

                if (outputFormat === 'pdf') {
                    const pdfResult = await textToPDF(textResult.content);
                    result = { success: pdfResult.success, uri: pdfResult.uri, error: pdfResult.error };
                } else if (outputFormat === 'html') {
                    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Document</title></head><body><pre>${textResult.content}</pre></body></html>`;
                    result = { success: true, content: htmlContent };
                } else if (outputFormat === 'md') {
                    result = { success: true, content: textResult.content };
                } else {
                    result = { success: true, content: textResult.content };
                }
            }
            // HTML conversions
            else if (extension === 'html') {
                setState(prev => ({ ...prev, progress: 30 }));

                const htmlResult = await readTextFile(uri);
                if (!htmlResult.success || !htmlResult.content) {
                    throw new Error(htmlResult.error || 'Gagal membaca file HTML');
                }

                setState(prev => ({ ...prev, progress: 60 }));

                if (outputFormat === 'pdf') {
                    const pdfResult = await htmlToPDF(htmlResult.content);
                    result = { success: pdfResult.success, uri: pdfResult.uri, error: pdfResult.error };
                } else if (outputFormat === 'txt') {
                    // Strip HTML tags
                    const text = htmlResult.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
                    result = { success: true, content: text };
                } else if (outputFormat === 'md') {
                    const mdResult = await htmlToMd(uri);
                    result = { success: mdResult.success, content: mdResult.content, error: mdResult.error };
                } else {
                    result = { success: true, content: htmlResult.content };
                }
            }
            // Markdown conversions
            else if (extension === 'md') {
                setState(prev => ({ ...prev, progress: 30 }));

                if (outputFormat === 'html') {
                    const mdHtmlResult = await mdToHtml(uri);
                    result = { success: mdHtmlResult.success, content: mdHtmlResult.content, error: mdHtmlResult.error };
                } else if (outputFormat === 'pdf') {
                    const mdHtmlResult = await mdToHtml(uri);
                    if (mdHtmlResult.success && mdHtmlResult.content) {
                        setState(prev => ({ ...prev, progress: 60 }));
                        const pdfResult = await htmlToPDF(mdHtmlResult.content);
                        result = { success: pdfResult.success, uri: pdfResult.uri, error: pdfResult.error };
                    } else {
                        result = { success: false, error: mdHtmlResult.error };
                    }
                } else {
                    const mdResult = await readTextFile(uri);
                    result = { success: mdResult.success, content: mdResult.content, error: mdResult.error };
                }
            }
            // DOCX conversions
            else if (extension === 'docx') {
                setState(prev => ({ ...prev, progress: 30 }));

                if (outputFormat === 'html' || outputFormat === 'pdf') {
                    const docResult = await docxToHtml(uri);
                    if (!docResult.success || !docResult.content) {
                        throw new Error(docResult.error || 'Gagal mengonversi DOCX');
                    }

                    setState(prev => ({ ...prev, progress: 60 }));

                    if (outputFormat === 'pdf') {
                        const pdfResult = await htmlToPDF(docResult.content);
                        result = { success: pdfResult.success, uri: pdfResult.uri, error: pdfResult.error };
                    } else {
                        result = { success: true, content: docResult.content };
                    }
                } else if (outputFormat === 'md') {
                    const docResult = await docxToHtml(uri);
                    if (docResult.success && docResult.content) {
                        const mdResult = await htmlToMd(uri);
                        result = { success: true, content: mdResult.content || docResult.content };
                    } else {
                        result = { success: false, error: docResult.error };
                    }
                } else {
                    const docResult = await docxToText(uri);
                    result = { success: docResult.success, content: docResult.content, error: docResult.error };
                }
            }
            // Excel/Spreadsheet conversions
            else if (['xlsx', 'xls'].includes(extension)) {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'csv') {
                    const excelResult = await excelToCsv(uri);
                    result = { success: excelResult.success, content: excelResult.content, error: excelResult.error };
                } else if (outputFormat === 'tsv') {
                    const excelResult = await excelToCsv(uri);
                    if (excelResult.success && excelResult.content) {
                        const tsvContent = excelResult.content.split('\n').map(line => line.replace(/,/g, '\t')).join('\n');
                        result = { success: true, content: tsvContent };
                    } else {
                        result = { success: false, error: excelResult.error };
                    }
                } else {
                    const excelResult = await excelToJson(uri);
                    result = { success: excelResult.success, content: excelResult.content, error: excelResult.error };
                }
            }
            // CSV conversions
            else if (extension === 'csv') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'json') {
                    const csvResult = await csvToJson(uri);
                    result = { success: csvResult.success, content: csvResult.content, error: csvResult.error };
                } else if (outputFormat === 'tsv') {
                    const tsvResult = await csvToTsv(uri);
                    result = { success: tsvResult.success, content: tsvResult.content, error: tsvResult.error };
                } else {
                    const csvResult = await readTextFile(uri);
                    result = { success: csvResult.success, content: csvResult.content, error: csvResult.error };
                }
            }
            // TSV conversions
            else if (extension === 'tsv') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'csv') {
                    const tsvResult = await tsvToCsv(uri);
                    result = { success: tsvResult.success, content: tsvResult.content, error: tsvResult.error };
                } else if (outputFormat === 'json') {
                    const csvResult = await tsvToCsv(uri);
                    if (csvResult.success && csvResult.content) {
                        // Parse CSV-like content to JSON
                        const lines = csvResult.content.split('\n').filter(l => l.trim());
                        if (lines.length > 1) {
                            const headers = lines[0].split(',');
                            const data = lines.slice(1).map(line => {
                                const values = line.split(',');
                                const obj: Record<string, string> = {};
                                headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim() || '');
                                return obj;
                            });
                            result = { success: true, content: JSON.stringify(data, null, 2) };
                        } else {
                            result = { success: true, content: '[]' };
                        }
                    } else {
                        result = { success: false, error: csvResult.error };
                    }
                } else {
                    const tsvResult = await readTextFile(uri);
                    result = { success: tsvResult.success, content: tsvResult.content, error: tsvResult.error };
                }
            }
            // JSON conversions
            else if (extension === 'json') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'csv') {
                    const jsonResult = await jsonToCsv(uri);
                    result = { success: jsonResult.success, content: jsonResult.content, error: jsonResult.error };
                } else if (outputFormat === 'yaml') {
                    const yamlResult = await jsonToYaml(uri);
                    result = { success: yamlResult.success, content: yamlResult.content, error: yamlResult.error };
                } else if (outputFormat === 'tsv') {
                    const jsonResult = await jsonToCsv(uri);
                    if (jsonResult.success && jsonResult.content) {
                        const tsvContent = jsonResult.content.split('\n').map(line => line.replace(/,/g, '\t')).join('\n');
                        result = { success: true, content: tsvContent };
                    } else {
                        result = { success: false, error: jsonResult.error };
                    }
                } else {
                    const textResult = await readTextFile(uri);
                    result = { success: textResult.success, content: textResult.content, error: textResult.error };
                }
            }
            // XML conversions
            else if (extension === 'xml') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'json') {
                    const xmlResult = await xmlToJson(uri);
                    result = { success: xmlResult.success, content: xmlResult.content, error: xmlResult.error };
                } else {
                    const textResult = await readTextFile(uri);
                    result = { success: textResult.success, content: textResult.content, error: textResult.error };
                }
            }
            // YAML conversions
            else if (extension === 'yaml' || extension === 'yml') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'json') {
                    const yamlResult = await yamlToJson(uri);
                    result = { success: yamlResult.success, content: yamlResult.content, error: yamlResult.error };
                } else {
                    const textResult = await readTextFile(uri);
                    result = { success: textResult.success, content: textResult.content, error: textResult.error };
                }
            }
            // TOML conversions
            else if (extension === 'toml') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'json') {
                    const tomlResult = await tomlToJson(uri);
                    result = { success: tomlResult.success, content: tomlResult.content, error: tomlResult.error };
                } else if (outputFormat === 'yaml') {
                    const tomlResult = await tomlToJson(uri);
                    if (tomlResult.success && tomlResult.content) {
                        // Convert JSON to YAML (simple approach)
                        const data = JSON.parse(tomlResult.content);
                        const yamlContent = Object.entries(data).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
                        result = { success: true, content: yamlContent };
                    } else {
                        result = { success: false, error: tomlResult.error };
                    }
                } else {
                    const textResult = await readTextFile(uri);
                    result = { success: textResult.success, content: textResult.content, error: textResult.error };
                }
            }
            // INI conversions
            else if (extension === 'ini') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'json') {
                    const iniResult = await iniToJson(uri);
                    result = { success: iniResult.success, content: iniResult.content, error: iniResult.error };
                } else {
                    const textResult = await readTextFile(uri);
                    result = { success: textResult.success, content: textResult.content, error: textResult.error };
                }
            }
            // LOG conversions
            else if (extension === 'log') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'json') {
                    const logResult = await logToJson(uri);
                    result = { success: logResult.success, content: logResult.content, error: logResult.error };
                } else {
                    const textResult = await readTextFile(uri);
                    result = { success: textResult.success, content: textResult.content, error: textResult.error };
                }
            }
            // SQL conversions
            else if (extension === 'sql') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'json') {
                    const sqlResult = await sqlToJson(uri);
                    result = { success: sqlResult.success, content: sqlResult.content, error: sqlResult.error };
                } else {
                    const textResult = await readTextFile(uri);
                    result = { success: textResult.success, content: textResult.content, error: textResult.error };
                }
            }
            // SRT (subtitle) conversions
            else if (extension === 'srt') {
                setState(prev => ({ ...prev, progress: 50 }));

                if (outputFormat === 'json') {
                    const srtResult = await srtToJson(uri);
                    result = { success: srtResult.success, content: srtResult.content, error: srtResult.error };
                } else {
                    const textResult = await readTextFile(uri);
                    result = { success: textResult.success, content: textResult.content, error: textResult.error };
                }
            }
            // Default: read as text
            else {
                const textResult = await readTextFile(uri);
                result = { success: textResult.success, content: textResult.content, error: textResult.error };
            }

            setState(prev => ({ ...prev, progress: 100 }));

            if (!result.success) {
                throw new Error(result.error || 'Konversi gagal');
            }

            // Save conversion history
            await saveConversionHistory(extension, outputFormat, selectedFile.size);

            setState(prev => ({
                ...prev,
                isConverting: false,
                progress: 100,
                result: {
                    uri: result.uri,
                    content: result.content,
                    success: true,
                },
            }));

            return { success: true, result };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Konversi gagal';
            setState(prev => ({
                ...prev,
                isConverting: false,
                progress: 0,
                error: message,
                result: { success: false, error: message },
            }));
            return { success: false, error: message };
        }
    }, [state.selectedFile, state.outputFormat]);

    const downloadResult = useCallback(async () => {
        const { result, selectedFile, outputFormat } = state;

        if (!result?.success || !selectedFile) {
            return { success: false, error: 'Tidak ada hasil untuk diunduh' };
        }

        try {
            const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${baseName}_converted.${outputFormat}`;

            if (Platform.OS === 'web') {
                // Web download
                if (result.uri) {
                    const link = document.createElement('a');
                    link.href = result.uri;
                    link.download = newFileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else if (result.content) {
                    const blob = new Blob([result.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = newFileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
                return { success: true };
            } else {
                // Native download - save to media library for images
                if (result.uri && ['png', 'jpg', 'jpeg', 'webp'].includes(outputFormat)) {
                    const { status } = await MediaLibrary.requestPermissionsAsync();
                    if (status === 'granted') {
                        await MediaLibrary.saveToLibraryAsync(result.uri);
                        return { success: true, message: 'Disimpan ke galeri' };
                    }
                }

                // Share for other file types
                if (result.uri && await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(result.uri, {
                        mimeType: 'application/octet-stream',
                        dialogTitle: 'Simpan file',
                    });
                    return { success: true };
                }

                return { success: false, error: 'Tidak dapat menyimpan file' };
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal mengunduh';
            return { success: false, error: message };
        }
    }, [state.result, state.selectedFile, state.outputFormat]);

    const reset = useCallback(() => {
        setState({
            selectedFile: null,
            outputFormat: '',
            isConverting: false,
            progress: 0,
            result: null,
            error: null,
        });
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        ...state,
        availableFormats: state.selectedFile
            ? getOutputFormats(state.selectedFile.extension)
            : [],
        pickDocument,
        pickImage,
        setOutputFormat,
        convert,
        downloadResult,
        reset,
        clearError,
    };
};

export default useConversion;
