import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Captcha image categories with emoji representations for web preview
// In production, replace with actual image URLs
const CAPTCHA_CATEGORIES = {
    animals: {
        label: 'hewan',
        items: [
            { id: 'cat', emoji: '🐱', label: 'kucing' },
            { id: 'dog', emoji: '🐕', label: 'anjing' },
            { id: 'bird', emoji: '🐦', label: 'burung' },
        ],
    },
    vehicles: {
        label: 'kendaraan',
        items: [
            { id: 'car', emoji: '🚗', label: 'mobil' },
            { id: 'bike', emoji: '🚲', label: 'sepeda' },
            { id: 'plane', emoji: '✈️', label: 'pesawat' },
        ],
    },
    food: {
        label: 'makanan',
        items: [
            { id: 'pizza', emoji: '🍕', label: 'pizza' },
            { id: 'apple', emoji: '🍎', label: 'apel' },
            { id: 'cake', emoji: '🎂', label: 'kue' },
        ],
    },
};

type CaptchaItem = {
    id: string;
    emoji: string;
    label: string;
    category: string;
};

interface ImageCaptchaProps {
    onVerified: (isValid: boolean) => void;
    onError?: (error: string) => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const ImageCaptcha: React.FC<ImageCaptchaProps> = ({ onVerified, onError }) => {
    const [items, setItems] = useState<CaptchaItem[]>([]);
    const [targetCategory, setTargetCategory] = useState<string>('');
    const [targetLabel, setTargetLabel] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [attempts, setAttempts] = useState(0);
    const [isVerified, setIsVerified] = useState(false);
    const [showError, setShowError] = useState(false);

    const generateCaptcha = useCallback(() => {
        // Get all items from all categories
        const allItems: CaptchaItem[] = [];
        Object.entries(CAPTCHA_CATEGORIES).forEach(([categoryKey, category]) => {
            category.items.forEach(item => {
                allItems.push({
                    ...item,
                    category: categoryKey,
                });
            });
        });

        // Shuffle and take 9 items
        const shuffled = shuffleArray(allItems);

        // Select a random target category
        const categories = Object.keys(CAPTCHA_CATEGORIES);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const categoryData = CAPTCHA_CATEGORIES[randomCategory as keyof typeof CAPTCHA_CATEGORIES];

        setItems(shuffled);
        setTargetCategory(randomCategory);
        setTargetLabel(categoryData.label);
        setSelectedIds(new Set());
        setShowError(false);
    }, []);

    useEffect(() => {
        generateCaptcha();
    }, [generateCaptcha]);

    const handleItemPress = (id: string) => {
        if (isVerified) return;

        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        setShowError(false);
    };

    const handleVerify = () => {
        // Get all items that should be selected (matching target category)
        const correctIds = items
            .filter(item => item.category === targetCategory)
            .map(item => item.id);

        // Check if selection matches
        const selectedArray = Array.from(selectedIds);
        const isCorrect =
            correctIds.length === selectedArray.length &&
            correctIds.every(id => selectedIds.has(id));

        if (isCorrect) {
            setIsVerified(true);
            onVerified(true);
        } else {
            setShowError(true);
            setAttempts(prev => prev + 1);

            if (attempts >= 2) {
                // Refresh captcha after 3 failed attempts
                generateCaptcha();
                setAttempts(0);
                onError?.('Terlalu banyak percobaan gagal. Captcha telah diperbarui.');
            } else {
                onError?.('Pilihan salah. Silakan coba lagi.');
            }

            setSelectedIds(new Set());
        }
    };

    const handleRefresh = () => {
        generateCaptcha();
        setAttempts(0);
        setIsVerified(false);
        onVerified(false);
    };

    return (
        <Surface style={styles.container} elevation={2}>
            <View style={styles.header}>
                <Text variant="titleMedium" style={styles.instruction}>
                    Pilih semua gambar dengan{' '}
                    <Text style={styles.highlight}>{targetLabel}</Text>
                </Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                    <MaterialCommunityIcons name="refresh" size={24} color="#6366f1" />
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                {items.map((item, index) => (
                    <TouchableOpacity
                        key={`${item.id}-${index}`}
                        style={[
                            styles.gridItem,
                            selectedIds.has(item.id) && styles.gridItemSelected,
                            isVerified && item.category === targetCategory && styles.gridItemCorrect,
                        ]}
                        onPress={() => handleItemPress(item.id)}
                        disabled={isVerified}
                        accessibilityLabel={item.label}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selectedIds.has(item.id) }}
                    >
                        <Text style={styles.emoji}>{item.emoji}</Text>
                        {selectedIds.has(item.id) && (
                            <View style={styles.checkmark}>
                                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {showError && (
                <Text style={styles.errorText}>
                    Pilihan salah. Tersisa {3 - attempts} percobaan.
                </Text>
            )}

            {isVerified ? (
                <View style={styles.successContainer}>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                    <Text style={styles.successText}>Verifikasi berhasil!</Text>
                </View>
            ) : (
                <Button
                    mode="contained"
                    onPress={handleVerify}
                    disabled={selectedIds.size === 0}
                    style={styles.verifyButton}
                    buttonColor="#6366f1"
                >
                    Verifikasi
                </Button>
            )}
        </Surface>
    );
};

const { width } = Dimensions.get('window');
const gridSize = Math.min(width - 64, 300);
const itemSize = (gridSize - 16) / 3;

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#1a1a2e',
        marginVertical: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    instruction: {
        flex: 1,
        color: '#e2e8f0',
    },
    highlight: {
        color: '#6366f1',
        fontWeight: 'bold',
    },
    refreshButton: {
        padding: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    gridItem: {
        width: itemSize,
        height: itemSize,
        backgroundColor: '#16213e',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    gridItemSelected: {
        borderColor: '#6366f1',
        backgroundColor: '#1e293b',
    },
    gridItemCorrect: {
        borderColor: '#10b981',
        backgroundColor: '#064e3b',
    },
    emoji: {
        fontSize: 40,
    },
    checkmark: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#6366f1',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 12,
    },
    successContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    successText: {
        color: '#10b981',
        fontWeight: '600',
    },
    verifyButton: {
        marginTop: 8,
    },
});

export default ImageCaptcha;
