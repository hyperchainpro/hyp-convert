/**
 * Scientific & Data Converter Module
 * Handles: JSON, YAML, TOML, XML, SQL, CSV cross-conversion
 * 
 * Libraries:
 *  - js-yaml: YAML parsing/generation
 *  - @iarna/toml: TOML parsing/generation
 *  - fast-xml-parser: XML parsing/generation
 *  - papaparse: CSV parsing/generation
 */

import yaml from 'js-yaml';
import toml from '@iarna/toml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { unparse as papaparseUnparse, parse as papaparseParse } from 'papaparse';
import * as FileUtils from './fileUtils';

// =========================================
// TYPES & INTERFACES
// =========================================

type DataFormat = 'json' | 'yaml' | 'toml' | 'xml' | 'csv' | 'sql';

interface ConvertDataOptions {
    compact?: boolean; // For JSON/XML minification
    sqlTableName?: string; // For SQL export
    rootElement?: string; // For XML root element name
}

// =========================================
// PARSING: String → Object
// =========================================

/**
 * Parses raw text content into a JavaScript Object
 */
const parseData = (content: string, format: DataFormat): any => {
    try {
        switch (format) {
            case 'json':
                return JSON.parse(content);

            case 'yaml':
                return yaml.load(content, { schema: yaml.DEFAULT_SCHEMA });

            case 'toml':
                return toml.parse(content);

            case 'xml': {
                const parser = new XMLParser({
                    ignoreAttributes: false,
                    attributeNamePrefix: '@_',
                    textNodeName: '#text',
                    parseTagValue: true,
                    trimValues: true,
                });
                return parser.parse(content);
            }

            case 'csv': {
                const result = papaparseParse(content, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                });
                if (result.errors.length > 0) {
                    console.warn('CSV parse warnings:', result.errors);
                }
                return result.data;
            }

            case 'sql':
                // SQL parsing: extract INSERT statements to objects
                return parseSqlInserts(content);

            default:
                throw new Error(`Format input tidak didukung: ${format}`);
        }
    } catch (e) {
        throw new Error(`Gagal mem-parse ${format.toUpperCase()}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
};

/**
 * Basic SQL INSERT parser
 */
const parseSqlInserts = (sql: string): any[] => {
    const results: any[] = [];

    // Match INSERT INTO "table" (col1, col2) VALUES (val1, val2)
    const insertRegex = /INSERT\s+INTO\s+["`']?(\w+)["`']?\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi;
    let match;

    while ((match = insertRegex.exec(sql)) !== null) {
        const columns = match[2].split(',').map(c => c.trim().replace(/["`']/g, ''));
        const valuesStr = match[3];

        // Parse values (handle quoted strings and numbers)
        const values = parseValues(valuesStr);

        const row: any = {};
        columns.forEach((col, i) => {
            row[col] = i < values.length ? values[i] : null;
        });
        results.push(row);
    }

    return results;
};

/**
 * Parse SQL VALUES string into array
 */
const parseValues = (valuesStr: string): any[] => {
    const values: any[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];

        if (inString) {
            if (char === stringChar && valuesStr[i + 1] !== stringChar) {
                inString = false;
                values.push(current);
                current = '';
            } else if (char === stringChar && valuesStr[i + 1] === stringChar) {
                current += char;
                i++; // Skip escaped quote
            } else {
                current += char;
            }
        } else if (char === "'" || char === '"') {
            inString = true;
            stringChar = char;
            current = '';
        } else if (char === ',') {
            const trimmed = current.trim();
            if (trimmed && trimmed !== '') {
                if (trimmed === 'NULL') values.push(null);
                else if (trimmed === 'TRUE') values.push(true);
                else if (trimmed === 'FALSE') values.push(false);
                else if (!isNaN(Number(trimmed))) values.push(Number(trimmed));
                else values.push(trimmed);
            }
            current = '';
        } else {
            current += char;
        }
    }

    // Handle last value
    const trimmed = current.trim();
    if (trimmed) {
        if (trimmed === 'NULL') values.push(null);
        else if (trimmed === 'TRUE') values.push(true);
        else if (trimmed === 'FALSE') values.push(false);
        else if (!isNaN(Number(trimmed))) values.push(Number(trimmed));
        else values.push(trimmed);
    }

    return values;
};

// =========================================
// STRINGIFICATION: Object → String
// =========================================

/**
 * Stringifies a JavaScript Object into target format
 */
const stringifyData = (data: any, format: DataFormat, options: ConvertDataOptions = {}): string => {
    try {
        switch (format) {
            case 'json':
                return options.compact ? JSON.stringify(data) : JSON.stringify(data, null, 2);

            case 'yaml':
                return yaml.dump(data, {
                    indent: 2,
                    lineWidth: 120,
                    noRefs: true,
                    sortKeys: false,
                });

            case 'toml': {
                // TOML requires root to be an object, not an array
                let tomlData = data;
                if (Array.isArray(data)) {
                    tomlData = { items: data };
                }
                // Ensure all values are TOML-compatible
                tomlData = sanitizeForToml(tomlData);
                return toml.stringify(tomlData);
            }

            case 'xml': {
                const builder = new XMLBuilder({
                    format: !options.compact,
                    ignoreAttributes: false,
                    attributeNamePrefix: '@_',
                    textNodeName: '#text',
                    suppressEmptyNode: true,
                });

                // XML needs a root element
                let xmlData = data;
                if (Array.isArray(data)) {
                    xmlData = { [options.rootElement || 'root']: { item: data } };
                } else if (typeof data === 'object' && data !== null) {
                    const keys = Object.keys(data);
                    if (keys.length !== 1) {
                        xmlData = { [options.rootElement || 'root']: data };
                    }
                }
                return builder.build(xmlData);
            }

            case 'csv': {
                // Ensure data is an array of objects
                const rows = Array.isArray(data) ? data : [data];
                return papaparseUnparse(rows, {
                    quotes: true,
                    header: true,
                });
            }

            case 'sql':
                return generateSqlInsert(data, options.sqlTableName || 'converted_data');

            default:
                throw new Error(`Format output tidak didukung: ${format}`);
        }
    } catch (e) {
        throw new Error(`Gagal generate ${format.toUpperCase()}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
};

/**
 * Sanitize data for TOML compatibility
 * TOML doesn't support null, undefined, or mixed arrays
 */
const sanitizeForToml = (data: any): any => {
    if (data === null || data === undefined) return '';
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        // TOML arrays must be homogeneous
        return data.map(item => sanitizeForToml(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) {
            result[key] = '';
        } else if (value instanceof Date) {
            result[key] = value.toISOString();
        } else if (typeof value === 'object') {
            result[key] = sanitizeForToml(value);
        } else {
            result[key] = value;
        }
    }
    return result;
};

/**
 * Generate SQL INSERT statements from data
 */
const generateSqlInsert = (data: any, tableName: string): string => {
    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return `-- Tidak ada data untuk dimasukkan\n`;

    // Get all unique keys from all rows
    const allKeys = new Set<string>();
    rows.forEach(row => {
        if (typeof row === 'object' && row !== null) {
            Object.keys(row).forEach(key => allKeys.add(key));
        }
    });

    const headers = Array.from(allKeys);
    if (headers.length === 0) return `-- Tidak ada kolom ditemukan\n`;

    // Create CREATE TABLE statement
    let sql = `-- Auto-generated SQL\n`;
    sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
    sql += headers.map(h => `  "${h}" TEXT`).join(',\n');
    sql += `\n);\n\n`;

    // Sanitize column names
    const columns = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(', ');

    // Generate INSERT statements (batch of 50 for performance)
    for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const values = batch.map(row => {
            const vals = headers.map(header => {
                const val = row[header];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'number') return val;
                if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                return `'${String(val).replace(/'/g, "''")}'`;
            });
            return `(${vals.join(', ')})`;
        }).join(',\n');

        sql += `INSERT INTO "${tableName}" (${columns})\nVALUES\n${values};\n\n`;
    }

    return sql;
};

// =========================================
// PUBLIC API
// =========================================

/**
 * Main conversion function for Scientific/Data formats
 */
export const convertScientificData = async (
    sourceUri: string,
    sourceFormat: DataFormat,
    targetFormat: DataFormat,
    options: ConvertDataOptions = {}
): Promise<{ uri?: string; content?: string; success: boolean; error?: string }> => {
    try {
        // 1. Read file
        const inputContent = await FileUtils.readAsStringAsync(sourceUri);

        // 2. Parse to Intermediate Object
        const dataObj = parseData(inputContent, sourceFormat);

        // 3. Stringify to Target
        const outputContent = stringifyData(dataObj, targetFormat, options);

        // 4. Write to file
        const outputFilename = `converted.${targetFormat}`;
        const outputUri = await FileUtils.writeAsStringAsync(
            `${FileUtils.getCacheDirectory()}${outputFilename}`,
            outputContent
        );

        return {
            success: true,
            uri: outputUri,
            content: outputContent
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown conversion error'
        };
    }
};

/**
 * Convert data from string input (no file reading needed)
 */
export const convertDataString = (
    input: string,
    sourceFormat: DataFormat,
    targetFormat: DataFormat,
    options: ConvertDataOptions = {}
): { content?: string; success: boolean; error?: string } => {
    try {
        const dataObj = parseData(input, sourceFormat);
        const output = stringifyData(dataObj, targetFormat, options);
        return { success: true, content: output };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Conversion error' };
    }
};
