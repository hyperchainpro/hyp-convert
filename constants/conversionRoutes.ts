/**
 * Conversion Format Catalog
 * Defines all supported conversion pairs with metadata
 */

export interface ConversionRoute {
    id: string;
    from: string;
    to: string;
    label: string;
    icon: string;
    color: string;
    category: 'document' | 'spreadsheet' | 'data' | 'markup' | 'image';
    library: string;
    quality: 'high' | 'medium' | 'basic';
}

export const CONVERSION_ROUTES: ConversionRoute[] = [
    // ===== IMAGE & OCR =====
    {
        id: 'image-txt',
        from: 'image', // Needs UI to handle generic 'image' or specific like 'png'
        to: 'txt',
        label: 'Image → Text (OCR)',
        icon: 'text-recognition',
        color: '#FF9500',
        category: 'image',
        library: 'tesseract',
        quality: 'high',
    },
    {
        id: 'image-pdf',
        from: 'image',
        to: 'pdf',
        label: 'Image → PDF',
        icon: 'file-pdf-box',
        color: '#FF3B30',
        category: 'image',
        library: 'pdf-lib',
        quality: 'high',
    },

    {
        id: 'heic-jpg',
        from: 'heic',
        to: 'jpg',
        label: 'HEIC → JPG',
        icon: 'camera-image',
        color: '#FF9500',
        category: 'image',
        library: 'expo-image',
        quality: 'high',
    },
    {
        id: 'webp-jpg',
        from: 'webp',
        to: 'jpg',
        label: 'WEBP → JPG',
        icon: 'image',
        color: '#FF9500',
        category: 'image',
        library: 'expo-image',
        quality: 'high',
    },
    {
        id: 'svg-png',
        from: 'svg',
        to: 'png',
        label: 'SVG → PNG',
        icon: 'svg',
        color: '#FFCC00',
        category: 'image',
        library: 'canvas',
        quality: 'high',
    },
    {
        id: 'bmp-jpg',
        from: 'bmp',
        to: 'jpg',
        label: 'BMP → JPG',
        icon: 'image-outline',
        color: '#FF3B30',
        category: 'image',
        library: 'expo-image',
        quality: 'high',
    },
    {
        id: 'gif-jpg',
        from: 'gif',
        to: 'jpg',
        label: 'GIF → JPG',
        icon: 'file-gif-box',
        color: '#FF3B30',
        category: 'image',
        library: 'expo-image',
        quality: 'high',
    },
    {
        id: 'png-jpg',
        from: 'png',
        to: 'jpg',
        label: 'PNG → JPG',
        icon: 'image-outline',
        color: '#FF3B30',
        category: 'image',
        library: 'expo-image',
        quality: 'high',
    },
    {
        id: 'jpg-png',
        from: 'jpg',
        to: 'png',
        label: 'JPG → PNG',
        icon: 'file-image',
        color: '#FF3B30',
        category: 'image',
        library: 'expo-image',
        quality: 'high',
    },

    // ===== PDF SECURITY =====
    {
        id: 'pdf-protect',
        from: 'pdf',
        to: 'pdf',
        label: 'PDF Protect',
        icon: 'lock',
        color: '#32ADE6',
        category: 'document',
        library: 'pdf-lib',
        quality: 'high',
    },

    // ===== DOCUMENT CONVERSIONS =====
    {
        id: 'pdf-jpg',
        from: 'pdf',
        to: 'jpg',
        label: 'PDF → JPG (Images)',
        icon: 'file-jpg-box',
        color: '#FF3B30',
        category: 'image',
        library: 'pdfjs',
        quality: 'high',
    },
    {
        id: 'pdf-png',
        from: 'pdf',
        to: 'png',
        label: 'PDF → PNG (Images)',
        icon: 'file-image',
        color: '#FF3B30',
        category: 'image',
        library: 'pdfjs',
        quality: 'high',
    },
    {
        id: 'docx-pdf',
        from: 'docx',
        to: 'pdf',
        label: 'DOCX → PDF',
        icon: 'file-pdf-box',
        color: '#2B579A',
        category: 'document',
        library: 'mammoth',
        quality: 'high',
    },
    {
        id: 'pdf-docx',
        from: 'pdf',
        to: 'docx',
        label: 'PDF → DOCX (Text)',
        icon: 'file-word',
        color: '#2B579A',
        category: 'document',
        library: 'pdfjs',
        quality: 'medium',
    },
    {
        id: 'pdf-txt',
        from: 'pdf',
        to: 'txt',
        label: 'PDF → Text (Extract)',
        icon: 'file-document-outline',
        color: '#2B579A',
        category: 'document',
        library: 'pdfjs',
        quality: 'high',
    },
    {
        id: 'txt-pdf',
        from: 'txt',
        to: 'pdf',
        label: 'Text → PDF',
        icon: 'file-pdf-box',
        color: '#FF3B30',
        category: 'document',
        library: 'jsPDF',
        quality: 'high',
    },
    {
        id: 'html-pdf',
        from: 'html',
        to: 'pdf',
        label: 'HTML → PDF',
        icon: 'language-html5',
        color: '#FF3B30',
        category: 'document',
        library: 'jsPDF',
        quality: 'high',
    },
    {
        id: 'docx-html',
        from: 'docx',
        to: 'html',
        label: 'DOCX → HTML',
        icon: 'file-word',
        color: '#2B579A',
        category: 'document',
        library: 'mammoth',
        quality: 'high',
    },
    {
        id: 'docx-txt',
        from: 'docx',
        to: 'txt',
        label: 'DOCX → Text',
        icon: 'file-document-outline',
        color: '#2B579A',
        category: 'document',
        library: 'mammoth',
        quality: 'high',
    },
    {
        id: 'txt-docx',
        from: 'txt',
        to: 'docx',
        label: 'Text → DOCX',
        icon: 'file-word-box',
        color: '#2B579A',
        category: 'document',
        library: 'docx',
        quality: 'high',
    },

    // ===== SPREADSHEET CONVERSIONS =====
    {
        id: 'xlsx-pdf',
        from: 'xlsx',
        to: 'pdf',
        label: 'Excel → PDF',
        icon: 'file-pdf-box',
        color: '#217346',
        category: 'spreadsheet',
        library: 'xlsx',
        quality: 'high',
    },
    {
        id: 'xlsx-csv',
        from: 'xlsx',
        to: 'csv',
        label: 'Excel → CSV',
        icon: 'file-excel',
        color: '#217346',
        category: 'spreadsheet',
        library: 'xlsx',
        quality: 'high',
    },
    {
        id: 'xlsx-json',
        from: 'xlsx',
        to: 'json',
        label: 'Excel → JSON',
        icon: 'code-json',
        color: '#217346',
        category: 'spreadsheet',
        library: 'xlsx',
        quality: 'high',
    },
    {
        id: 'csv-xlsx',
        from: 'csv',
        to: 'xlsx',
        label: 'CSV → Excel',
        icon: 'table',
        color: '#217346',
        category: 'spreadsheet',
        library: 'xlsx',
        quality: 'high',
    },

    // ===== DATA CONVERSIONS =====
    {
        id: 'csv-json',
        from: 'csv',
        to: 'json',
        label: 'CSV → JSON',
        icon: 'code-json',
        color: '#FF9500',
        category: 'data',
        library: 'papaparse',
        quality: 'high',
    },
    {
        id: 'json-csv',
        from: 'json',
        to: 'csv',
        label: 'JSON → CSV',
        icon: 'file-delimited',
        color: '#FF9500',
        category: 'data',
        library: 'papaparse',
        quality: 'high',
    },
    {
        id: 'xml-json',
        from: 'xml',
        to: 'json',
        label: 'XML → JSON',
        icon: 'code-braces',
        color: '#AF52DE',
        category: 'data',
        library: 'fast-xml-parser',
        quality: 'high',
    },
    {
        id: 'json-xml',
        from: 'json',
        to: 'xml',
        label: 'JSON → XML',
        icon: 'xml',
        color: '#AF52DE',
        category: 'data',
        library: 'fast-xml-parser',
        quality: 'high',
    },

    // ===== MARKUP CONVERSIONS =====
    {
        id: 'md-html',
        from: 'md',
        to: 'html',
        label: 'Markdown → HTML',
        icon: 'language-markdown',
        color: '#5E5CE6',
        category: 'markup',
        library: 'marked',
        quality: 'high',
    },
    {
        id: 'html-md',
        from: 'html',
        to: 'md',
        label: 'HTML → Markdown',
        icon: 'language-markdown-outline',
        color: '#5E5CE6',
        category: 'markup',
        library: 'turndown',
        quality: 'high',
    },
    {
        id: 'html-txt',
        from: 'html',
        to: 'txt',
        label: 'HTML → Text',
        icon: 'text',
        color: '#8E8E93',
        category: 'markup',
        library: 'custom',
        quality: 'medium',
    },
    {
        id: 'txt-html',
        from: 'txt',
        to: 'html',
        label: 'Text → HTML',
        icon: 'code-tags',
        color: '#8E8E93',
        category: 'markup',
        library: 'custom',
        quality: 'medium',
    },
];

export const CATEGORIES = [
    { id: 'all', label: 'Semua', icon: 'view-grid', color: '#007AFF' },
    { id: 'image', label: 'Image', icon: 'image', color: '#FF2D55' },
    { id: 'document', label: 'Dokumen', icon: 'file-document', color: '#2B579A' },
    { id: 'spreadsheet', label: 'Spreadsheet', icon: 'table', color: '#217346' },
    { id: 'data', label: 'Data', icon: 'database', color: '#FF9500' },
    { id: 'markup', label: 'Markup', icon: 'code-tags', color: '#5E5CE6' },
];

/**
 * Get conversion routes by category
 */
export const getRoutesByCategory = (category: string): ConversionRoute[] => {
    if (category === 'all') return CONVERSION_ROUTES;
    return CONVERSION_ROUTES.filter(route => route.category === category);
};

/**
 * Get conversion route by ID
 */
export const getRouteById = (id: string): ConversionRoute | undefined => {
    return CONVERSION_ROUTES.find(route => route.id === id);
};

/**
 * Get routes that support a specific format as input
 */
export const getRoutesFromFormat = (format: string): ConversionRoute[] => {
    return CONVERSION_ROUTES.filter(route => route.from === format.toLowerCase());
};

/**
 * Get routes that support a specific format as output
 */
export const getRoutesToFormat = (format: string): ConversionRoute[] => {
    return CONVERSION_ROUTES.filter(route => route.to === format.toLowerCase());
};
