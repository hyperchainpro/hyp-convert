/**
 * Enhanced Data Converter using Premium Libraries
 * - papaparse: CSV parsing & generation
 * - exceljs: Excel processing
 * - js-yaml: YAML conversion
 * - xml2js: XML processing
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import yaml from 'js-yaml';
import * as xml2js from 'xml2js';
import * as FileUtils from './fileUtils';
import { convertScientificData } from './scientificConverter';
import { markdownToHTMLEnhanced, htmlToMarkdownEnhanced } from './documentConverter';

/**
 * CSV to JSON with auto-detection and error handling
 */
export const csvToJsonEnhanced = (csvString: string): any[] => {
    const result = Papa.parse(csvString, {
        header: true,
        dynamicTyping: true, // Auto-convert numbers
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: any) => typeof value === 'string' ? value.trim() : value,
    });

    if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
    }

    return result.data;
};

/**
 * JSON to CSV with proper quoting and escaping
 */
export const jsonToCsvEnhanced = (jsonData: any[]): string => {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('Invalid JSON data for CSV conversion');
    }

    const csv = Papa.unparse(jsonData, {
        quotes: true, // Quote all fields
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ',',
        header: true,
        newline: '\r\n',
    });

    return csv;
};

/**
 * TSV to CSV conversion
 */
export const tsvToCsvEnhanced = (tsvString: string): string => {
    const result = Papa.parse(tsvString, {
        delimiter: '\t',
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
    });

    return Papa.unparse(result.data);
};

/**
 * CSV to TSV conversion
 */
export const csvToTsvEnhanced = (csvString: string): string => {
    const result = Papa.parse(csvString, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
    });

    return Papa.unparse(result.data, {
        delimiter: '\t',
        header: true,
    });
};

/**
 * YAML to JSON with validation
 */
export const yamlToJsonEnhanced = (yamlString: string): any => {
    try {
        const data = yaml.load(yamlString, {
            schema: yaml.JSON_SCHEMA,
            json: true,
        });
        return data;
    } catch (error) {
        throw new Error(`YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * JSON to YAML with formatting
 */
export const jsonToYamlEnhanced = (jsonData: any): string => {
    try {
        const yamlString = yaml.dump(jsonData, {
            indent: 2,
            lineWidth: 80,
            noRefs: true,
            sortKeys: false,
        });
        return yamlString;
    } catch (error) {
        throw new Error(`YAML generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * XML to JSON with attribute handling
 */
export const xmlToJsonEnhanced = async (xmlString: string): Promise<any> => {
    const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        trim: true,
        normalizeTags: true,
        normalize: true,
    });

    try {
        const result = await parser.parseStringPromise(xmlString);
        return result;
    } catch (error) {
        throw new Error(`XML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * JSON to XML with proper formatting
 */
export const jsonToXmlEnhanced = (jsonData: any, rootElement: string = 'root'): string => {
    const builder = new xml2js.Builder({
        rootName: rootElement,
        xmldec: { version: '1.0', encoding: 'UTF-8' },
        renderOpts: { pretty: true, indent: '  ', newline: '\n' },
    });

    try {
        const xml = builder.buildObject(jsonData);
        return xml;
    } catch (error) {
        throw new Error(`XML generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Excel to JSON (reads first sheet)
 */
export const excelToJsonEnhanced = async (excelData: ArrayBuffer): Promise<any[]> => {
    try {
        const workbook = XLSX.read(excelData, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            defval: '',
            blankrows: false,
        }) as any[];
        return jsonData;
    } catch (error) {
        throw new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * JSON to Excel with formatting
 */
export const jsonToExcelEnhanced = (jsonData: any[], sheetName: string = 'Sheet1'): ArrayBuffer => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(jsonData);

        // Auto-size columns
        const colWidths: any[] = [];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxWidth = 10;
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellAddress];
                if (cell && cell.v) {
                    const cellText = String(cell.v);
                    maxWidth = Math.max(maxWidth, cellText.length);
                }
            }
            colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
        }
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        const excelBuffer = XLSX.write(workbook, {
            type: 'array',
            bookType: 'xlsx',
        });

        return excelBuffer;
    } catch (error) {
        throw new Error(`Excel generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Parse INI format to JSON
 */
export const iniToJsonEnhanced = (iniString: string): any => {
    const result: any = {};
    let currentSection: string | null = null;

    iniString.split('\n').forEach(line => {
        line = line.trim();

        // Skip empty lines and comments
        if (!line || line.startsWith(';') || line.startsWith('#')) {
            return;
        }

        // Section header
        if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.slice(1, -1).trim();
            result[currentSection] = {};
            return;
        }

        // Key-value pair
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
            const key = line.slice(0, equalIndex).trim();
            const value = line.slice(equalIndex + 1).trim();

            if (currentSection) {
                result[currentSection][key] = value;
            } else {
                result[key] = value;
            }
        }
    });

    return result;
};

/**
 * Convert log file to structured JSON
 */
export const logToJsonEnhanced = (logString: string): any[] => {
    const lines = logString.split('\n');
    const entries: any[] = [];

    lines.forEach((line, index) => {
        line = line.trim();
        if (!line) return;

        // Try to parse common log formats
        // Format: [timestamp] level: message
        const match = line.match(/^\[([^\]]+)\]\s*(\w+):\s*(.+)$/);

        if (match) {
            entries.push({
                lineNumber: index + 1,
                timestamp: match[1],
                level: match[2],
                message: match[3],
            });
        } else {
            entries.push({
                lineNumber: index + 1,
                message: line,
            });
        }
    });

    return entries;
};

/**
 * Parse SRT subtitles to JSON
 */
export const srtToJsonEnhanced = (srtString: string): any[] => {
    const entries: any[] = [];
    const blocks = srtString.trim().split('\n\n');

    blocks.forEach(block => {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            const id = lines[0].trim();
            const timestamp = lines[1].trim();
            const text = lines.slice(2).join('\n').trim();

            entries.push({
                id: parseInt(id),
                timestamp,
                text,
            });
        }
    });

    return entries;
};

// =========================================
// BACKWARD COMPATIBILITY EXPORTS
// =========================================

export const yamlToJson = async (uri: string) => {
    try {
        const content = await FileUtils.readAsStringAsync(uri);
        const data = yamlToJsonEnhanced(content);
        return { success: true, content: JSON.stringify(data) };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'YAML parse failed' }; }
};

export const jsonToYaml = async (uri: string) => {
    return convertScientificData(uri, 'json', 'yaml');
};

export const tsvToCsv = async (uri: string) => {
    try {
        const content = await FileUtils.readAsStringAsync(uri);
        const csv = tsvToCsvEnhanced(content);
        return { success: true, content: csv };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'TSV conversion failed' }; }
};

export const csvToTsv = async (uri: string) => {
    try {
        const content = await FileUtils.readAsStringAsync(uri);
        const tsv = csvToTsvEnhanced(content);
        return { success: true, content: tsv };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'CSV conversion failed' }; }
};

export const iniToJson = async (uri: string) => {
    try {
        const content = await FileUtils.readAsStringAsync(uri);
        const data = iniToJsonEnhanced(content);
        return { success: true, content: JSON.stringify(data) };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'INI conversion failed' }; }
};

export const logToJson = async (uri: string) => {
    try {
        const content = await FileUtils.readAsStringAsync(uri);
        const data = logToJsonEnhanced(content);
        return { success: true, content: JSON.stringify(data) };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Log conversion failed' }; }
};

export const srtToJson = async (uri: string) => {
    try {
        const content = await FileUtils.readAsStringAsync(uri);
        const data = srtToJsonEnhanced(content);
        return { success: true, content: JSON.stringify(data) };
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'SRT conversion failed' }; }
};

export const tomlToJson = async (uri: string) => {
    const result = await convertScientificData(uri, 'toml', 'json');
    return { success: result.success, content: result.content, error: result.error };
};

export const sqlToJson = async (uri: string) => {
    const result = await convertScientificData(uri, 'sql', 'json');
    return { success: result.success, content: result.content, error: result.error };
};

export const mdToHtml = async (uri: string) => {
    try {
        const content = await FileUtils.readAsStringAsync(uri);
        const html = markdownToHTMLEnhanced(content);
        return { success: true, content: html };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'MD conversion failed' };
    }
};

export const htmlToMd = async (uri: string) => {
    try {
        const content = await FileUtils.readAsStringAsync(uri);
        const md = htmlToMarkdownEnhanced(content);
        return { success: true, content: md };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'HTML conversion failed' };
    }
};

