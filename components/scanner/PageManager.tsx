/**
 * Page Manager Component
 * Handles page listing, selection, and reordering
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Text, Surface, IconButton, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScannedPage } from '@/hooks/useDocumentStore';
import { getFilterStyle } from '@/lib/imageFilters';

interface PageManagerProps {
    pages: ScannedPage[];
    selectedPageIndex: number | null;
    onSelectPage: (index: number) => void;
    onDeletePage: (index: number) => void;
    onReorderPage: (fromIndex: number, toIndex: number) => void;
    onRotatePage: (index: number) => void;
    onEditPage: (index: number) => void;
}

export const PageManager: React.FC<PageManagerProps> = ({
    pages,
    selectedPageIndex,
    onSelectPage,
    onDeletePage,
    onReorderPage,
    onRotatePage,
    onEditPage,
}) => {
    const [reorderMode, setReorderMode] = useState(false);

    if (pages.length === 0) return null;

    return (
        <Surface style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    📄 Halaman ({pages.length})
                </Text>
                <TouchableOpacity
                    onPress={() => setReorderMode(!reorderMode)}
                    style={[styles.reorderBtn, reorderMode && styles.reorderBtnActive]}
                >
                    <MaterialCommunityIcons
                        name={reorderMode ? "check" : "sort"}
                        size={20}
                        color={reorderMode ? "#fff" : "#007AFF"}
                    />
                    <Text style={[styles.reorderBtnText, reorderMode && styles.reorderBtnTextActive]}>
                        {reorderMode ? "Selesai" : "Atur"}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.grid}>
                    {pages.map((page, index) => (
                        <View
                            key={page.id}
                            style={[
                                styles.cardWrapper,
                                reorderMode && styles.cardWrapperReorder
                            ]}
                        >
                            <View
                                style={[
                                    styles.card,
                                    selectedPageIndex === index && styles.cardSelected,
                                ]}
                            >
                                <Image
                                    source={{ uri: page.editedUri }}
                                    style={[styles.thumb, getFilterStyle(page.colorMode, page.adjustments) as any]}
                                    resizeMode="cover"
                                />

                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={styles.overlay}
                                >
                                    <Text style={styles.pageNumber}>{index + 1}</Text>
                                </LinearGradient>

                                {/* Main Card Action (Selection) - Absolute Fill */}
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={StyleSheet.absoluteFill}
                                    onPress={() => {
                                        if (reorderMode) return;
                                        onSelectPage(index);
                                    }}
                                />

                                {/* Delete Button (Normal Mode) */}
                                {!reorderMode && (
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => onDeletePage(index)}
                                    >
                                        <MaterialCommunityIcons name="close" size={12} color="#fff" />
                                    </TouchableOpacity>
                                )}

                                {/* Edit Button (Normal Mode) */}
                                {!reorderMode && selectedPageIndex === index && (
                                    <TouchableOpacity
                                        style={styles.editBtn}
                                        onPress={() => onEditPage(index)}
                                    >
                                        <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Reorder Controls */}
                            {reorderMode && (
                                <View style={styles.reorderControls}>
                                    <TouchableOpacity
                                        disabled={index === 0}
                                        onPress={() => onReorderPage(index, index - 1)}
                                        style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-left" size={20} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        disabled={index === pages.length - 1}
                                        onPress={() => onReorderPage(index, index + 1)}
                                        style={[styles.moveBtn, index === pages.length - 1 && styles.moveBtnDisabled]}
                                    >
                                        <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        marginVertical: 16,
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 16,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    reorderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(0,122,255,0.1)',
    },
    reorderBtnActive: {
        backgroundColor: '#007AFF',
    },
    reorderBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    reorderBtnTextActive: {
        color: '#fff',
    },
    scrollContent: {
        paddingRight: 16,
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
    },
    cardWrapper: {
        width: 100,
        gap: 8,
    },
    cardWrapperReorder: {
        width: 110,
    },
    card: {
        width: 100,
        height: 140,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F2F2F7',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: '#007AFF',
    },
    thumb: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        justifyContent: 'flex-end',
        padding: 8,
        pointerEvents: 'none', // Allow clicks to pass through overlay
    },
    pageNumber: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    deleteBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10, // Ensure on top
    },
    editBtn: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        zIndex: 10, // Ensure on top
    },
    reorderControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        padding: 4,
    },
    moveBtn: {
        padding: 4,
    },
    moveBtnDisabled: {
        opacity: 0.3,
    },
});

export default PageManager;
