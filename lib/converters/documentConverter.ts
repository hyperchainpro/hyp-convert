/**
 * Enhanced Document Converter
 * Libraries used:
 *  - mammoth: DOCX → HTML (preserves formatting, images)
 *  - showdown: Markdown → HTML (GFM compatible)
 *  - turndown: HTML → Markdown (with table support)
 *  - docx: Text → DOCX generation
 * 
 * All libraries are loaded with try/catch to prevent crashes if unavailable
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

// =========================================
// LIBRARY LOADING (with guards)
// =========================================

let mammoth: any = null;
let Showdown: any = null;
let TurndownService: any = null;

try {
    mammoth = require('mammoth');
} catch (e) {
    console.warn('mammoth not available:', e);
}

try {
    Showdown = require('showdown');
} catch (e) {
    console.warn('showdown not available:', e);
}

try {
    TurndownService = require('turndown');
} catch (e) {
    console.warn('turndown not available:', e);
}

// =========================================
// DOCX CONVERSIONS
// =========================================

/**
 * Convert DOCX to HTML with full formatting and image preservation
 */
export const docxToHtmlEnhanced = async (docxUri: string): Promise<string> => {
    if (!mammoth) {
        throw new Error('Library mammoth tidak tersedia. Silakan install: npm install mammoth');
    }

    try {
        let arrayBuffer: ArrayBuffer;

        if (Platform.OS === 'web') {
            const response = await fetch(docxUri);
            arrayBuffer = await response.arrayBuffer();
        } else {
            const base64 = await FileSystem.readAsStringAsync(docxUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const buffer = Buffer.from(base64, 'base64');
            arrayBuffer = new Uint8Array(buffer).buffer;
        }

        const result = await mammoth.convertToHtml(
            { arrayBuffer },
            {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                    "p[style-name='Heading 4'] => h4:fresh",
                    "r[style-name='Strong'] => strong",
                    "r[style-name='Emphasis'] => em",
                    "p[style-name='Quote'] => blockquote:fresh",
                ],
                includeDefaultStyleMap: true,
                convertImage: mammoth.images.imgElement((image: any) => {
                    return image.read('base64').then((imageBuffer: string) => {
                        return {
                            src: `data:${image.contentType};base64,${imageBuffer}`,
                        };
                    });
                }),
            }
        );

        if (result.messages.length > 0) {
            console.warn('DOCX conversion warnings:', result.messages);
        }

        return result.value;
    } catch (error) {
        console.error('DOCX to HTML conversion error:', error);
        throw new Error(`Gagal mengkonversi DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Convert DOCX to plain text (preserves structure)
 */
export const docxToTextEnhanced = async (docxUri: string): Promise<string> => {
    if (!mammoth) {
        throw new Error('Library mammoth tidak tersedia. Silakan install: npm install mammoth');
    }

    try {
        let arrayBuffer: ArrayBuffer;

        if (Platform.OS === 'web') {
            const response = await fetch(docxUri);
            arrayBuffer = await response.arrayBuffer();
        } else {
            const base64 = await FileSystem.readAsStringAsync(docxUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const buffer = Buffer.from(base64, 'base64');
            arrayBuffer = new Uint8Array(buffer).buffer;
        }

        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error('DOCX to text conversion error:', error);
        throw new Error(`Gagal mengkonversi DOCX ke teks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// =========================================
// MARKDOWN ↔ HTML CONVERSIONS
// =========================================

/**
 * Convert Markdown to HTML with enhanced features (GFM compatible)
 */
export const markdownToHTMLEnhanced = (markdown: string): string => {
    if (Showdown) {
        try {
            const converter = new Showdown.Converter({
                tables: true,
                tasklists: true,
                strikethrough: true,
                ghCodeBlocks: true,
                ghCompatibleHeaderId: true,
                simplifiedAutoLink: true,
                simpleLineBreaks: true,
                openLinksInNewWindow: true,
                emoji: true,
                underline: true,
                metadata: false,
                parseImgDimensions: true,
            });
            return converter.makeHtml(markdown);
        } catch (e) {
            console.warn('Showdown failed, using fallback:', e);
        }
    }

    // Fallback: Try marked library
    try {
        const { marked } = require('marked');
        return marked(markdown) as string;
    } catch (e) {
        // Last resort: basic regex conversion
        return markdownToHTMLBasic(markdown);
    }
};

/**
 * Basic Markdown → HTML fallback (no external libraries)
 */
const markdownToHTMLBasic = (markdown: string): string => {
    let html = markdown;

    // Code blocks (must be before other inline processing)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Headers
    html = html.replace(/^######\s+(.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.*$)/gim, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/gim, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/gim, '<em>$1</em>');
    html = html.replace(/_(.+?)_/gim, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/gim, '<del>$1</del>');

    // Links & images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" style="max-width:100%;">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    // Blockquotes
    html = html.replace(/^>\s+(.*$)/gim, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');
    html = html.replace(/^\*\*\*$/gim, '<hr>');

    // Lists
    html = html.replace(/^\*\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^-\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>');

    // Paragraphs
    html = html.split('\n\n').map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') ||
            trimmed.startsWith('<blockquote') || trimmed.startsWith('<li') ||
            trimmed.startsWith('<hr') || trimmed.startsWith('<img')) {
            return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
};

/**
 * Convert HTML to Markdown with structure preservation
 */
export const htmlToMarkdownEnhanced = (html: string): string => {
    if (TurndownService) {
        try {
            const turndownService = new TurndownService({
                headingStyle: 'atx',
                hr: '---',
                bulletListMarker: '-',
                codeBlockStyle: 'fenced',
                emDelimiter: '_',
                strongDelimiter: '**',
            });

            // Add table support rule
            turndownService.addRule('table', {
                filter: 'table',
                replacement: (content: string, node: any) => {
                    return '\n\n' + content + '\n\n';
                },
            });

            return turndownService.turndown(html);
        } catch (e) {
            console.warn('Turndown failed, using fallback:', e);
        }
    }

    // Fallback: basic HTML → Markdown via regex
    return htmlToMarkdownBasic(html);
};

/**
 * Basic HTML → Markdown fallback (no external libraries)
 */
const htmlToMarkdownBasic = (html: string): string => {
    let md = html;

    // Remove script and style
    md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Headings
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

    // Bold & italic
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_');

    // Links & images
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');

    // Lists
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

    // Line breaks and paragraphs
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<\/(p|div)>/gi, '\n\n');

    // Remove remaining tags
    md = md.replace(/<[^>]+>/g, '');

    // Decode entities
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');

    // Clean whitespace
    md = md.replace(/\n\s*\n\s*\n/g, '\n\n');

    return md.trim();
};

// =========================================
// TEXT/HTML UTILITIES
// =========================================

/**
 * Convert plain text to HTML with proper formatting
 */
export const textToHTMLEnhanced = (text: string, title?: string): string => {
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const paragraphs = escaped.split(/\n\s*\n/).map(para => {
        const lines = para.split('\n').join('<br>');
        return `<p>${lines}</p>`;
    }).join('\n');

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Converted Document'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background: #fff;
        }
        p { margin: 1em 0; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 14px; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
        blockquote { border-left: 4px solid #4361ee; margin: 1em 0; padding: 0.5em 1em; background: #f8f9fa; }
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: 600; }
        img { max-width: 100%; height: auto; border-radius: 4px; }
    </style>
</head>
<body>
${paragraphs}
</body>
</html>
    `.trim();
};

/**
 * Extract text from HTML (strip tags with structure preservation)
 */
export const htmlToTextEnhanced = (html: string): string => {
    let text = html;

    // Remove script and style tags
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Convert block elements to line breaks
    text = text.replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<li[^>]*>/gi, '• ');

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    if (Platform.OS === 'web') {
        try {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            text = textarea.value;
        } catch {
            text = decodeBasicEntities(text);
        }
    } else {
        text = decodeBasicEntities(text);
    }

    // Clean up whitespace
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    return text.trim();
};

/**
 * Decode basic HTML entities
 */
const decodeBasicEntities = (text: string): string => {
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
        .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
};

/**
 * Sanitize HTML for safe display
 */
export const sanitizeHTML = (html: string): string => {
    let clean = html;
    clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    clean = clean.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    clean = clean.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
    clean = clean.replace(/<embed[^>]*>/gi, '');
    clean = clean.replace(/on\w+="[^"]*"/gi, '');
    clean = clean.replace(/on\w+='[^']*'/gi, '');
    clean = clean.replace(/javascript:/gi, '');
    clean = clean.replace(/vbscript:/gi, '');
    return clean;
};
