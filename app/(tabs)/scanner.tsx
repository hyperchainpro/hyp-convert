/**
 * Enhanced Document Scanner Screen
 * Integrates Image Enhancement, OCR, Export Manager
 * Fully web-compatible with platform-safe camera handling
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    Platform,
} from 'react-native';
import { Text, Surface, Snackbar, Portal, Modal, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// Import components safely
import { ImageEditor } from '@/components/scanner/ImageEditor';
import { ImageEnhancer } from '@/components/scanner/ImageEnhancer';
import { CornerEditor } from '@/components/scanner/CornerEditor';
import { OCRViewer } from '@/components/scanner/OCRViewer';
import { ExportManager } from '@/components/export/ExportManager';
import { PageManager } from '@/components/scanner/PageManager';

import {
    ColorMode,
    ManualAdjustments,
    DEFAULT_ADJUSTMENTS,
    getFilterStyle,
    FILTER_PRESETS,
    processImageWeb,
} from '@/lib/imageFilters';
import {
    Corners,
    getDefaultCorners,
    cropToCorners,
} from '@/lib/documentDetection';
import { useDocumentStore, createScannedPage, ScannedPage } from '@/hooks/useDocumentStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function EnhancedScannerScreen() {
    const documentStore = useDocumentStore();

    // Current session pages
    const [pages, setPages] = useState<ScannedPage[]>([]);
    const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);

    // UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Modal states
    const [editorVisible, setEditorVisible] = useState(false);
    const [cornerEditorVisible, setCornerEditorVisible] = useState(false);
    const [ocrViewerVisible, setOcrViewerVisible] = useState(false);
    const [exportManagerVisible, setExportManagerVisible] = useState(false);

    // Scan Mode
    const [scanMode, setScanMode] = useState<'document' | 'card' | 'id' | 'receipt'>('document');
    const [batchMode, setBatchMode] = useState(false);

    // Corner editing
    const [currentCorners, setCurrentCorners] = useState<Corners | null>(null);
    const [cornerEditImageUri, setCornerEditImageUri] = useState<string | null>(null);

    // Web camera
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [webStream, setWebStream] = useState<MediaStream | null>(null);

    // Animation
    const [pulseAnim] = useState(new Animated.Value(1));
    const [fabOpen, setFabOpen] = useState(false);

    const selectedPage = selectedPageIndex !== null ? pages[selectedPageIndex] : null;

    // Pulse animation for empty state
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        if (pages.length === 0) pulse.start();
        else pulse.stop();
        return () => pulse.stop();
    }, [pages.length]);

    // =====================================================
    // IMAGE CAPTURE
    // =====================================================

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: scanMode === 'document',
                quality: 1, // Max quality
            });

            if (!result.canceled && result.assets) {
                const newPages: ScannedPage[] = result.assets.map(asset => createScannedPage(asset.uri));
                // Optionally apply auto-enhance here for web?
                // For now, keep original to let user choose
                setPages(prev => [...prev, ...newPages]);
                showSnackbar(`✅ ${newPages.length} halaman ditambahkan`);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showSnackbar('❌ Gagal memilih gambar');
        }
    };

    const startWebCamera = async () => {
        if (Platform.OS !== 'web') {
            // On mobile, use ImagePicker camera
            try {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    showSnackbar('⚠️ Izin kamera diperlukan');
                    return;
                }
                const result = await ImagePicker.launchCameraAsync({
                    quality: 1,
                    allowsEditing: false,
                });
                if (!result.canceled && result.assets?.[0]) {
                    const newPage = createScannedPage(result.assets[0].uri);
                    setPages(prev => [...prev, newPage]);
                    showSnackbar('✅ Foto ditambahkan');
                }
            } catch (error) {
                console.error('Camera error:', error);
                showSnackbar('❌ Gagal membuka kamera');
            }
            return;
        }

        // Web camera - Request HIGH RESOLUTION
        setCameraActive(true);
        // Web camera - Robust access
        setCameraActive(true);
        try {
            // First try high resolution
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 }, // 1080p ideal
                        height: { ideal: 1080 }
                    }
                });
                gotStream(stream);
            } catch (highResError) {
                console.warn('High-res camera access failed, trying default:', highResError);
                // Fallback to default constraints (let browser decide)
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                gotStream(stream);
            }
        } catch (err) {
            console.warn('Environment camera failed, trying user camera:', err);
            try {
                // Fallback to ANY camera
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
                gotStream(stream);
            } catch (finalError) {
                console.error('All camera attempts failed:', finalError);
                showSnackbar('❌ Gagal akses kamera. Pastikan izin diberikan.');
                setCameraActive(false);
            }
        }
    };

    const gotStream = (stream: MediaStream) => {
        setWebStream(stream);
        // Ensure video element gets the stream
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }, 100);
    };

    const captureWebPhoto = async () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        // Match actual video resolution for max quality
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // 1.0 quality (max)
            const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

            // Auto-enhance based on Scan Mode
            let colorMode: ColorMode = 'original';
            let adjustments = DEFAULT_ADJUSTMENTS;

            if (scanMode === 'document') {
                const preset = FILTER_PRESETS.find(p => p.id === 'document');
                if (preset) {
                    colorMode = preset.colorMode;
                    adjustments = preset.adjustments;
                }
            } else if (scanMode === 'receipt') {
                const preset = FILTER_PRESETS.find(p => p.id === 'receipt');
                if (preset) {
                    colorMode = preset.colorMode;
                    adjustments = preset.adjustments;
                }
            } else if (scanMode === 'id') {
                const preset = FILTER_PRESETS.find(p => p.id === 'id-card');
                if (preset) {
                    colorMode = preset.colorMode;
                    adjustments = preset.adjustments;
                }
            } else if (scanMode === 'card') {
                const preset = FILTER_PRESETS.find(p => p.id === 'photo-doc');
                if (preset) {
                    colorMode = preset.colorMode;
                    adjustments = preset.adjustments;
                }
            }

            let editedUri = dataUrl;

            // Apply initial processing if needed
            if (colorMode !== 'original' && Platform.OS === 'web') {
                try {
                    editedUri = await processImageWeb(dataUrl, colorMode, adjustments);
                } catch (e) {
                    console.warn("Auto-enhance failed", e);
                }
            }

            const newPage: ScannedPage = {
                id: Math.random().toString(36).substr(2, 9),
                originalUri: dataUrl,
                editedUri: editedUri,
                colorMode,
                adjustments,
                rotation: 0,
                createdAt: Date.now(),
            };

            setPages(prev => [...prev, newPage]);
            showSnackbar('📸 Foto diambil');

            if (!batchMode) {
                stopWebCamera();
            }
        }
    };

    const stopWebCamera = () => {
        if (webStream) {
            webStream.getTracks().forEach(track => track.stop());
            setWebStream(null);
        }
        setCameraActive(false);
    };

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            if (webStream) {
                webStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [webStream]);

    // Update video element when stream changes
    useEffect(() => {
        if (Platform.OS === 'web' && videoRef.current && webStream) {
            videoRef.current.srcObject = webStream;
        }
    }, [webStream]);

    // =====================================================
    // PAGE OPERATIONS
    // =====================================================

    const updatePageFilter = useCallback(async (colorMode: ColorMode, adjustments: ManualAdjustments) => {
        if (selectedPageIndex === null) return;

        const currentPage = pages[selectedPageIndex];
        if (!currentPage) return;

        setIsProcessing(true);
        try {
            let newEditedUri = currentPage.originalUri;

            // ON WEB: Permanent Processing via Canvas
            // This burns the filter into the image pixels so export looks correct
            if (Platform.OS === 'web') {
                newEditedUri = await processImageWeb(
                    currentPage.originalUri,
                    colorMode,
                    adjustments
                );
            }

            // Note: On native, we might retain original and apply filter at export time
            // because manipulateAsync is limited. But processImageWeb handles web perfectly.

            setPages(prev => {
                const updated = [...prev];
                updated[selectedPageIndex] = {
                    ...updated[selectedPageIndex],
                    colorMode,
                    adjustments,
                    editedUri: newEditedUri, // This updates the display/export image!
                };
                return updated;
            });
        } catch (error) {
            console.error("Filter application failed:", error);
            showSnackbar("❌ Gagal menerapkan filter");
        } finally {
            setIsProcessing(false);
        }
    }, [selectedPageIndex, pages]);

    const deletePage = (index: number) => {
        setPages(prev => prev.filter((_, i) => i !== index));
        if (selectedPageIndex === index) {
            setSelectedPageIndex(null);
            setEditorVisible(false);
        } else if (selectedPageIndex !== null && selectedPageIndex > index) {
            setSelectedPageIndex(selectedPageIndex - 1);
        }
        showSnackbar('🗑️ Halaman dihapus');
    };

    const movePage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= pages.length) return;
        setPages(prev => {
            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
        setSelectedPageIndex(toIndex);
    };

    // =====================================================
    // CORNER EDITING
    // =====================================================

    const handleCornerConfirm = async () => {
        if (!cornerEditImageUri || !currentCorners) return;
        setIsProcessing(true);
        try {
            const { width, height } = await new Promise<{ width: number; height: number }>((resolve) => {
                Image.getSize(cornerEditImageUri, (w, h) => resolve({ width: w, height: h }));
            });
            const croppedUri = await cropToCorners(cornerEditImageUri, currentCorners, width, height);

            if (selectedPageIndex !== null) {
                const page = pages[selectedPageIndex];
                let newEditedUri = croppedUri;

                // Re-apply existing filters to the new cropped image
                if (Platform.OS === 'web') {
                    newEditedUri = await processImageWeb(
                        croppedUri,
                        page.colorMode,
                        page.adjustments
                    );
                }

                setPages(prev => {
                    const updated = [...prev];
                    updated[selectedPageIndex] = {
                        ...updated[selectedPageIndex],
                        originalUri: croppedUri, // Update base to be the cropped version so filters apply to crop
                        editedUri: newEditedUri,
                    };
                    return updated;
                });
            }
            showSnackbar('✅ Crop diterapkan');
        } catch (error) {
            console.error('Error cropping:', error);
            showSnackbar('❌ Gagal crop gambar');
        } finally {
            setIsProcessing(false);
            setCornerEditorVisible(false);
        }
    };


    // =====================================================
    // SAVE DOCUMENT
    // =====================================================

    const saveDocument = async () => {
        if (pages.length === 0) {
            showSnackbar('⚠️ Tidak ada halaman untuk disimpan');
            return;
        }
        try {
            const doc = await documentStore.createDocument(pages);
            showSnackbar(`📁 Dokumen disimpan: ${doc.name}`);
        } catch (error) {
            console.error('Error saving:', error);
            showSnackbar('❌ Gagal menyimpan dokumen');
        }
    };

    const showSnackbar = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    // =====================================================
    // RENDER WEB CAMERA VIEW
    // =====================================================

    if (cameraActive && Platform.OS === 'web') {
        return (
            <View style={styles.cameraContainer}>
                {/* Video Feed */}
                <View style={styles.cameraPreview}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            backgroundColor: '#000',
                        } as any}
                    />

                    {/* Guide Frame Overlay */}
                    <View style={styles.cameraOverlay}>
                        <View style={styles.cameraGuideFrame}>
                            <View style={[styles.corner, styles.tl]} />
                            <View style={[styles.corner, styles.tr]} />
                            <View style={[styles.corner, styles.bl]} />
                            <View style={[styles.corner, styles.br]} />

                            <View style={styles.cameraGuideLabel}>
                                <Text style={styles.cameraGuideLabelText}>
                                    {scanMode === 'card' ? 'KARTU NAMA' :
                                        scanMode === 'id' ? 'ID CARD' :
                                            scanMode === 'receipt' ? 'STRUK' : 'DOKUMEN'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Camera Bottom Bar */}
                <View style={styles.cameraBottomBar}>
                    <TouchableOpacity onPress={stopWebCamera} style={styles.cameraCancelBtn}>
                        <MaterialCommunityIcons name="close" size={28} color="#fff" />
                        <Text style={styles.cameraCancelText}>Batal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={captureWebPhoto} style={styles.captureBtn}>
                        <View style={styles.captureBtnInner} />
                    </TouchableOpacity>

                    <View style={styles.cameraBatchInfo}>
                        {batchMode && (
                            <>
                                <View style={styles.batchBadge}>
                                    <Text style={styles.batchBadgeText}>{pages.length}</Text>
                                </View>
                                <TouchableOpacity onPress={stopWebCamera}>
                                    <Text style={styles.cameraDoneText}>Selesai</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    // =====================================================
    // MAIN RENDER
    // =====================================================

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Empty State */}
                {pages.length === 0 && (
                    <Animated.View style={[styles.emptyState, { transform: [{ scale: pulseAnim }] }]}>
                        <LinearGradient
                            colors={['rgba(0,122,255,0.12)', 'rgba(88,86,214,0.12)']}
                            style={styles.emptyGradient}
                        >
                            <View style={styles.emptyIconBg}>
                                <LinearGradient colors={['#007AFF', '#5856D6']} style={styles.emptyIconGradient}>
                                    <MaterialCommunityIcons name="camera-document" size={48} color="#fff" />
                                </LinearGradient>
                            </View>

                            <Text style={styles.emptyTitle}>Document Scanner</Text>
                            <Text style={styles.emptySubtitle}>
                                Scan dokumen, kartu nama, struk & ID card{'\n'}
                                dengan OCR 50+ bahasa dan export ke berbagai format
                            </Text>

                            <View style={styles.featureChips}>
                                <Chip icon="auto-fix" style={styles.featureChip} textStyle={styles.featureChipText}>
                                    Smart Detection
                                </Chip>
                                <Chip icon="text-recognition" style={styles.featureChip} textStyle={styles.featureChipText}>
                                    OCR Engine
                                </Chip>
                                <Chip icon="file-pdf-box" style={styles.featureChip} textStyle={styles.featureChipText}>
                                    Multi-Format
                                </Chip>
                            </View>

                            {/* Primary Actions */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity onPress={startWebCamera} style={styles.primaryBtn}>
                                    <LinearGradient colors={['#007AFF', '#5856D6']} style={styles.primaryBtnGradient}>
                                        <MaterialCommunityIcons name="camera" size={22} color="#fff" />
                                        <Text style={styles.primaryBtnText}>Scan Kamera</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={pickImage} style={styles.secondaryBtn}>
                                    <MaterialCommunityIcons name="image-multiple" size={22} color="#007AFF" />
                                    <Text style={styles.secondaryBtnText}>Pilih Gambar</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.privacyBadge}>
                                <MaterialCommunityIcons name="shield-check" size={16} color="#30D158" />
                                <Text style={styles.privacyText}>100% Private • Offline Processing</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Pages Section */}
                {pages.length > 0 && (
                    <>
                        {/* Header Actions */}
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={() => setBatchMode(!batchMode)}
                                style={[styles.headerBtn, batchMode && styles.headerBtnActive]}
                            >
                                <MaterialCommunityIcons
                                    name="image-multiple"
                                    size={18}
                                    color={batchMode ? "#fff" : "#007AFF"}
                                />
                                <Text style={[styles.headerBtnText, batchMode && styles.headerBtnTextActive]}>
                                    {batchMode ? "Batch On" : "Batch Off"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={pickImage} style={styles.headerBtn}>
                                <MaterialCommunityIcons name="plus" size={18} color="#007AFF" />
                                <Text style={styles.headerBtnText}>Tambah</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={startWebCamera} style={styles.headerBtn}>
                                <MaterialCommunityIcons name="camera" size={18} color="#007AFF" />
                                <Text style={styles.headerBtnText}>Kamera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={saveDocument} style={[styles.headerBtn, styles.headerBtnSave]}>
                                <MaterialCommunityIcons name="content-save" size={18} color="#30D158" />
                                <Text style={[styles.headerBtnText, { color: '#30D158' }]}>Simpan</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Page Manager */}
                        <PageManager
                            pages={pages}
                            selectedPageIndex={selectedPageIndex}
                            onSelectPage={(index) => {
                                setSelectedPageIndex(index);
                                setEditorVisible(true);
                            }}
                            onDeletePage={deletePage}
                            onReorderPage={movePage}
                            onRotatePage={(index) => {
                                setSelectedPageIndex(index);
                            }}
                            onEditPage={(index) => {
                                setSelectedPageIndex(index);
                                setEditorVisible(true);
                            }}
                        />

                        {/* Quick Actions */}
                        <Surface style={styles.section}>
                            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
                            <View style={styles.actionsGrid}>
                                <TouchableOpacity
                                    style={styles.actionCard}
                                    onPress={() => setExportManagerVisible(true)}
                                >
                                    <LinearGradient colors={['#30D158', '#34C759']} style={styles.actionIcon}>
                                        <MaterialCommunityIcons name="file-pdf-box" size={24} color="#fff" />
                                    </LinearGradient>
                                    <Text style={styles.actionLabel}>Export PDF</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionCard}
                                    onPress={() => {
                                        if (!selectedPage) setSelectedPageIndex(0);
                                        setOcrViewerVisible(true);
                                    }}
                                >
                                    <LinearGradient colors={['#007AFF', '#5856D6']} style={styles.actionIcon}>
                                        <MaterialCommunityIcons name="text-recognition" size={24} color="#fff" />
                                    </LinearGradient>
                                    <Text style={styles.actionLabel}>OCR Teks</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionCard}
                                    onPress={() => {
                                        if (selectedPage) {
                                            setCornerEditImageUri(selectedPage.editedUri);
                                            setCurrentCorners(getDefaultCorners(SCREEN_WIDTH - 64, (SCREEN_WIDTH - 64) * 1.4));
                                            setCornerEditorVisible(true);
                                        } else {
                                            showSnackbar('⚠️ Pilih halaman terlebih dahulu');
                                        }
                                    }}
                                >
                                    <LinearGradient colors={['#AF52DE', '#BF5AF2']} style={styles.actionIcon}>
                                        <MaterialCommunityIcons name="crop" size={24} color="#fff" />
                                    </LinearGradient>
                                    <Text style={styles.actionLabel}>Crop</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionCard}
                                    onPress={() => setExportManagerVisible(true)}
                                >
                                    <LinearGradient colors={['#FF9500', '#FF9F0A']} style={styles.actionIcon}>
                                        <MaterialCommunityIcons name="share-variant" size={24} color="#fff" />
                                    </LinearGradient>
                                    <Text style={styles.actionLabel}>Share</Text>
                                </TouchableOpacity>
                            </View>
                        </Surface>

                        {/* Quick Presets */}
                        <Surface style={styles.section}>
                            <Text style={styles.sectionTitle}>🎨 Filter Presets</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.presetsRow}>
                                    {FILTER_PRESETS.map((preset) => (
                                        <TouchableOpacity
                                            key={preset.id}
                                            style={styles.presetBtn}
                                            onPress={() => {
                                                if (selectedPageIndex !== null) {
                                                    updatePageFilter(preset.colorMode, preset.adjustments);
                                                    showSnackbar(`✨ Preset "${preset.name}" diterapkan`);
                                                } else {
                                                    showSnackbar('⚠️ Pilih halaman terlebih dahulu');
                                                }
                                            }}
                                        >
                                            <MaterialCommunityIcons name={preset.icon as any} size={20} color="#007AFF" />
                                            <Text style={styles.presetLabel}>{preset.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </Surface>
                    </>
                )}
            </ScrollView>

            {/* FAB (Floating Action Button) */}
            {pages.length > 0 && (
                <View style={[styles.fabArea, { pointerEvents: 'box-none' } as any]}>
                    {fabOpen && (
                        <>
                            <TouchableOpacity
                                style={[styles.fabAction, { bottom: 140 }]}
                                onPress={() => {
                                    setFabOpen(false);
                                    setTimeout(() => startWebCamera(), 100);
                                }}
                            >
                                <View style={styles.fabActionContent}>
                                    <Text style={styles.fabLabel}>Scan Kamera</Text>
                                    <View style={[styles.fabActionButton, { backgroundColor: '#007AFF' }]}>
                                        <MaterialCommunityIcons name="camera" size={22} color="#FFF" />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.fabAction, { bottom: 80 }]}
                                onPress={() => {
                                    setFabOpen(false);
                                    setTimeout(() => pickImage(), 100);
                                }}
                            >
                                <View style={styles.fabActionContent}>
                                    <Text style={styles.fabLabel}>Pilih Gambar</Text>
                                    <View style={[styles.fabActionButton, { backgroundColor: '#5856D6' }]}>
                                        <MaterialCommunityIcons name="image-multiple" size={22} color="#FFF" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.fabMain}
                        onPress={() => setFabOpen(!fabOpen)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={['#007AFF', '#5856D6']} style={styles.fabMainButton}>
                            <MaterialCommunityIcons
                                name={fabOpen ? 'close' : 'plus'}
                                size={28}
                                color="#FFF"
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Mode Selector */}
            <View style={styles.modeSelector}>
                <View style={styles.modePill}>
                    {(['document', 'card', 'id', 'receipt'] as const).map(mode => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.modeBtn, scanMode === mode && styles.modeBtnActive]}
                            onPress={() => setScanMode(mode)}
                        >
                            <Text style={[styles.modeText, scanMode === mode && styles.modeTextActive]}>
                                {mode === 'document' ? 'Dokumen' :
                                    mode === 'card' ? 'Kartu Nama' :
                                        mode === 'id' ? 'ID Card' : 'Struk'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Processing Overlay */}
            {isProcessing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.processingText}>Memproses...</Text>
                </View>
            )}

            {/* Modals */}
            <Portal>
                {/* Image Editor Modal */}
                <Modal
                    visible={editorVisible}
                    onDismiss={() => setEditorVisible(false)}
                    contentContainerStyle={styles.fullModal}
                >
                    {selectedPage && selectedPageIndex !== null && (
                        <ImageEditor
                            visible={editorVisible}
                            imageUri={selectedPage.originalUri}
                            initialColorMode={selectedPage.colorMode}
                            initialAdjustments={selectedPage.adjustments}
                            onClose={() => setEditorVisible(false)}
                            onSave={(uri, colorMode, adjustments) => {
                                updatePageFilter(colorMode, adjustments);
                                setEditorVisible(false);
                            }}
                        />
                    )}
                </Modal>

                {/* Corner Editor */}
                <Modal
                    visible={cornerEditorVisible}
                    onDismiss={() => setCornerEditorVisible(false)}
                    contentContainerStyle={styles.fullModal}
                >
                    {cornerEditImageUri && currentCorners && (
                        <CornerEditor
                            imageUri={cornerEditImageUri}
                            corners={currentCorners}
                            onCornersChange={setCurrentCorners}
                            onConfirm={handleCornerConfirm}
                            onCancel={() => setCornerEditorVisible(false)}
                        />
                    )}
                </Modal>

                {/* OCR Viewer */}
                <Modal
                    visible={ocrViewerVisible}
                    onDismiss={() => setOcrViewerVisible(false)}
                    contentContainerStyle={styles.fullModal}
                >
                    {selectedPage && (
                        <OCRViewer
                            imageUri={selectedPage.editedUri}
                            onClose={() => setOcrViewerVisible(false)}
                            onTextExtracted={(text) => {
                                if (selectedPageIndex !== null) {
                                    setPages(prev => {
                                        const updated = [...prev];
                                        updated[selectedPageIndex] = {
                                            ...updated[selectedPageIndex],
                                            ocrText: text,
                                        };
                                        return updated;
                                    });
                                }
                            }}
                        />
                    )}
                </Modal>

                {/* Export Manager */}
                <Modal
                    visible={exportManagerVisible}
                    onDismiss={() => setExportManagerVisible(false)}
                    contentContainerStyle={styles.fullModal}
                >
                    <ExportManager
                        pages={pages}
                        documentName={`Scan-${new Date().toLocaleDateString('id-ID')}`}
                        onClose={() => setExportManagerVisible(false)}
                        onExportComplete={(uri, format) => {
                            showSnackbar(`✅ Export ${format.toUpperCase()} berhasil!`);
                        }}
                    />
                </Modal>
            </Portal>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={2500}
                style={styles.snackbar}
            >
                <Text style={{ color: '#fff' }}>{snackbarMessage}</Text>
            </Snackbar>
        </View>
    );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    content: {
        padding: 16,
        paddingBottom: 140,
    },

    // Empty State
    emptyState: {
        marginTop: 20,
    },
    emptyGradient: {
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    emptyIconBg: {
        marginBottom: 20,
    },
    emptyIconGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        paddingHorizontal: 12,
    },
    featureChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 28,
    },
    featureChip: {
        backgroundColor: 'rgba(0,122,255,0.1)',
    },
    featureChipText: {
        color: '#007AFF',
        fontSize: 12,
    },
    actionButtons: {
        gap: 12,
        width: '100%',
        marginBottom: 24,
    },
    primaryBtn: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    primaryBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    primaryBtnText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#007AFF',
        backgroundColor: 'rgba(0,122,255,0.05)',
    },
    secondaryBtnText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#007AFF',
    },
    privacyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    privacyText: {
        fontSize: 13,
        color: '#30D158',
        fontWeight: '500',
    },

    // Header Actions
    headerActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    headerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: 'rgba(0,122,255,0.1)',
        borderRadius: 20,
    },
    headerBtnActive: {
        backgroundColor: '#007AFF',
    },
    headerBtnSave: {
        backgroundColor: 'rgba(48,209,88,0.1)',
    },
    headerBtnText: {
        color: '#007AFF',
        fontWeight: '600',
        fontSize: 13,
    },
    headerBtnTextActive: {
        color: '#fff',
    },

    // Sections
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 14,
    },

    // Actions Grid
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '22%',
        alignItems: 'center',
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        color: '#1C1C1E',
        fontWeight: '500',
        textAlign: 'center',
    },

    // Presets
    presetsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    presetBtn: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        minWidth: 80,
    },
    presetLabel: {
        fontSize: 12,
        color: '#1C1C1E',
        marginTop: 6,
        fontWeight: '500',
    },

    // Mode Selector
    modeSelector: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 5,
    },
    modePill: {
        backgroundColor: 'rgba(28,28,30,0.92)',
        borderRadius: 25,
        padding: 4,
        flexDirection: 'row',
    },
    modeBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    modeBtnActive: {
        backgroundColor: '#007AFF',
    },
    modeText: {
        color: '#8E8E93',
        fontWeight: '600',
        fontSize: 13,
    },
    modeTextActive: {
        color: '#fff',
    },

    // FAB
    fabArea: {
        position: 'absolute',
        bottom: 60,
        right: 20,
        alignItems: 'flex-end',
        zIndex: 10,
    },
    fabAction: {
        position: 'absolute',
        right: 0,
    },
    fabActionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    fabLabel: {
        backgroundColor: 'rgba(28,28,30,0.9)',
        color: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: '600',
        overflow: 'hidden',
    },
    fabActionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
        elevation: 4,
    },
    fabMain: {
        borderRadius: 28,
        overflow: 'hidden',
    },
    fabMainButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Camera (Web)
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraPreview: {
        flex: 1,
        position: 'relative',
    },
    cameraOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraGuideFrame: {
        width: '80%',
        aspectRatio: 1 / 1.414,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        borderRadius: 8,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#30D158',
        borderWidth: 3,
    },
    tl: { top: -1, left: -1, borderBottomWidth: 0, borderRightWidth: 0 },
    tr: { top: -1, right: -1, borderBottomWidth: 0, borderLeftWidth: 0 },
    bl: { bottom: -1, left: -1, borderTopWidth: 0, borderRightWidth: 0 },
    br: { bottom: -1, right: -1, borderTopWidth: 0, borderLeftWidth: 0 },
    cameraGuideLabel: {
        position: 'absolute',
        top: -32,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cameraGuideLabelText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 1,
    },
    cameraBottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    cameraCancelBtn: {
        alignItems: 'center',
        width: 60,
    },
    cameraCancelText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 2,
    },
    captureBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: '#fff',
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureBtnInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
    },
    cameraBatchInfo: {
        width: 60,
        alignItems: 'center',
    },
    batchBadge: {
        backgroundColor: '#007AFF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    batchBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    cameraDoneText: {
        color: '#30D158',
        fontSize: 13,
        fontWeight: '600',
    },

    // Processing
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    processingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },

    // Modal
    fullModal: {
        flex: 1,
        margin: 0,
    },

    // Snackbar
    snackbar: {
        backgroundColor: '#1C1C1E',
        marginBottom: 70,
    },
});
