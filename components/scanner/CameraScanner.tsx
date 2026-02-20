import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform, Text } from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CameraScannerProps {
    onCapture: (uri: string) => void;
    onClose: () => void;
    batchMode?: boolean;
    capturedCount?: number;
    onFinishBatch?: () => void;
    scanMode?: 'document' | 'card' | 'id' | 'receipt';
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
    onCapture,
    onClose,
    batchMode = false,
    capturedCount = 0,
    onFinishBatch,
    scanMode = 'document'
}) => {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [flash, setFlash] = useState<FlashMode>('off');
    const [isCapturing, setIsCapturing] = useState(false);

    // Auto-detection simulation state
    const [isSteady, setIsSteady] = useState(false);
    const [detecting, setDetecting] = useState(false);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    // Auto-capture logic
    const [autoCaptureTimer, setAutoCaptureTimer] = useState<any | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null); // Visual countdown

    useEffect(() => {
        const interval = setInterval(() => {
            // Randomly simulate gaining "focus" on a document
            const isFocused = Math.random() > 0.4; // Slightly increased chance
            setIsSteady(isFocused);
            setDetecting(true);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    // Auto-trigger when steady
    useEffect(() => {
        if (isSteady && !isCapturing && !countdown) {
            // Start countdown
            const timer = setTimeout(() => {
                takePicture();
            }, 1500); // 1.5s stability required

            setAutoCaptureTimer(timer);
            setCountdown(3); // Start visual countdown (simulated)
        } else if (!isSteady) {
            // Reset if moved
            if (autoCaptureTimer) clearTimeout(autoCaptureTimer);
            setAutoCaptureTimer(null);
            setCountdown(null);
        }

        return () => {
            if (autoCaptureTimer) clearTimeout(autoCaptureTimer);
        };
    }, [isSteady, isCapturing]);

    // Web Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const [webStream, setWebStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (Platform.OS === 'web' && permission?.granted) {
            const startWebCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: facing === 'front' ? 'user' : 'environment' }
                    });
                    setWebStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Error accessing web camera:", err);
                    // showSnackbar('Gagal akses kamera web');
                }
            };
            startWebCamera();

            return () => {
                if (webStream) {
                    webStream.getTracks().forEach(track => track.stop());
                }
            };
        }
    }, [Platform.OS, permission?.granted, facing]);

    // Update video ref if stream changes (for hot reload or re-render)
    useEffect(() => {
        if (Platform.OS === 'web' && videoRef.current && webStream) {
            videoRef.current.srcObject = webStream;
        }
    }, [webStream]);

    const takePicture = async () => {
        if (isCapturing) return;
        setIsCapturing(true);

        try {
            if (Platform.OS === 'web') {
                if (videoRef.current) {
                    const video = videoRef.current;
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                        onCapture(dataUrl);
                    }
                }
            } else if (cameraRef.current) {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 1,
                    skipProcessing: true,
                });

                if (photo?.uri) {
                    onCapture(photo.uri);
                }
            }
        } catch (error) {
            console.error("Capture failed", error);
        } finally {
            setTimeout(() => setIsCapturing(false), 500);
        }
    };

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Izin kamera diperlukan untuk memindai dokumen</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.btn}>
                    <Text style={styles.btnText}>Berikan Izin</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Text style={styles.closeText}>Batal</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <View style={[styles.camera, { position: 'relative', overflow: 'hidden' }]}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Overlay UI (Reused) */}
                    <View style={styles.overlay}>
                        <View style={styles.header}>
                            <IconButton icon="close" iconColor="white" size={28} onPress={onClose} style={styles.controlBtn} />
                        </View>

                        {/* Smart Detection Guides (Web Version) */}
                        <View style={styles.guideContainer}>
                            <View style={[
                                styles.guideFrame,
                                isSteady ? styles.guideFrameActive : styles.guideFrameInactive,
                                // Simple dynamic sizing
                                { width: SCREEN_WIDTH * 0.85, height: (SCREEN_WIDTH * 0.85) * 1.414 }
                            ]}>
                                <View style={[styles.corner, styles.tl]} />
                                <View style={[styles.corner, styles.tr]} />
                                <View style={[styles.corner, styles.bl]} />
                                <View style={[styles.corner, styles.br]} />

                                {isSteady && (
                                    <View style={styles.captureHint}>
                                        <Text style={styles.captureHintText}>
                                            {countdown ? `Menangkap dalam 1...` : 'Tahan stabil...'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.bottomBar}>
                            <View style={styles.bottomSideBtn} />
                            <TouchableOpacity onPress={takePicture} style={styles.captureBtnOuter} activeOpacity={0.7}>
                                <View style={[styles.captureBtnInner, isSteady && styles.captureBtnSteady]} />
                            </TouchableOpacity>
                            <View style={styles.bottomSideBtn} />
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                flash={flash}
                ref={cameraRef}
                autofocus="on"
            >
                {/* Overlay UI */}
                <View style={styles.overlay}>
                    {/* Header Controls */}
                    <View style={styles.header}>
                        <IconButton
                            icon="close"
                            iconColor="white"
                            size={28}
                            onPress={onClose}
                            style={styles.controlBtn}
                        />
                        <View style={styles.topControls}>
                            <IconButton
                                icon={flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-auto' : 'flash-off'}
                                iconColor="white"
                                size={24}
                                onPress={() => setFlash(current =>
                                    current === 'off' ? 'on' : current === 'on' ? 'auto' : 'off'
                                )}
                                style={styles.controlBtn}
                            />
                            {batchMode && (
                                <Chip
                                    icon="image-multiple"
                                    style={styles.batchChip}
                                    textStyle={{ color: 'white' }}
                                >
                                    Batch Mode
                                </Chip>
                            )}
                        </View>
                    </View>

                    {/* Smart Detection Guides */}
                    <View style={styles.guideContainer}>
                        <View style={[
                            styles.guideFrame,
                            isSteady ? styles.guideFrameActive : styles.guideFrameInactive,
                            // Dynamic Sizing
                            (() => {
                                const w = SCREEN_WIDTH * 0.85;
                                switch (scanMode) {
                                    case 'card':
                                    case 'id':
                                        // Landscape card: 85x54 -> ratio ~1.58
                                        return { width: w, height: w / 1.58 };
                                    case 'receipt':
                                        // Long vertical receipt
                                        return { width: w * 0.8, height: SCREEN_HEIGHT * 0.7 };
                                    case 'document':
                                    default:
                                        // A4 Vertical
                                        return { width: w, height: w * 1.414 };
                                }
                            })()
                        ]}>
                            {/* Corner Markers */}
                            <View style={[styles.corner, styles.tl]} />
                            <View style={[styles.corner, styles.tr]} />
                            <View style={[styles.corner, styles.bl]} />
                            <View style={[styles.corner, styles.br]} />

                            {isSteady && (
                                <View style={styles.captureHint}>
                                    <Text style={styles.captureHintText}>
                                        {countdown ? `Menangkap dalam 1...` : 'Tahan stabil untuk auto-scan...'}
                                    </Text>
                                </View>
                            )}

                            {/* Mode Hint */}
                            <View style={{ position: 'absolute', top: -30, alignSelf: 'center' }}>
                                <Text style={styles.modeHintText}>
                                    {scanMode === 'card' ? 'KARTU NAMA' : scanMode === 'id' ? 'ID CARD' : scanMode === 'receipt' ? 'STRUK' : 'DOKUMEN'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Bottom Controls */}
                    <View style={styles.bottomBar}>
                        {/* Gallery / Recent Preview */}
                        <View style={styles.bottomSideBtn}>
                            {batchMode && capturedCount > 0 && (
                                <TouchableOpacity onPress={onFinishBatch} style={styles.finishBatchBtn}>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{capturedCount}</Text>
                                    </View>
                                    <Text style={styles.finishText}>Selesai</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Capture Button */}
                        <TouchableOpacity
                            onPress={takePicture}
                            style={styles.captureBtnOuter}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.captureBtnInner,
                                isSteady && styles.captureBtnSteady // Visual feedback
                            ]} />
                        </TouchableOpacity>

                        {/* Camera Switch ?? Maybe not needed for scanner */}
                        <View style={styles.bottomSideBtn}>
                            {/* <IconButton
                                icon="camera-flip"
                                iconColor="white"
                                size={28}
                                onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
                            /> */}
                        </View>
                    </View>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    permissionText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20
    },
    btn: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12
    },
    btnText: {
        color: 'white',
        fontWeight: '600'
    },
    closeBtn: {
        padding: 10
    },
    closeText: {
        color: '#8E8E93'
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 20,
        // Ensure overlay sits on top of video on web
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' ? 40 : 20,
    },
    topControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    controlBtn: {
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    batchChip: {
        backgroundColor: 'rgba(255, 149, 0, 0.8)',
    },
    guideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideFrame: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        position: 'relative',
    },
    // Dimensions managed inline based on mode
    guideFrameActive: {
        borderColor: '#30D158', // Green when steady
        backgroundColor: 'rgba(48, 209, 88, 0.1)',
    },
    guideFrameInactive: {
        borderColor: 'rgba(255,255,255,0.5)',
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: 'white',
        borderWidth: 3,
    },
    tl: { top: -1, left: -1, borderBottomWidth: 0, borderRightWidth: 0 },
    tr: { top: -1, right: -1, borderBottomWidth: 0, borderLeftWidth: 0 },
    bl: { bottom: -1, left: -1, borderTopWidth: 0, borderRightWidth: 0 },
    br: { bottom: -1, right: -1, borderTopWidth: 0, borderLeftWidth: 0 },

    captureHint: {
        position: 'absolute',
        bottom: -40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureHintText: {
        color: 'white',
        fontWeight: '600',
        ...Platform.select({
            ios: {
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
            },
            android: {
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
            },
            web: {
                // @ts-ignore
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }
        }),
    },
    modeHintText: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        ...Platform.select({
            ios: {
                textShadowColor: 'black',
                textShadowRadius: 2,
            },
            android: {
                textShadowColor: 'black',
                textShadowRadius: 2,
            },
            web: {
                // @ts-ignore
                textShadow: '0px 0px 2px black',
            }
        }),
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 30,
    },
    captureBtnOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'white',
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureBtnInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'white',
    },
    captureBtnSteady: {
        backgroundColor: '#30D158', // Green shutter when steady
    },
    bottomSideBtn: {
        width: 60,
        alignItems: 'center',
    },
    finishBatchBtn: {
        alignItems: 'center',
    },
    badge: {
        backgroundColor: '#007AFF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    finishText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    }

});

export default CameraScanner;
