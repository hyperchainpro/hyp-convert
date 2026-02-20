import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { Text, Button, Surface, ActivityIndicator, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verificationStore } from '@/lib/verification';

// Expanded image source with more categories
const ALL_IMAGES = [
    // CARS (6)
    { id: 'c1', uri: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=300', tag: 'car' },
    { id: 'c2', uri: 'https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?w=300', tag: 'car' },
    { id: 'c3', uri: 'https://images.unsplash.com/photo-1503376763036-066120622c74?w=300', tag: 'car' },
    { id: 'c4', uri: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300', tag: 'car' },
    { id: 'c5', uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300', tag: 'car' },
    { id: 'c6', uri: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300', tag: 'car' },

    // NATURE (6)
    { id: 'n1', uri: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=300', tag: 'nature' },
    { id: 'n2', uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300', tag: 'nature' },
    { id: 'n3', uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300', tag: 'nature' },
    { id: 'n4', uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300', tag: 'nature' },
    { id: 'n5', uri: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300', tag: 'nature' },
    { id: 'n6', uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300', tag: 'nature' },

    // FOOD (6)
    { id: 'f1', uri: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=300', tag: 'food' },
    { id: 'f2', uri: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300', tag: 'food' },
    { id: 'f3', uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300', tag: 'food' },
    { id: 'f4', uri: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300', tag: 'food' },
    { id: 'f5', uri: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=300', tag: 'food' },
    { id: 'f6', uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300', tag: 'food' },

    // ANIMALS (6)
    { id: 'a1', uri: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=300', tag: 'animal' },
    { id: 'a2', uri: 'https://images.unsplash.com/photo-1529778873920-4da4926a7071?w=300', tag: 'animal' },
    { id: 'a3', uri: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=300', tag: 'animal' },
    { id: 'a4', uri: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=300', tag: 'animal' },
    { id: 'a5', uri: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=300', tag: 'animal' },
    { id: 'a6', uri: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=300', tag: 'animal' },

    // CITY (6)
    { id: 'ct1', uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300', tag: 'city' },
    { id: 'ct2', uri: 'https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?w=300', tag: 'city' },
    { id: 'ct3', uri: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=300', tag: 'city' },
    { id: 'ct4', uri: 'https://images.unsplash.com/photo-1449824913929-4bdd42b00fb3?w=300', tag: 'city' },
    { id: 'ct5', uri: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300', tag: 'city' },
    { id: 'ct6', uri: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=300', tag: 'city' },
];

const CATEGORIES = {
    car: 'MOBIL',
    nature: 'ALAM',
    food: 'MAKANAN',
    animal: 'HEWAN',
    city: 'KOTA',
};

export default function VerificationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ returnUrl?: string }>();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [images, setImages] = useState<any[]>([]);
    const [targetTag, setTargetTag] = useState('car');
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = () => {
        setLoading(true);
        setError('');
        setSelectedIds([]);

        // Randomly select a target category
        const tags = Object.keys(CATEGORIES);
        const newTarget = tags[Math.floor(Math.random() * tags.length)];
        setTargetTag(newTarget);

        // Get 3-6 correct images
        const correctImages = ALL_IMAGES.filter(img => img.tag === newTarget);
        // Shuffle correct images and pick 3-5
        const shuffledCorrect = [...correctImages].sort(() => 0.5 - Math.random());
        const selectedCorrect = shuffledCorrect.slice(0, 3 + Math.floor(Math.random() * 3)); // 3 to 5 correct images

        // Fill rest with incorrect images
        const incorrectImages = ALL_IMAGES.filter(img => img.tag !== newTarget);
        const shuffledIncorrect = [...incorrectImages].sort(() => 0.5 - Math.random());
        const needed = 9 - selectedCorrect.length;
        const selectedIncorrect = shuffledIncorrect.slice(0, needed);

        // Combine and shuffle final set
        const finalSet = [...selectedCorrect, ...selectedIncorrect].sort(() => 0.5 - Math.random());

        setImages(finalSet);
        setTimeout(() => setLoading(false), 500);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
        setError(''); // Clear error on interaction
    };

    const handleVerify = () => {
        setVerifying(true);

        // Validation logic
        const correctIds = images.filter(img => img.tag === targetTag).map(img => img.id);

        // Logic: specific implementation of "must select all correct images and NO wrong images"
        const selectedAllCorrect = correctIds.every(id => selectedIds.includes(id));
        const selectedNoWrong = selectedIds.every(id => correctIds.includes(id));
        const isCorrect = selectedAllCorrect && selectedNoWrong;

        setTimeout(() => {
            if (isCorrect && selectedIds.length > 0) {
                // Success
                verificationStore.setVerified(true);
                router.back();
            } else {
                setError('Verifikasi gagal. Pastikan memilih SEMUA gambar yang benar.');
                setVerifying(false);
                loadImages(); // Reset on fail to prevent brute force
            }
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <Surface style={styles.card}>
                {/* Header with Close Button */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                        <MaterialCommunityIcons name="close" size={24} color="#8E8E93" />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <MaterialCommunityIcons name="shield-check" size={32} color="#007AFF" />
                        <Text style={styles.title}>Verifikasi</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <Text style={styles.subtitle}>
                    Pilih semua gambar:
                </Text>
                <Text style={styles.targetText}>
                    {CATEGORIES[targetTag as keyof typeof CATEGORIES]}
                </Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {images.map((img) => (
                            <TouchableOpacity
                                key={img.id}
                                onPress={() => toggleSelection(img.id)}
                                activeOpacity={0.8}
                                style={[
                                    styles.gridItem,
                                    selectedIds.includes(img.id) && styles.gridItemSelected
                                ]}
                            >
                                <Image
                                    source={{ uri: img.uri }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                                {selectedIds.includes(img.id) && (
                                    <View style={styles.checkBadge}>
                                        <MaterialCommunityIcons name="check" size={16} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : null}

                <View style={styles.actions}>
                    <TouchableOpacity onPress={loadImages} style={styles.refreshBtn}>
                        <MaterialCommunityIcons name="refresh" size={24} color="#8E8E93" />
                    </TouchableOpacity>

                    <Button
                        mode="contained"
                        onPress={handleVerify}
                        loading={verifying}
                        disabled={selectedIds.length === 0 || verifying}
                        style={styles.verifyBtn}
                        contentStyle={{ height: 48 }}
                        buttonColor="#007AFF"
                    >
                        Verifikasi
                    </Button>
                </View>
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
        elevation: 8,
    },
    headerRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 2,
    },
    targetText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#007AFF',
        marginBottom: 20,
        letterSpacing: 1,
    },
    loadingContainer: {
        height: 290,
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 24,
    },
    gridItem: {
        width: 90,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    gridItemSelected: {
        borderColor: '#007AFF',
        transform: [{ scale: 0.95 }],
    },
    image: {
        width: '100%',
        height: '100%',
    },
    checkBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#007AFF',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
    },
    refreshBtn: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 14,
    },
    verifyBtn: {
        flex: 1,
        borderRadius: 14,
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 16,
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
    },
});
