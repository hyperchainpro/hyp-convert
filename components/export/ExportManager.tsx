/**
 * Export Manager Component
 * Comprehensive export options for scanned documents
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, RadioButton, ProgressBar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as OfficeGenerator from '@/lib/export/officeGenerator';
import * as FileSystem from 'expo-file-system/legacy';
import { ScannedPage } from '@/hooks/useDocumentStore';

// =====================================================
// TYPES
// =====================================================

interface ExportManagerProps {
    pages: ScannedPage[];
    documentName?: string;
    onClose: () => void;
    onExportComplete?: (uri: string, format: string) => void;
}

export type ExportFormat = 'pdf' | 'jpg' | 'png' | 'tiff' | 'docx' | 'xlsx' | 'zip' | 'txt';
export type PDFQuality = 72 | 150 | 300 | 600;
export type PDFSize = 'a4' | 'letter' | 'legal' | 'original';
export type CompressionLevel = 'high' | 'medium' | 'low';

interface ExportOptions {
    format: ExportFormat;
    quality: PDFQuality;
    pageSize: PDFSize;
    compression: CompressionLevel;
    password?: string;
    includeOCR: boolean;
}

// =====================================================
// DEFAULT OPTIONS
// =====================================================

const DEFAULT_OPTIONS: ExportOptions = {
    format: 'pdf',
    quality: 150,
    pageSize: 'a4',
    compression: 'medium',
    includeOCR: true,
};

// =====================================================
// FORMAT CONFIGS
// =====================================================

const EXPORT_FORMATS: { key: ExportFormat; label: string; icon: string; description: string }[] = [
    { key: 'pdf', label: 'PDF', icon: 'file-pdf-box', description: 'Dokumen multi-halaman' },
    { key: 'docx', label: 'Word', icon: 'file-word', description: 'Dokumen teks & gambar' },
    { key: 'xlsx', label: 'Excel', icon: 'file-excel', description: 'Tabel dari OCR' },
    { key: 'jpg', label: 'JPG', icon: 'file-jpg-box', description: 'Gambar terkompresi' },
    { key: 'zip', label: 'ZIP', icon: 'folder-zip', description: 'Arsip semua halaman' },
    { key: 'txt', label: 'TXT', icon: 'text-box', description: 'Hanya teks OCR' },
];

const QUALITY_OPTIONS: { value: PDFQuality; label: string }[] = [
    { value: 72, label: 'Web (72 DPI)' },
    { value: 150, label: 'Standard (150 DPI)' },
    { value: 300, label: 'High (300 DPI)' },
    { value: 600, label: 'Print (600 DPI)' },
];

const PAGE_SIZE_OPTIONS: { value: PDFSize; label: string }[] = [
    { value: 'a4', label: 'A4 (210×297mm)' },
    { value: 'letter', label: 'Letter (8.5×11in)' },
    { value: 'legal', label: 'Legal (8.5×14in)' },
    { value: 'original', label: 'Ukuran Asli' },
];

const COMPRESSION_OPTIONS: { value: CompressionLevel; label: string; description: string }[] = [
    { value: 'high', label: 'Tinggi', description: 'File terkecil' },
    { value: 'medium', label: 'Sedang', description: 'Seimbang' },
    { value: 'low', label: 'Rendah', description: 'Kualitas terbaik' },
];

// =====================================================
// MAIN COMPONENT
// =====================================================

export const ExportManager: React.FC<ExportManagerProps> = ({
    pages,
    documentName = 'Document',
    onClose,
    onExportComplete,
}) => {
    const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS);
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'format' | 'quality' | 'options'>('format');

    const handleExport = async () => {
        setIsExporting(true);
        setProgress(0);
        setError(null);

        try {
            let uri = '';

            // Ensure we use the processed/edited URIs
            // pages[i].editedUri is the source of truth

            if (options.format === 'pdf') {
                await exportToPDF();
                return;
            } else if (options.format === 'jpg') {
                await exportAsImage();
                return;
            }

            // Other formats
            switch (options.format) {
                case 'docx':
                    // Basic text-only DOCX for now
                    const ocrs = pages.map(p => p.ocrText || '').join('\n\n');
                    uri = await OfficeGenerator.generateDOCX(ocrs, documentName);
                    break;
                case 'xlsx':
                    const data = pages.map((p, i) => ({
                        Page: i + 1,
                        Text: p.ocrText || '(No OCR text)',
                    }));
                    uri = await OfficeGenerator.generateExcel(data, 'Scanned Data');
                    break;
                case 'zip':
                    const files = pages.map((p, i) => ({
                        uri: p.editedUri,
                        name: `Page-${i + 1}.jpg`,
                    }));
                    uri = await OfficeGenerator.generateZIP(files);
                    break;
                case 'txt':
                    const allText = pages.map(p => p.ocrText || '').join('\n\n---\n\n');
                    if (Platform.OS === 'web') {
                        const blob = new Blob([allText], { type: 'text/plain' });
                        uri = URL.createObjectURL(blob);
                    } else {
                        const txtFile = `${FileSystem.cacheDirectory}export_${Date.now()}.txt`;
                        await FileSystem.writeAsStringAsync(txtFile, allText);
                        uri = txtFile;
                    }
                    break;
            }

            // Download/Share result
            if (uri) {
                handleDownloadOrShare(uri, options.format);
                onExportComplete?.(uri, options.format);
                onClose();
            }

        } catch (err) {
            console.error('Export error:', err);
            setError('Gagal mengekspor dokumen');
        } finally {
            setIsExporting(false);
            setProgress(0);
        }
    };

    const handleDownloadOrShare = async (uri: string, format: string) => {
        if (Platform.OS === 'web') {
            const link = document.createElement('a');
            link.href = uri;
            link.download = `${documentName}-${Date.now()}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
        }
    };

    const blobToBase64 = (blobUrl: string): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(blobUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    // result is data:image/jpeg;base64,.....
                    resolve(reader.result as string);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            } catch (e) {
                reject(e);
            }
        });
    };

    const exportToPDF = async () => {
        setProgress(10);

        try {
            if (Platform.OS === 'web') {
                // WEB: Use jsPDF for pixel-perfect PDF creation
                const { jsPDF } = await import('jspdf');

                const format = options.pageSize.toLowerCase(); // 'a4', 'letter'
                const doc = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: format as any
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                for (let i = 0; i < pages.length; i++) {
                    setProgress(10 + (i / pages.length) * 80);

                    if (i > 0) doc.addPage();

                    const page = pages[i];
                    let imgData = page.editedUri; // blob url likely

                    if (imgData.startsWith('blob:') || imgData.startsWith('http')) {
                        imgData = await blobToBase64(imgData);
                    }

                    // Add Image centered and fitted
                    const imgProps = doc.getImageProperties(imgData);
                    const imgRatio = imgProps.width / imgProps.height;
                    const pageRatio = pageWidth / pageHeight;

                    let w, h, x, y;

                    // Fit logic (contain)
                    if (imgRatio > pageRatio) {
                        w = pageWidth;
                        h = pageWidth / imgRatio;
                    } else {
                        h = pageHeight;
                        w = pageHeight * imgRatio;
                    }

                    x = (pageWidth - w) / 2;
                    y = (pageHeight - h) / 2;

                    doc.addImage(imgData, 'JPEG', x, y, w, h);
                }

                doc.save(`${documentName}.pdf`);
                onExportComplete?.('downloaded', 'pdf');
                onClose();

            } else {
                // NATIVE: Use expo-print (printToFileAsync)
                // HTML generation approach is fine for Native as printToFileAsync works well there
                const imageElements = await Promise.all(
                    pages.map(async (page, index) => {
                        let imageData = page.editedUri;
                        const base64 = await FileSystem.readAsStringAsync(page.editedUri, {
                            encoding: FileSystem.EncodingType.Base64,
                        });
                        imageData = `data:image/jpeg;base64,${base64}`;

                        return `
                            <div style="page-break-after: always; display: flex; justify-content: center; align-items: center; height: 100vh; padding: 0; box-sizing: border-box;">
                                <img src="${imageData}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                            </div>
                        `;
                    })
                );

                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            @page { size: ${getPageSizeCSS(options.pageSize)}; margin: 0; }
                            body { margin: 0; padding: 0; }
                        </style>
                    </head>
                    <body>
                        ${imageElements.join('')}
                    </body>
                    </html>
                `;

                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri);
                onExportComplete?.(uri, 'pdf');
                onClose();
            }

        } catch (err) {
            console.error('PDF Export error:', err);
            setError('Gagal membuat PDF');
        } finally {
            setIsExporting(false);
            setProgress(0);
        }
    };

    const exportAsImage = async () => {
        setProgress(10);
        try {
            if (pages.length === 0) return;

            // If single page, download it directly
            // If multiple, download ZIP
            if (pages.length === 1) {
                const page = pages[0];
                const uri = page.editedUri;

                handleDownloadOrShare(uri, 'jpg');
                onExportComplete?.(uri, 'jpg');
                onClose();
            } else {
                // Batch -> ZIP
                const files = pages.map((p, i) => ({
                    uri: p.editedUri,
                    name: `Page-${i + 1}.jpg`,
                }));
                const zipUri = await OfficeGenerator.generateZIP(files);
                handleDownloadOrShare(zipUri, 'zip');
                onExportComplete?.(zipUri, 'zip');
                onClose();
            }
        } catch (err) {
            console.error('Image Export error:', err);
            setError('Gagal menyimpan gambar');
        } finally {
            setIsExporting(false);
            setProgress(0);
        }
    };

    const getPageSizeCSS = (size: PDFSize): string => {
        switch (size) {
            case 'a4': return 'A4';
            case 'letter': return 'letter';
            case 'legal': return 'legal';
            default: return 'A4';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                    <MaterialCommunityIcons name="close" size={24} color="#FF453A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Export Dokumen</Text>
                <TouchableOpacity
                    onPress={handleExport}
                    style={styles.headerBtn}
                    disabled={isExporting}
                >
                    <MaterialCommunityIcons
                        name="check"
                        size={24}
                        color={isExporting ? '#48484A' : '#30D158'}
                    />
                </TouchableOpacity>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    onPress={() => setActiveTab('format')}
                    style={[styles.tab, activeTab === 'format' && styles.tabActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'format' && styles.tabTextActive]}>
                        Format
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('quality')}
                    style={[styles.tab, activeTab === 'quality' && styles.tabActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'quality' && styles.tabTextActive]}>
                        Kualitas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('options')}
                    style={[styles.tab, activeTab === 'options' && styles.tabActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'options' && styles.tabTextActive]}>
                        Opsi
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Format Tab */}
                {activeTab === 'format' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Pilih Format</Text>
                        <View style={styles.formatGrid}>
                            {EXPORT_FORMATS.map((format) => (
                                <TouchableOpacity
                                    key={format.key}
                                    onPress={() => setOptions({ ...options, format: format.key })}
                                    style={[
                                        styles.formatCard,
                                        options.format === format.key && styles.formatCardActive,
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={format.icon as any}
                                        size={32}
                                        color={options.format === format.key ? '#007AFF' : '#8E8E93'}
                                    />
                                    <Text style={[
                                        styles.formatLabel,
                                        options.format === format.key && styles.formatLabelActive,
                                    ]}>
                                        {format.label}
                                    </Text>
                                    <Text style={styles.formatDesc}>{format.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Quality Tab */}
                {activeTab === 'quality' && (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>DPI / Resolusi</Text>
                            <RadioButton.Group
                                value={String(options.quality)}
                                onValueChange={(val) => setOptions({ ...options, quality: Number(val) as PDFQuality })}
                            >
                                {QUALITY_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={styles.radioItem}
                                        onPress={() => setOptions({ ...options, quality: opt.value })}
                                    >
                                        <RadioButton value={String(opt.value)} color="#007AFF" />
                                        <Text style={styles.radioLabel}>{opt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </RadioButton.Group>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Kompresi</Text>
                            <View style={styles.compressionRow}>
                                {COMPRESSION_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => setOptions({ ...options, compression: opt.value })}
                                        style={[
                                            styles.compressionBtn,
                                            options.compression === opt.value && styles.compressionBtnActive,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.compressionLabel,
                                            options.compression === opt.value && styles.compressionLabelActive,
                                        ]}>
                                            {opt.label}
                                        </Text>
                                        <Text style={styles.compressionDesc}>{opt.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* Options Tab */}
                {activeTab === 'options' && options.format === 'pdf' && (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ukuran Halaman</Text>
                            <RadioButton.Group
                                value={options.pageSize}
                                onValueChange={(val) => setOptions({ ...options, pageSize: val as PDFSize })}
                            >
                                {PAGE_SIZE_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={styles.radioItem}
                                        onPress={() => setOptions({ ...options, pageSize: opt.value })}
                                    >
                                        <RadioButton value={opt.value} color="#007AFF" />
                                        <Text style={styles.radioLabel}>{opt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </RadioButton.Group>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Fitur PDF</Text>
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => setOptions({ ...options, includeOCR: !options.includeOCR })}
                            >
                                <View style={styles.optionInfo}>
                                    <MaterialCommunityIcons name="text-recognition" size={24} color="#8E8E93" />
                                    <View>
                                        <Text style={styles.optionLabel}>PDF Searchable</Text>
                                        <Text style={styles.optionDesc}>Sertakan layer teks OCR</Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons
                                    name={options.includeOCR ? 'toggle-switch' : 'toggle-switch-off'}
                                    size={32}
                                    color={options.includeOCR ? '#30D158' : '#48484A'}
                                />
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* Summary */}
                <View style={styles.summary}>
                    <Text style={styles.summaryTitle}>Ringkasan Export</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Halaman</Text>
                        <Text style={styles.summaryValue}>{pages.length}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Format</Text>
                        <Text style={styles.summaryValue}>{options.format.toUpperCase()}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Kualitas</Text>
                        <Text style={styles.summaryValue}>{options.quality} DPI</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Export Progress */}
            {isExporting && (
                <View style={styles.progressContainer}>
                    <LinearGradient
                        colors={['rgba(0,122,255,0.2)', 'rgba(88,86,214,0.2)']}
                        style={styles.progressGradient}
                    >
                        <Text style={styles.progressText}>Mengekspor... {Math.round(progress)}%</Text>
                        <ProgressBar progress={progress / 100} color="#007AFF" style={styles.progressBar} />
                    </LinearGradient>
                </View>
            )}

            {/* Error */}
            {error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert" size={20} color="#FF453A" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Export Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleExport}
                    disabled={isExporting || pages.length === 0}
                    style={styles.exportBtn}
                >
                    <LinearGradient
                        colors={isExporting ? ['#48484A', '#3A3A3C'] : ['#007AFF', '#5856D6']}
                        style={styles.exportBtnGradient}
                    >
                        <MaterialCommunityIcons
                            name={isExporting ? 'loading' : 'export'}
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.exportBtnText}>
                            {isExporting ? 'Mengekspor...' : `Export ${options.format.toUpperCase()}`}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 14,
        color: '#8E8E93',
    },
    tabTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 12,
    },
    formatGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    formatCard: {
        width: '47%',
        padding: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    formatCardActive: {
        borderColor: '#007AFF',
        backgroundColor: 'rgba(0,122,255,0.1)',
    },
    formatLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginTop: 8,
    },
    formatLabelActive: {
        color: '#007AFF',
    },
    formatDesc: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    radioLabel: {
        fontSize: 15,
        color: '#ffffff',
        marginLeft: 8,
    },
    divider: {
        backgroundColor: '#2C2C2E',
        marginVertical: 16,
    },
    compressionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    compressionBtn: {
        flex: 1,
        padding: 12,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    compressionBtnActive: {
        borderColor: '#007AFF',
        backgroundColor: 'rgba(0,122,255,0.1)',
    },
    compressionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    compressionLabelActive: {
        color: '#007AFF',
    },
    compressionDesc: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 4,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
    },
    optionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionLabel: {
        fontSize: 15,
        color: '#ffffff',
    },
    optionDesc: {
        fontSize: 12,
        color: '#8E8E93',
    },
    summary: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 100,
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#8E8E93',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    progressContainer: {
        position: 'absolute',
        bottom: 80,
        left: 16,
        right: 16,
    },
    progressGradient: {
        padding: 16,
        borderRadius: 12,
    },
    progressText: {
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 8,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3A3A3C',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: 'rgba(255,59,48,0.2)',
        marginHorizontal: 16,
        borderRadius: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#FF453A',
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    exportBtn: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    exportBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    exportBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});

export default ExportManager;
