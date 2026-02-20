/**
 * Document Detection Utilities
 * Edge detection, perspective correction, and auto-enhancement
 * Note: True edge detection requires native modules or ML - this provides 
 * visual UI for manual corner adjustment with basic auto-detection hints
 */

import { Platform, Dimensions } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

// =====================================================
// TYPES
// =====================================================

export interface Point {
    x: number;
    y: number;
}

export interface Corners {
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;
}

export interface DetectionResult {
    detected: boolean;
    corners: Corners;
    confidence: number;
    documentType?: 'a4' | 'letter' | 'id-card' | 'business-card' | 'receipt' | 'custom';
}

export interface CropBounds {
    originX: number;
    originY: number;
    width: number;
    height: number;
}

// =====================================================
// DEFAULT CORNERS (Full image)
// =====================================================

export function getDefaultCorners(width: number, height: number): Corners {
    const padding = 0.1; // 10% padding from edges
    return {
        topLeft: { x: width * padding, y: height * padding },
        topRight: { x: width * (1 - padding), y: height * padding },
        bottomRight: { x: width * (1 - padding), y: height * (1 - padding) },
        bottomLeft: { x: width * padding, y: height * (1 - padding) },
    };
}

// =====================================================
// DOCUMENT ASPECT RATIOS
// =====================================================

export const DOCUMENT_RATIOS = {
    'a4': 210 / 297, // ~0.707
    'letter': 8.5 / 11, // ~0.773
    'id-card': 85.6 / 53.98, // ~1.586
    'business-card': 3.5 / 2, // 1.75
    'receipt': 0.4, // Tall and narrow
};

// =====================================================
// EDGE DETECTION (Basic Canvas-based for Web)
// =====================================================

/**
 * Detect document edges using canvas (web only)
 * For mobile, we use manual corner adjustment UI
 */
export async function detectEdges(
    imageUri: string,
    imageWidth: number,
    imageHeight: number
): Promise<DetectionResult> {
    // Default result if detection fails
    const defaultResult: DetectionResult = {
        detected: false,
        corners: getDefaultCorners(imageWidth, imageHeight),
        confidence: 0,
    };

    if (Platform.OS !== 'web') {
        // On native, return default corners for manual adjustment
        return {
            ...defaultResult,
            detected: false,
            corners: getDefaultCorners(imageWidth, imageHeight),
        };
    }

    try {
        // Web-based edge detection using canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';

        return new Promise((resolve) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(defaultResult);
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Get image data for edge detection
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const corners = findDocumentCorners(imageData, canvas.width, canvas.height);

                if (corners) {
                    resolve({
                        detected: true,
                        corners,
                        confidence: 0.7,
                        documentType: detectDocumentType(corners, canvas.width, canvas.height),
                    });
                } else {
                    resolve({
                        ...defaultResult,
                        corners: getDefaultCorners(canvas.width, canvas.height),
                    });
                }
            };

            img.onerror = () => resolve(defaultResult);
            img.src = imageUri;
        });
    } catch (error) {
        console.error('Edge detection error:', error);
        return defaultResult;
    }
}

/**
 * Find document corners using simple edge detection
 * This is a basic implementation - for production, use OpenCV or ML
 */
function findDocumentCorners(
    imageData: ImageData,
    width: number,
    height: number
): Corners | null {
    const data = imageData.data;

    // Convert to grayscale and apply edge detection
    const edges = new Uint8ClampedArray(width * height);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;

            // Simple Sobel edge detection
            const gx =
                -data[idx - 4 - width * 4] + data[idx + 4 - width * 4] +
                -2 * data[idx - 4] + 2 * data[idx + 4] +
                -data[idx - 4 + width * 4] + data[idx + 4 + width * 4];

            const gy =
                -data[idx - 4 - width * 4] - 2 * data[idx - width * 4] - data[idx + 4 - width * 4] +
                data[idx - 4 + width * 4] + 2 * data[idx + width * 4] + data[idx + 4 + width * 4];

            const magnitude = Math.sqrt(gx * gx + gy * gy);
            edges[y * width + x] = magnitude > 50 ? 255 : 0;
        }
    }

    // Find brightest corners (high contrast areas)
    // This is simplified - real implementation would use Hough transform
    const cornerRegionSize = Math.min(width, height) * 0.25;

    const regions = [
        { name: 'topLeft', startX: 0, startY: 0, endX: cornerRegionSize, endY: cornerRegionSize },
        { name: 'topRight', startX: width - cornerRegionSize, startY: 0, endX: width, endY: cornerRegionSize },
        { name: 'bottomRight', startX: width - cornerRegionSize, startY: height - cornerRegionSize, endX: width, endY: height },
        { name: 'bottomLeft', startX: 0, startY: height - cornerRegionSize, endX: cornerRegionSize, endY: height },
    ];

    const corners: Corners = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: width, y: 0 },
        bottomRight: { x: width, y: height },
        bottomLeft: { x: 0, y: height },
    };

    for (const region of regions) {
        let maxEdge = 0;
        let bestX = (region.startX + region.endX) / 2;
        let bestY = (region.startY + region.endY) / 2;

        for (let y = Math.floor(region.startY); y < Math.floor(region.endY); y++) {
            for (let x = Math.floor(region.startX); x < Math.floor(region.endX); x++) {
                const edgeValue = edges[y * width + x];
                if (edgeValue > maxEdge) {
                    maxEdge = edgeValue;
                    bestX = x;
                    bestY = y;
                }
            }
        }

        (corners as any)[region.name] = { x: bestX, y: bestY };
    }

    return corners;
}

/**
 * Detect document type based on aspect ratio
 */
function detectDocumentType(
    corners: Corners,
    imageWidth: number,
    imageHeight: number
): 'a4' | 'letter' | 'id-card' | 'business-card' | 'receipt' | 'custom' {
    const docWidth = Math.max(
        Math.abs(corners.topRight.x - corners.topLeft.x),
        Math.abs(corners.bottomRight.x - corners.bottomLeft.x)
    );
    const docHeight = Math.max(
        Math.abs(corners.bottomLeft.y - corners.topLeft.y),
        Math.abs(corners.bottomRight.y - corners.topRight.y)
    );

    const ratio = docWidth / docHeight;

    // Check against known ratios
    const tolerance = 0.15;

    if (Math.abs(ratio - DOCUMENT_RATIOS.a4) < tolerance) return 'a4';
    if (Math.abs(ratio - DOCUMENT_RATIOS.letter) < tolerance) return 'letter';
    if (Math.abs(ratio - DOCUMENT_RATIOS['id-card']) < tolerance) return 'id-card';
    if (Math.abs(ratio - DOCUMENT_RATIOS['business-card']) < tolerance) return 'business-card';
    if (ratio < 0.5) return 'receipt';

    return 'custom';
}

// =====================================================
// PERSPECTIVE CORRECTION
// =====================================================

/**
 * Calculate crop bounds from corners
 * Note: True perspective correction requires native modules
 * This provides basic crop functionality
 */
export function calculateCropBounds(
    corners: Corners,
    imageWidth: number,
    imageHeight: number
): CropBounds {
    // Find bounding box of the corners
    const minX = Math.min(corners.topLeft.x, corners.bottomLeft.x);
    const maxX = Math.max(corners.topRight.x, corners.bottomRight.x);
    const minY = Math.min(corners.topLeft.y, corners.topRight.y);
    const maxY = Math.max(corners.bottomLeft.y, corners.bottomRight.y);

    // Ensure bounds are within image
    const originX = Math.max(0, Math.floor(minX));
    const originY = Math.max(0, Math.floor(minY));
    const width = Math.min(imageWidth - originX, Math.ceil(maxX - minX));
    const height = Math.min(imageHeight - originY, Math.ceil(maxY - minY));

    return { originX, originY, width, height };
}

/**
 * Apply crop to image using expo-image-manipulator
 */
export async function cropToCorners(
    imageUri: string,
    corners: Corners,
    imageWidth: number,
    imageHeight: number
): Promise<string> {
    const bounds = calculateCropBounds(corners, imageWidth, imageHeight);

    const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: bounds }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result.uri;
}

// =====================================================
// CORNER ADJUSTMENT HELPERS
// =====================================================

/**
 * Check if a point is near a corner
 */
export function isNearCorner(
    point: Point,
    corner: Point,
    threshold: number = 30
): boolean {
    const dx = point.x - corner.x;
    const dy = point.y - corner.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
}

/**
 * Find which corner is closest to a point
 */
export function findClosestCorner(
    point: Point,
    corners: Corners,
    threshold: number = 50
): keyof Corners | null {
    const cornerNames: (keyof Corners)[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];

    let closestCorner: keyof Corners | null = null;
    let minDistance = Infinity;

    for (const name of cornerNames) {
        const corner = corners[name];
        const distance = Math.sqrt(
            Math.pow(point.x - corner.x, 2) +
            Math.pow(point.y - corner.y, 2)
        );

        if (distance < minDistance && distance < threshold) {
            minDistance = distance;
            closestCorner = name;
        }
    }

    return closestCorner;
}

/**
 * Validate corners (ensure they form a valid quadrilateral)
 */
export function validateCorners(corners: Corners): boolean {
    // Check that corners form a convex quadrilateral
    const { topLeft, topRight, bottomRight, bottomLeft } = corners;

    // Check horizontal order
    if (topLeft.x >= topRight.x || bottomLeft.x >= bottomRight.x) return false;

    // Check vertical order
    if (topLeft.y >= bottomLeft.y || topRight.y >= bottomRight.y) return false;

    // Check minimum size
    const minSize = 50;
    const width = Math.abs(topRight.x - topLeft.x);
    const height = Math.abs(bottomLeft.y - topLeft.y);
    if (width < minSize || height < minSize) return false;

    return true;
}

/**
 * Normalize corners to image dimensions
 */
export function normalizeCorners(
    corners: Corners,
    containerWidth: number,
    containerHeight: number,
    imageWidth: number,
    imageHeight: number
): Corners {
    const scaleX = imageWidth / containerWidth;
    const scaleY = imageHeight / containerHeight;

    return {
        topLeft: { x: corners.topLeft.x * scaleX, y: corners.topLeft.y * scaleY },
        topRight: { x: corners.topRight.x * scaleX, y: corners.topRight.y * scaleY },
        bottomRight: { x: corners.bottomRight.x * scaleX, y: corners.bottomRight.y * scaleY },
        bottomLeft: { x: corners.bottomLeft.x * scaleX, y: corners.bottomLeft.y * scaleY },
    };
}

/**
 * Scale corners to container dimensions
 */
export function scaleCorners(
    corners: Corners,
    imageWidth: number,
    imageHeight: number,
    containerWidth: number,
    containerHeight: number
): Corners {
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;

    return {
        topLeft: { x: corners.topLeft.x * scaleX, y: corners.topLeft.y * scaleY },
        topRight: { x: corners.topRight.x * scaleX, y: corners.topRight.y * scaleY },
        bottomRight: { x: corners.bottomRight.x * scaleX, y: corners.bottomRight.y * scaleY },
        bottomLeft: { x: corners.bottomLeft.x * scaleX, y: corners.bottomLeft.y * scaleY },
    };
}

// =====================================================
// MULTI-DOCUMENT DETECTION (Placeholder)
// =====================================================

export interface MultiDocumentResult {
    documents: DetectionResult[];
    totalDetected: number;
}

/**
 * Detect multiple documents in a single frame
 * Note: This is a placeholder - real implementation requires ML
 */
export async function detectMultipleDocuments(
    imageUri: string,
    imageWidth: number,
    imageHeight: number
): Promise<MultiDocumentResult> {
    // For now, just detect single document
    const result = await detectEdges(imageUri, imageWidth, imageHeight);

    return {
        documents: [result],
        totalDetected: result.detected ? 1 : 0,
    };
}

// =====================================================
// PAGE CURL DETECTION (Placeholder)
// =====================================================

export interface PageCurlResult {
    hasCurl: boolean;
    curlDirection?: 'left' | 'right' | 'top' | 'bottom';
    curlIntensity: number; // 0-1
}

/**
 * Detect page curl in books/magazines
 * Note: This is a placeholder - real implementation requires ML
 */
export function detectPageCurl(
    imageUri: string
): Promise<PageCurlResult> {
    // Placeholder - always returns no curl
    return Promise.resolve({
        hasCurl: false,
        curlIntensity: 0,
    });
}

export default {
    detectEdges,
    getDefaultCorners,
    calculateCropBounds,
    cropToCorners,
    isNearCorner,
    findClosestCorner,
    validateCorners,
    normalizeCorners,
    scaleCorners,
    detectMultipleDocuments,
    detectPageCurl,
    DOCUMENT_RATIOS,
};
