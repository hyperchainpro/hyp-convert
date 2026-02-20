/**
 * OCR Viewer Component
 * Displays OCR results with text overlay and action buttons
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
} from 'react-native';
import { Text, IconButton, ProgressBar, Searchbar, Chip, Menu, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import {
    ocrEngine,
    OCRResult,
    OCRProgress,
    OCR_LANGUAGES,
    formatOCRText,
    searchInOCR,
    extractEmails,
    extractPhoneNumbers,
    extractNumbers,
    TextWord,
} from '@/lib/ocr/TesseractOCR';

// =====================================================
// TYPES
// =====================================================

interface OCRViewerProps {
    imageUri: string;
    onClose: () => void;
    onTextExtracted?: (text: string) => void;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export const OCRViewer: React.FC<OCRViewerProps> = ({
    imageUri,
    onClose,
    onTextExtracted,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<OCRProgress | null>(null);
    const [result, setResult] = useState<OCRResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TextWord[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState('eng');
    const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
    const [showExtractMenu, setShowExtractMenu] = useState(false);
    const [copiedText, setCopiedText] = useState('');

    const { width: screenWidth } = Dimensions.get('window');

    // Run OCR on mount
    useEffect(() => {
        runOCR();
    }, [imageUri, selectedLanguage]);

    const runOCR = async () => {
        setIsProcessing(true);
        setError(null);
        setResult(null);

        try {
            ocrEngine.setProgressCallback((p) => setProgress(p));
            const ocrResult = await ocrEngine.recognizeText(imageUri, selectedLanguage);
            setResult(ocrResult);
            onTextExtracted?.(ocrResult.text);
        } catch (err) {
            console.error('OCR error:', err);
            setError('Gagal membaca teks. Coba lagi.');
        } finally {
            setIsProcessing(false);
            setProgress(null);
        }
    };

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (result && query.length > 0) {
            const matches = searchInOCR(result, query);
            setSearchResults(matches);
        } else {
            setSearchResults([]);
        }
    }, [result]);

    const handleCopyAll = async () => {
        if (result) {
            await Clipboard.setStringAsync(result.text);
            setCopiedText('all');
            setTimeout(() => setCopiedText(''), 2000);
        }
    };

    const handleCopySelection = async (text: string) => {
        await Clipboard.setStringAsync(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(''), 2000);
    };

    const getExtractedData = () => {
        if (!result) return { emails: [], phones: [], numbers: [] };
        return {
            emails: extractEmails(result),
            phones: extractPhoneNumbers(result),
            numbers: extractNumbers(result),
        };
    };

    const extractedData = getExtractedData();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                    <MaterialCommunityIcons name="close" size={24} color="#FF453A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>OCR Text Recognition</Text>
                <Menu
                    visible={languageMenuVisible}
                    onDismiss={() => setLanguageMenuVisible(false)}
                    anchor={
                        <TouchableOpacity
                            onPress={() => setLanguageMenuVisible(true)}
                            style={styles.languageBtn}
                        >
                            <Text style={styles.languageBtnText}>
                                {OCR_LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'English'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={16} color="#007AFF" />
                        </TouchableOpacity>
                    }
                >
                    <ScrollView style={{ maxHeight: 300 }}>
                        {OCR_LANGUAGES.slice(0, 20).map((lang) => (
                            <Menu.Item
                                key={lang.code}
                                onPress={() => {
                                    setSelectedLanguage(lang.code);
                                    setLanguageMenuVisible(false);
                                }}
                                title={`${lang.name} (${lang.nativeName})`}
                                style={selectedLanguage === lang.code ? styles.selectedMenuItem : undefined}
                            />
                        ))}
                    </ScrollView>
                </Menu>
            </View>

            <ScrollView style={styles.content}>
                {/* Image Preview */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUri }}
                        style={[styles.image, { width: screenWidth - 32, height: (screenWidth - 32) * 0.7 }]}
                        resizeMode="contain"
                    />
                </View>

                {/* Processing State */}
                {isProcessing && (
                    <View style={styles.processingContainer}>
                        <LinearGradient
                            colors={['rgba(0,122,255,0.1)', 'rgba(88,86,214,0.1)']}
                            style={styles.processingGradient}
                        >
                            <MaterialCommunityIcons name="text-recognition" size={32} color="#007AFF" />
                            <Text style={styles.processingTitle}>Membaca teks...</Text>
                            <Text style={styles.processingStatus}>
                                {progress?.status || 'Memproses...'}
                            </Text>
                            <ProgressBar
                                progress={progress?.progress || 0}
                                color="#007AFF"
                                style={styles.progressBar}
                            />
                            <Text style={styles.processingPercent}>
                                {Math.round((progress?.progress || 0) * 100)}%
                            </Text>
                        </LinearGradient>
                    </View>
                )}

                {/* Error State */}
                {error && (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={32} color="#FF453A" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={runOCR} style={styles.retryBtn}>
                            <Text style={styles.retryBtnText}>Coba Lagi</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Results */}
                {result && !isProcessing && (
                    <>
                        {/* Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{result.confidence.toFixed(0)}%</Text>
                                <Text style={styles.statLabel}>Akurasi</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{result.text.split(' ').length}</Text>
                                <Text style={styles.statLabel}>Kata</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{result.processingTime}ms</Text>
                                <Text style={styles.statLabel}>Waktu</Text>
                            </View>
                        </View>

                        {/* Search */}
                        <Searchbar
                            placeholder="Cari dalam teks..."
                            value={searchQuery}
                            onChangeText={handleSearch}
                            style={styles.searchBar}
                            inputStyle={styles.searchInput}
                            iconColor="#8E8E93"
                        />

                        {searchResults.length > 0 && (
                            <View style={styles.searchResults}>
                                <Text style={styles.searchResultsText}>
                                    {searchResults.length} hasil ditemukan
                                </Text>
                            </View>
                        )}

                        {/* Extracted Data Chips */}
                        {(extractedData.emails.length > 0 || extractedData.phones.length > 0) && (
                            <View style={styles.extractedContainer}>
                                <Text style={styles.extractedTitle}>Data Terdeteksi:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.chipsRow}>
                                        {extractedData.emails.map((email, i) => (
                                            <Chip
                                                key={`email-${i}`}
                                                icon="email"
                                                style={styles.chip}
                                                textStyle={styles.chipText}
                                                onPress={() => handleCopySelection(email)}
                                            >
                                                {email}
                                            </Chip>
                                        ))}
                                        {extractedData.phones.map((phone, i) => (
                                            <Chip
                                                key={`phone-${i}`}
                                                icon="phone"
                                                style={styles.chip}
                                                textStyle={styles.chipText}
                                                onPress={() => handleCopySelection(phone)}
                                            >
                                                {phone}
                                            </Chip>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        {/* Text Result */}
                        <View style={styles.textContainer}>
                            <View style={styles.textHeader}>
                                <Text style={styles.textTitle}>Hasil OCR:</Text>
                                <TouchableOpacity onPress={handleCopyAll} style={styles.copyBtn}>
                                    <MaterialCommunityIcons
                                        name={copiedText === 'all' ? 'check' : 'content-copy'}
                                        size={18}
                                        color={copiedText === 'all' ? '#30D158' : '#007AFF'}
                                    />
                                    <Text style={[
                                        styles.copyBtnText,
                                        copiedText === 'all' && { color: '#30D158' }
                                    ]}>
                                        {copiedText === 'all' ? 'Tersalin!' : 'Salin Semua'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.textBox}>
                                <Text style={styles.ocrText} selectable>
                                    {result.text || 'Tidak ada teks terdeteksi'}
                                </Text>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Bottom Actions */}
            {result && !isProcessing && (
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleCopyAll}>
                        <LinearGradient
                            colors={['#007AFF', '#5856D6']}
                            style={styles.actionBtnGradient}
                        >
                            <MaterialCommunityIcons name="content-copy" size={20} color="#fff" />
                            <Text style={styles.actionBtnText}>Salin Teks</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={runOCR}>
                        <LinearGradient
                            colors={['#30D158', '#34C759']}
                            style={styles.actionBtnGradient}
                        >
                            <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                            <Text style={styles.actionBtnText}>Scan Ulang</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
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
    languageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
    },
    languageBtnText: {
        fontSize: 14,
        color: '#007AFF',
    },
    selectedMenuItem: {
        backgroundColor: 'rgba(0,122,255,0.2)',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#1C1C1E',
    },
    image: {
        backgroundColor: '#1C1C1E',
    },
    processingContainer: {
        marginVertical: 16,
    },
    processingGradient: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    processingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginTop: 12,
    },
    processingStatus: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 4,
    },
    progressBar: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        marginTop: 16,
        backgroundColor: '#3A3A3C',
    },
    processingPercent: {
        fontSize: 14,
        color: '#007AFF',
        marginTop: 8,
    },
    errorContainer: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(255,59,48,0.1)',
        borderRadius: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#FF453A',
        marginTop: 8,
    },
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: '#FF453A',
        borderRadius: 8,
    },
    retryBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#007AFF',
    },
    statLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
    searchBar: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        marginBottom: 12,
    },
    searchInput: {
        color: '#ffffff',
    },
    searchResults: {
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    searchResultsText: {
        fontSize: 13,
        color: '#30D158',
    },
    extractedContainer: {
        marginBottom: 16,
    },
    extractedTitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 8,
    },
    chipsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        backgroundColor: '#2C2C2E',
    },
    chipText: {
        color: '#ffffff',
        fontSize: 12,
    },
    textContainer: {
        marginBottom: 100,
    },
    textHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    textTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
    },
    copyBtnText: {
        fontSize: 14,
        color: '#007AFF',
    },
    textBox: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        minHeight: 150,
    },
    ocrText: {
        fontSize: 15,
        color: '#ffffff',
        lineHeight: 22,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#000000',
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    actionBtn: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    actionBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
});

export default OCRViewer;
