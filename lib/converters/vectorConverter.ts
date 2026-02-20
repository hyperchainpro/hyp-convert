/**
 * Vector Graphics Converter
 * Handles: SVG → PNG/JPG/WebP/PDF/HTML
 * 
 * Web: Uses Canvas API for high-quality rasterization
 * Mobile: Falls back to HTML wrapper for WebView rendering
 */

import { Platform } from 'react-native';
import * as FileUtils from './fileUtils';

/**
 * Convert SVG to HTML (Preview wrapper)
 */
export const svgToHtml = async (svgUri: string): Promise<{ content?: string; success: boolean; error?: string }> => {
    try {
        const svgContent = await FileUtils.readAsStringAsync(svgUri);

        // Extract viewBox or width/height from SVG for proper sizing
        const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
        const widthMatch = svgContent.match(/width="([^"]+)"/);
        const heightMatch = svgContent.match(/height="([^"]+)"/);

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>SVG Preview</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        min-height: 100vh; 
                        background: #f5f5f5;
                        padding: 20px;
                    }
                    .svg-container {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        max-width: 100%;
                        overflow: auto;
                    }
                    .svg-container svg {
                        max-width: 100%;
                        height: auto;
                    }
                </style>
            </head>
            <body>
                <div class="svg-container">
                    ${svgContent}
                </div>
            </body>
            </html>
        `;

        return { content: html, success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to convert SVG' };
    }
};

/**
 * Convert SVG to raster image (PNG/JPG/WebP) using Canvas API
 * Web only - Mobile returns HTML wrapper
 */
export const svgToImage = async (
    svgUri: string,
    format: 'png' | 'jpg' | 'jpeg' | 'webp' = 'png',
    options: { width?: number; height?: number; quality?: number; background?: string } = {}
): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        if (Platform.OS !== 'web') {
            // Mobile: Return HTML wrapper that can be captured by WebView
            return await svgToHtml(svgUri);
        }

        const svgContent = await FileUtils.readAsStringAsync(svgUri);
        const { quality = 0.92, background } = options;

        return new Promise((resolve, reject) => {
            // Create a blob URL from the SVG content
            const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                try {
                    // Determine canvas dimensions
                    const width = options.width || img.naturalWidth || 800;
                    const height = options.height || img.naturalHeight || 600;

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve({ success: false, error: 'Canvas context not available' });
                        return;
                    }

                    // Fill background if specified (important for JPG which doesn't support transparency)
                    if (background || format === 'jpg' || format === 'jpeg') {
                        ctx.fillStyle = background || '#ffffff';
                        ctx.fillRect(0, 0, width, height);
                    }

                    // Draw SVG image to canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to target format
                    const mimeType = format === 'png' ? 'image/png' :
                        format === 'webp' ? 'image/webp' :
                            'image/jpeg';

                    canvas.toBlob(
                        (blob) => {
                            URL.revokeObjectURL(svgUrl);
                            if (blob) {
                                const uri = URL.createObjectURL(blob);
                                resolve({ uri, success: true });
                            } else {
                                resolve({ success: false, error: 'Failed to create image blob' });
                            }
                        },
                        mimeType,
                        quality
                    );
                } catch (error) {
                    URL.revokeObjectURL(svgUrl);
                    resolve({ success: false, error: error instanceof Error ? error.message : 'Canvas rendering failed' });
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(svgUrl);
                resolve({ success: false, error: 'Failed to load SVG for conversion' });
            };

            img.src = svgUrl;
        });
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'SVG conversion failed' };
    }
};

/**
 * Convert SVG to PDF
 * Web: Renders SVG to canvas then embeds in PDF via jsPDF
 * Mobile: Wraps in HTML and uses HTML→PDF
 */
export const svgToPdf = async (svgUri: string): Promise<{ uri?: string; success: boolean; error?: string }> => {
    try {
        if (Platform.OS === 'web') {
            const svgContent = await FileUtils.readAsStringAsync(svgUri);

            // Use jsPDF with SVG support
            const { jsPDF } = await import('jspdf');
            // First render to PNG, then embed in PDF
            const pngResult = await svgToImage(svgUri, 'png', { width: 1200, height: 900 });

            if (!pngResult.success || !pngResult.uri) {
                // Fallback: use HTML-based conversion
                const htmlResult = await svgToHtml(svgUri);
                if (htmlResult.content) {
                    const { htmlToPDFAdvanced } = await import('./advancedConverters');
                    return await htmlToPDFAdvanced(htmlResult.content);
                }
                return { success: false, error: 'SVG to PDF failed on both methods' };
            }

            // Create PDF with embedded image
            const doc = new jsPDF({
                orientation: 'l',
                unit: 'pt',
                format: 'a4',
            });

            // Fetch PNG blob and convert to data URL
            const response = await fetch(pngResult.uri);
            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 40;

            doc.addImage(dataUrl, 'PNG', margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

            const pdfBlob = doc.output('blob');
            const uri = URL.createObjectURL(pdfBlob);

            return { uri, success: true };
        } else {
            // Mobile: Wrap in HTML then convert
            const htmlResult = await svgToHtml(svgUri);
            if (htmlResult.content) {
                const { htmlToPDFAdvanced } = await import('./advancedConverters');
                return await htmlToPDFAdvanced(htmlResult.content);
            }
            return { success: false, error: 'SVG to PDF failed' };
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'SVG to PDF failed' };
    }
};

/**
 * Backward compat alias
 */
export const svgToPngHelper = svgToImage;
