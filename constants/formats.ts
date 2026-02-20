//Supported file formats and their conversion options
// EXPANDED to 60+ format conversions with BIDIRECTIONAL support
// Client-side conversion optimized for mobile & web

export const SUPPORTED_FORMATS = {
    // Image formats (15 input) - Extended
    IMAGE_INPUT: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tiff', 'ico', 'svg', 'heic', 'avif', 'raw', 'cr2', 'nef', 'dng'],
    IMAGE_OUTPUT: ['png', 'jpg', 'jpeg', 'webp', 'pdf', 'bmp', 'gif'],

    // Document formats (20 input) - Expanded
    DOCUMENT_INPUT: ['pdf', 'txt', 'html', 'md', 'docx', 'doc', 'rtf', 'odt', 'pages', 'epub', 'mobi', 'tex', 'latex', 'xml', 'yaml', 'azw3', 'fb2', 'djvu', 'xps', 'oxps'],
    DOCUMENT_OUTPUT: ['pdf', 'txt', 'html', 'md', 'rtf', 'docx'],

    // Spreadsheet formats (10 input) - Expanded
    SPREADSHEET_INPUT: ['xlsx', 'xls', 'csv', 'tsv', 'ods', 'json', 'xml', 'numbers', 'xlsm', 'xltx'],
    SPREADSHEET_OUTPUT: ['csv', 'json', 'txt', 'xlsx', 'tsv', 'html', 'xml'],

    // Presentation formats (7 input) - Expanded
    PRESENTATION_INPUT: ['pptx', 'ppt', 'odp', 'key', 'pdf', 'pptm', 'pps'],
    PRESENTATION_OUTPUT: ['pdf', 'txt', 'html', 'jpg'],

    // Data & Config formats (15 input) - Expanded
    DATA_INPUT: ['json', 'xml', 'csv', 'tsv', 'yaml', 'yml', 'toml', 'ini', 'log', 'sql', 'srt', 'vtt', 'env', 'properties', 'conf'],
    DATA_OUTPUT: ['json', 'xml', 'csv', 'txt', 'yaml', 'html', 'toml'],

    // Archive formats (5 input) - NEW
    ARCHIVE_INPUT: ['zip', 'rar', '7z', 'tar', 'gz'],
    ARCHIVE_OUTPUT: ['zip', 'txt'], // Extract list

    // Code formats (10 input) - NEW
    CODE_INPUT: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs'],
    CODE_OUTPUT: ['pdf', 'html', 'txt'],
};

// Format conversion mapping - BIDIRECTIONAL & EXPANDED
export const CONVERSION_MAP: Record<string, string[]> = {
    // ===== IMAGES (15 formats) =====
    jpg: ['png', 'webp', 'pdf', 'bmp', 'gif', 'ico'],
    jpeg: ['png', 'webp', 'pdf', 'bmp', 'gif', 'ico'],
    png: ['jpg', 'webp', 'pdf', 'bmp', 'gif', 'ico'],
    webp: ['jpg', 'png', 'pdf', 'bmp', 'gif'],
    bmp: ['jpg', 'png', 'webp', 'pdf', 'gif'],
    gif: ['jpg', 'png', 'webp', 'pdf', 'bmp'],
    tiff: ['jpg', 'png', 'webp', 'pdf', 'bmp'],
    ico: ['png', 'jpg', 'webp', 'bmp'],
    svg: ['png', 'jpg', 'pdf', 'webp'],
    heic: ['jpg', 'png', 'webp', 'pdf', 'bmp'],
    avif: ['jpg', 'png', 'webp', 'bmp'],
    raw: ['jpg', 'png', 'webp', 'tiff'],
    cr2: ['jpg', 'png', 'webp', 'tiff'], // Canon RAW
    nef: ['jpg', 'png', 'webp', 'tiff'], // Nikon RAW
    dng: ['jpg', 'png', 'webp', 'tiff'], // Adobe RAW

    // ===== DOCUMENTS (20 formats) =====
    pdf: ['txt', 'html', 'jpg', 'png', 'docx', 'md'],
    txt: ['pdf', 'html', 'md', 'rtf', 'docx', 'json'],
    html: ['pdf', 'txt', 'md', 'docx', 'json'],
    md: ['pdf', 'txt', 'html', 'rtf', 'docx'],
    docx: ['pdf', 'txt', 'html', 'md', 'rtf'],
    doc: ['pdf', 'txt', 'html', 'md', 'docx'],
    rtf: ['pdf', 'txt', 'html', 'md', 'docx'],
    odt: ['pdf', 'txt', 'html', 'docx'],
    pages: ['pdf', 'txt', 'docx'],
    epub: ['pdf', 'txt', 'html', 'md', 'mobi'],
    mobi: ['pdf', 'txt', 'epub'],
    tex: ['pdf', 'txt', 'html', 'md'],
    latex: ['pdf', 'txt', 'html', 'md'],
    azw3: ['pdf', 'txt', 'epub'], // Kindle
    fb2: ['pdf', 'txt', 'epub'], // FictionBook
    djvu: ['pdf', 'txt'], // DjVu
    xps: ['pdf', 'txt'], // XML Paper
    oxps: ['pdf', 'txt'], // Open XPS

    // ===== SPREADSHEETS (10 formats) =====
    xlsx: ['csv', 'json', 'txt', 'tsv', 'html', 'pdf', 'xml'],
    xls: ['csv', 'json', 'txt', 'tsv', 'xlsx', 'pdf'],
    xlsm: ['xlsx', 'csv', 'json', 'pdf'], // Macro-enabled
    xltx: ['xlsx', 'csv', 'json'], // Template
    csv: ['json', 'txt', 'xlsx', 'tsv', 'html', 'xml'],
    tsv: ['csv', 'json', 'txt', 'xlsx', 'html'],
    ods: ['csv', 'json', 'txt', 'xlsx', 'pdf'],
    numbers: ['csv', 'json', 'txt', 'xlsx'],

    // ===== PRESENTATIONS (7 formats) =====
    pptx: ['pdf', 'txt', 'html', 'jpg'],
    ppt: ['pdf', 'txt', 'html', 'pptx'],
    pptm: ['pptx', 'pdf', 'txt'], // Macro-enabled
    pps: ['pptx', 'pdf', 'txt'], // Slideshow
    odp: ['pdf', 'txt', 'html', 'pptx'],
    key: ['pdf', 'txt', 'pptx'],

    // ===== DATA & CONFIG (15 formats) =====
    json: ['csv', 'txt', 'yaml', 'xml', 'tsv', 'html', 'toml'],
    xml: ['json', 'txt', 'csv', 'yaml', 'html'],
    yaml: ['json', 'txt', 'xml', 'toml'],
    yml: ['json', 'txt', 'xml', 'toml'],
    toml: ['json', 'txt', 'yaml'],
    ini: ['json', 'txt', 'yaml'],
    log: ['txt', 'json', 'csv'],
    sql: ['txt', 'json'],
    srt: ['txt', 'json', 'vtt'], // Subtitles
    vtt: ['txt', 'json', 'srt'], // WebVTT
    env: ['txt', 'json'],
    properties: ['txt', 'json', 'yaml'],
    conf: ['txt', 'json', 'yaml'],

    // ===== ARCHIVES (5 formats) - Extract to text list
    zip: ['txt'], // List contents
    rar: ['txt'],
    '7z': ['txt'],
    tar: ['txt'],
    gz: ['txt'],

    // ===== CODE (10 formats) - Syntax highlighted conversion
    js: ['pdf', 'html', 'txt'],
    ts: ['pdf', 'html', 'txt', 'js'],
    jsx: ['pdf', 'html', 'txt'],
    tsx: ['pdf', 'html', 'txt'],
    py: ['pdf', 'html', 'txt'],
    java: ['pdf', 'html', 'txt'],
    cpp: ['pdf', 'html', 'txt'],
    c: ['pdf', 'html', 'txt'],
    go: ['pdf', 'html', 'txt'],
    rs: ['pdf', 'html', 'txt'], // Rust
};

// File size limits
export const FILE_SIZE_LIMITS = {
    mobile: 50 * 1024 * 1024, // 50MB
    web: 20 * 1024 * 1024,    // 20MB
};

// MIME types mapping - EXPANDED
export const MIME_TYPES: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    bmp: 'image/bmp',
    gif: 'image/gif',
    tiff: 'image/tiff',
    ico: 'image/x-icon',
    svg: 'image/svg+xml',
    heic: 'image/heic',
    avif: 'image/avif',
    raw: 'image/x-raw',
    cr2: 'image/x-canon-cr2',
    nef: 'image/x-nikon-nef',
    dng: 'image/x-adobe-dng',

    // Documents
    pdf: 'application/pdf',
    txt: 'text/plain',
    html: 'text/html',
    md: 'text/markdown',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    rtf: 'application/rtf',
    odt: 'application/vnd.oasis.opendocument.text',
    pages: 'application/vnd.apple.pages',
    epub: 'application/epub+zip',
    mobi: 'application/x-mobipocket-ebook',
    tex: 'application/x-tex',
    latex: 'application/x-latex',
    azw3: 'application/vnd.amazon.ebook',
    fb2: 'application/x-fictionbook+xml',
    djvu: 'image/vnd.djvu',
    xps: 'application/vnd.ms-xpsdocument',
    oxps: 'application/oxps',

    // Spreadsheets
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
    xltx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
    csv: 'text/csv',
    tsv: 'text/tab-separated-values',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    numbers: 'application/vnd.apple.numbers',

    // Presentations
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
    pptm: 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    pps: 'application/vnd.ms-powerpoint',
    odp: 'application/vnd.oasis.opendocument.presentation',
    key: 'application/vnd.apple.keynote',

    // Data formats
    json: 'application/json',
    xml: 'application/xml',
    yaml: 'application/x-yaml',
    yml: 'application/x-yaml',
    toml: 'application/toml',
    ini: 'text/plain',
    log: 'text/plain',
    sql: 'application/sql',
    srt: 'application/x-subrip',
    vtt: 'text/vtt',
    env: 'text/plain',
    properties: 'text/plain',
    conf: 'text/plain',

    // Archives
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',

    // Code
    js: 'text/javascript',
    ts: 'text/typescript',
    jsx: 'text/jsx',
    tsx: 'text/tsx',
    py: 'text/x-python',
    java: 'text/x-java',
    cpp: 'text/x-c++src',
    c: 'text/x-csrc',
    go: 'text/x-go',
    rs: 'text/x-rust',
};

// Quality presets for image conversion
export const IMAGE_QUALITY_PRESETS = {
    low: 0.5,
    medium: 0.75,
    high: 0.9,
    maximum: 1.0,
};

// Helper function to get file extension
export const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
};

// Helper function to get available output formats
export const getOutputFormats = (inputFormat: string): string[] => {
    return CONVERSION_MAP[inputFormat.toLowerCase()] || [];
};

// Helper function to check if format is supported
export const isFormatSupported = (format: string): boolean => {
    const allFormats = [
        ...SUPPORTED_FORMATS.IMAGE_INPUT,
        ...SUPPORTED_FORMATS.DOCUMENT_INPUT,
        ...SUPPORTED_FORMATS.SPREADSHEET_INPUT,
        ...SUPPORTED_FORMATS.PRESENTATION_INPUT,
        ...SUPPORTED_FORMATS.DATA_INPUT,
        ...SUPPORTED_FORMATS.ARCHIVE_INPUT,
        ...SUPPORTED_FORMATS.CODE_INPUT,
    ];
    return allFormats.includes(format.toLowerCase());
};

// Helper function to check if conversion is supported
export const isConversionSupported = (from: string, to: string): boolean => {
    const availableFormats = CONVERSION_MAP[from.toLowerCase()] || [];
    return availableFormats.includes(to.toLowerCase());
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get format category
export const getFormatCategory = (format: string): string => {
    const lowerFormat = format.toLowerCase();

    if (SUPPORTED_FORMATS.IMAGE_INPUT.includes(lowerFormat)) return 'image';
    if (SUPPORTED_FORMATS.DOCUMENT_INPUT.includes(lowerFormat)) return 'document';
    if (SUPPORTED_FORMATS.SPREADSHEET_INPUT.includes(lowerFormat)) return 'spreadsheet';
    if (SUPPORTED_FORMATS.PRESENTATION_INPUT.includes(lowerFormat)) return 'presentation';
    if (SUPPORTED_FORMATS.DATA_INPUT.includes(lowerFormat)) return 'data';
    if (SUPPORTED_FORMATS.ARCHIVE_INPUT.includes(lowerFormat)) return 'archive';
    if (SUPPORTED_FORMATS.CODE_INPUT.includes(lowerFormat)) return 'code';

    return 'unknown';
};

// Format categories for UI grouping - EXPANDED
export const FORMAT_CATEGORIES = {
    images: {
        label: 'Gambar',
        formats: SUPPORTED_FORMATS.IMAGE_INPUT,
        icon: 'image',
        color: '#34C759', // iOS Green
    },
    documents: {
        label: 'Dokumen',
        formats: SUPPORTED_FORMATS.DOCUMENT_INPUT,
        icon: 'file-document',
        color: '#007AFF', // iOS Blue
    },
    spreadsheets: {
        label: 'Spreadsheet',
        formats: SUPPORTED_FORMATS.SPREADSHEET_INPUT,
        icon: 'table',
        color: '#FF9500', // iOS Orange
    },
    presentations: {
        label: 'Presentasi',
        formats: SUPPORTED_FORMATS.PRESENTATION_INPUT,
        icon: 'presentation',
        color: '#FF3B30', // iOS Red
    },
    data: {
        label: 'Data & Config',
        formats: SUPPORTED_FORMATS.DATA_INPUT,
        icon: 'database',
        color: '#5856D6', // iOS Purple
    },
    archives: {
        label: 'Archive',
        formats: SUPPORTED_FORMATS.ARCHIVE_INPUT,
        icon: 'zip-box',
        color: '#AF52DE', // iOS Purple Light
    },
    code: {
        label: 'Kode Program',
        formats: SUPPORTED_FORMATS.CODE_INPUT,
        icon: 'code-braces',
        color: '#FF2D55', // iOS Pink
    },
};

// Popular conversion pairs for quick access
export const POPULAR_CONVERSIONS = [
    { from: 'jpg', to: 'pdf', label: 'JPG → PDF' },
    { from: 'pdf', to: 'jpg', label: 'PDF → JPG' },
    { from: 'png', to: 'jpg', label: 'PNG → JPG' },
    { from: 'docx', to: 'pdf', label: 'DOCX → PDF' },
    { from: 'pdf', to: 'txt', label: 'PDF → TXT' },
    { from: 'txt', to: 'pdf', label: 'TXT → PDF' },
    { from: 'xlsx', to: 'csv', label: 'XLSX → CSV' },
    { from: 'csv', to: 'xlsx', label: 'CSV → XLSX' },
    { from: 'json', to: 'csv', label: 'JSON → CSV' },
    { from: 'csv', to: 'json', label: 'CSV → JSON' },
    { from: 'md', to: 'html', label: 'MD → HTML' },
    { from: 'html', to: 'pdf', label: 'HTML → PDF' },
    { from: 'heic', to: 'jpg', label: 'HEIC → JPG' },
    { from: 'webp', to: 'png', label: 'WEBP → PNG' },
];

export const BIDIRECTIONAL_CONVERSIONS = [
    { from: 'TXT', to: 'PDF', icon: 'file-document-outline', color: '#FF3B30' },
    { from: 'PDF', to: 'TXT', icon: 'file-pdf-box', color: '#007AFF' },
    { from: 'JPG', to: 'PDF', icon: 'image-outline', color: '#34C759' },
    { from: 'PDF', to: 'JPG', icon: 'file-image', color: '#5856D6' },
    { from: 'XLSX', to: 'CSV', icon: 'table', color: '#FF9500' },
    { from: 'CSV', to: 'XLSX', icon: 'file-delimited', color: '#AF52DE' },
    { from: 'JSON', to: 'CSV', icon: 'code-json', color: '#FF2D55' },
    { from: 'CSV', to: 'JSON', icon: 'xml', color: '#00C7BE' },
];

// Total format count for display
export const TOTAL_INPUT_FORMATS =
    SUPPORTED_FORMATS.IMAGE_INPUT.length +
    SUPPORTED_FORMATS.DOCUMENT_INPUT.length +
    SUPPORTED_FORMATS.SPREADSHEET_INPUT.length +
    SUPPORTED_FORMATS.PRESENTATION_INPUT.length +
    SUPPORTED_FORMATS.DATA_INPUT.length +
    SUPPORTED_FORMATS.ARCHIVE_INPUT.length +
    SUPPORTED_FORMATS.CODE_INPUT.length;

// Calculate total conversion paths
export const TOTAL_CONVERSION_PATHS = Object.values(CONVERSION_MAP).reduce(
    (total, outputs) => total + outputs.length,
    0
);
