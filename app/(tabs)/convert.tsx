import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, ActivityIndicator, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { CONVERSION_ROUTES, CATEGORIES, getRoutesByCategory, ConversionRoute } from '@/constants/conversionRoutes';
import * as AdvancedConverters from '@/lib/converters/advancedConverters';
import * as FileUtils from '@/lib/converters/fileUtils';
import { useConversionHistory } from '@/hooks/useConversionHistory';

export default function ConvertScreenNew() {
    const { addToHistory } = useConversionHistory();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [converting, setConverting] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, { success: boolean; error?: string }>>({});

    // Filter routes based on category and search
    const filteredRoutes = getRoutesByCategory(selectedCategory).filter(route =>
        route.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleConversion = async (route: ConversionRoute) => {
        try {
            setConverting(route.id);
            setResults(prev => ({ ...prev, [route.id]: { success: false } }));

            // Pick file
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                setConverting(null);
                return;
            }

            const file = result.assets[0];
            const fileUri = file.uri;

            // Check file extension matches
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];

            let isValid = false;
            if (route.from === 'image') {
                isValid = imageExtensions.includes(fileExt || '');
            } else {
                isValid = fileExt === route.from;
            }

            if (!isValid) {
                Alert.alert(
                    'Format Tidak Cocok',
                    `File harus berformat .${route.from}. File Anda: .${fileExt}`,
                    [{ text: 'OK' }]
                );
                setConverting(null);
                return;
            }

            // Perform conversion based on route
            let conversionResult: { success: boolean; uri?: string; content?: string; error?: string };

            switch (route.id) {
                // PDF conversions
                case 'txt-pdf':
                    const text = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.textToPDFAdvanced(text);
                    break;
                case 'pdf-jpg':
                    conversionResult = await AdvancedConverters.pdfToImages(fileUri, 'jpeg');
                    break;
                case 'pdf-png':
                    conversionResult = await AdvancedConverters.pdfToImages(fileUri, 'png');
                    break;
                case 'pdf-txt':
                    conversionResult = await AdvancedConverters.pdfToText(fileUri);
                    break;
                case 'html-pdf':
                    const html = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.htmlToPDFAdvanced(html);
                    break;

                // IMAGE conversions
                case 'image-txt':
                    conversionResult = await AdvancedConverters.imageToText(fileUri);
                    break;
                case 'image-pdf':
                    conversionResult = await AdvancedConverters.imageToPDF(fileUri);
                    break;
                case 'heic-jpg':
                case 'webp-jpg':
                case 'bmp-jpg':
                case 'gif-jpg':
                case 'png-jpg':
                    conversionResult = await AdvancedConverters.convertImageFormat(fileUri, 'jpeg');
                    break;
                case 'svg-png':
                case 'jpg-png':
                    conversionResult = await AdvancedConverters.convertImageFormat(fileUri, 'png');
                    break;

                // DOCX conversions
                case 'docx-pdf':
                    conversionResult = await AdvancedConverters.docxToPDF(fileUri);
                    break;
                case 'docx-html':
                    conversionResult = await AdvancedConverters.docxToHTML(fileUri);
                    break;
                case 'docx-txt':
                    conversionResult = await AdvancedConverters.docxToText(fileUri);
                    break;
                case 'pdf-docx':
                    conversionResult = await AdvancedConverters.pdfToDOCX(fileUri);
                    break;
                case 'txt-docx':
                    const textContent = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.textToDOCX(textContent);
                    break;

                // Excel conversions
                case 'xlsx-pdf':
                    conversionResult = await AdvancedConverters.xlsxToPDF(fileUri);
                    break;
                case 'xlsx-csv':
                    conversionResult = await AdvancedConverters.xlsxToCSV(fileUri);
                    break;
                case 'xlsx-json':
                    conversionResult = await AdvancedConverters.xlsxToJSON(fileUri);
                    break;
                case 'csv-xlsx':
                    const csvContent = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.csvToXLSX(csvContent);
                    break;

                // CSV/JSON conversions
                case 'csv-json':
                    const csvData = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.csvToJSONAdvanced(csvData);
                    break;
                case 'json-csv':
                    const jsonContent = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.jsonToCSVAdvanced(jsonContent);
                    break;

                // Markdown conversions
                case 'md-html':
                    const mdContent = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.markdownToHTMLAdvanced(mdContent);
                    break;
                case 'html-md':
                    const htmlContent = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.htmlToMarkdown(htmlContent);
                    break;

                // MISC conversions
                case 'html-txt':
                    const htmlToTxt = await FileUtils.readAsStringAsync(fileUri);
                    // Simple regex strip
                    conversionResult = {
                        content: htmlToTxt.replace(/<[^>]*>/g, ' '),
                        success: true
                    };
                    break;
                case 'txt-html':
                    const txtToHtml = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = {
                        content: `<html><body><pre>${txtToHtml}</pre></body></html>`,
                        success: true
                    };
                    break;

                // XML conversions
                case 'xml-json':
                    const xmlContent = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.xmlToJSONAdvanced(xmlContent);
                    break;
                case 'json-xml':
                    const jsonData2 = await FileUtils.readAsStringAsync(fileUri);
                    conversionResult = await AdvancedConverters.jsonToXML(jsonData2);
                    break;

                default:
                    conversionResult = { success: false, error: 'Konversi belum tersedia' };
            }

            if (conversionResult.success) {
                // Download result
                if ('uri' in conversionResult && conversionResult.uri) {
                    const isZip = conversionResult.uri.includes('blob') && route.id.includes('pdf-') && (route.to === 'jpg' || route.to === 'png');
                    const ext = isZip ? 'zip' : route.to;
                    FileUtils.downloadFile(conversionResult.uri, `converted.${ext}`);
                } else if ('content' in conversionResult && conversionResult.content) {
                    const uri = await FileUtils.writeAsStringAsync(
                        `${FileUtils.getCacheDirectory()}converted.${route.to}`,
                        conversionResult.content
                    );
                    FileUtils.downloadFile(uri, `converted.${route.to}`);
                }

                // Add to history
                addToHistory(
                    fileUri,
                    file.name,
                    route.from,
                    route.to,
                    file.size || 0
                );

                setResults(prev => ({ ...prev, [route.id]: { success: true } }));
                Alert.alert('✅ Berhasil!', `File ${route.label} berhasil dikonversi dan diunduh!`, [{ text: 'OK' }]);
            } else {
                setResults(prev => ({ ...prev, [route.id]: { success: false, error: conversionResult.error } }));
                Alert.alert('❌ Gagal', conversionResult.error || 'Konversi gagal', [{ text: 'OK' }]);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan';
            setResults(prev => ({ ...prev, [route.id]: { success: false, error: errorMsg } }));
            Alert.alert('❌ Error', errorMsg, [{ text: 'OK' }]);
        } finally {
            setConverting(null);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🔄 Konversi Dokumen</Text>
                <Text style={styles.subtitle}>Pilih jenis konversi yang Anda inginkan</Text>

                {/* Search */}
                <Searchbar
                    placeholder="Cari konversi..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                    inputStyle={styles.searchInput}
                />

                {/* Category Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {CATEGORIES.map(category => (
                        <TouchableOpacity
                            key={category.id}
                            onPress={() => setSelectedCategory(category.id)}
                            style={[
                                styles.categoryChip,
                                selectedCategory === category.id && { backgroundColor: category.color }
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={category.icon as any}
                                size={16}
                                color={selectedCategory === category.id ? '#fff' : category.color}
                            />
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === category.id && styles.categoryTextActive
                            ]}>
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Conversion Grid */}
            <ScrollView contentContainerStyle={styles.grid}>
                {filteredRoutes.map(route => (
                    <TouchableOpacity
                        key={route.id}
                        onPress={() => handleConversion(route)}
                        disabled={converting !== null}
                        style={[
                            styles.card,
                            converting === route.id && styles.cardConverting,
                            results[route.id]?.success && styles.cardSuccess,
                            results[route.id]?.error ? styles.cardError : undefined,
                        ]}
                    >
                        <LinearGradient
                            colors={[`${route.color}15`, `${route.color}08`]}
                            style={styles.cardGradient}
                        >
                            <MaterialCommunityIcons
                                name={route.icon as any}
                                size={32}
                                color={route.color}
                            />
                            <Text style={styles.cardLabel}>{route.label}</Text>
                            <Text style={styles.cardLibrary}>{route.library}</Text>

                            {/* Status indicators */}
                            {converting === route.id && (
                                <View style={styles.statusContainer}>
                                    <ActivityIndicator size="small" color={route.color} />
                                </View>
                            )}
                            {results[route.id]?.success && (
                                <View style={styles.statusContainer}>
                                    <MaterialCommunityIcons name="check-circle" size={20} color="#30D158" />
                                </View>
                            )}
                            {results[route.id]?.error && (
                                <View style={styles.statusContainer}>
                                    <MaterialCommunityIcons name="alert-circle" size={20} color="#FF3B30" />
                                </View>
                            )}

                            <View style={[styles.qualityBadge, { backgroundColor: route.color }]}>
                                <Text style={styles.qualityText}>
                                    {route.quality === 'high' ? '⭐⭐⭐' : route.quality === 'medium' ? '⭐⭐' : '⭐'}
                                </Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#8E8E93',
        marginBottom: 16,
    },
    searchbar: {
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        elevation: 0,
        marginBottom: 12,
    },
    searchInput: {
        color: '#1C1C1E',
    },
    categoryScroll: {
        gap: 8,
        paddingVertical: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    categoryTextActive: {
        color: '#fff',
    },
    grid: {
        padding: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: '48%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                // shadowColor, shadowOffset, shadowOpacity, shadowRadius are deprecated
            },
            android: {
                elevation: 2,
            },
            web: {
                // @ts-ignore
                boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
            }
        }),
    },
    cardConverting: {
        opacity: 0.7,
    },
    cardSuccess: {
        borderWidth: 2,
        borderColor: '#30D158',
    },
    cardError: {
        borderWidth: 2,
        borderColor: '#FF3B30',
    },
    cardGradient: {
        padding: 16,
        alignItems: 'center',
        minHeight: 140,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
        marginTop: 8,
        textAlign: 'center',
    },
    cardLibrary: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 4,
    },
    statusContainer: {
        marginTop: 8,
    },
    qualityBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    qualityText: {
        fontSize: 10,
        color: '#fff',
    },
});
