import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, Searchbar, ActivityIndicator, Menu, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useConversionHistory, ConversionHistoryItem } from '@/hooks/useConversionHistory';
import { formatFileSize } from '@/constants/formats';
import { LinearGradient } from 'expo-linear-gradient';

export default function HistoryScreen() {
    const { history, loading, refresh, removeFromHistory, clearHistory } = useConversionHistory();
    const [filteredHistory, setFilteredHistory] = useState<ConversionHistoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [visibleMenuId, setVisibleMenuId] = useState<string | null>(null);

    const openMenu = (id: string) => setVisibleMenuId(id);
    const closeMenu = () => setVisibleMenuId(null);

    // Refresh on focus
    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [])
    );

    useEffect(() => {
        let filtered = history;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.original_format.toLowerCase().includes(query) ||
                    item.target_format.toLowerCase().includes(query) ||
                    item.file_name.toLowerCase().includes(query)
            );
        }

        if (selectedFilter) {
            filtered = filtered.filter(
                (item) =>
                    item.original_format === selectedFilter ||
                    item.target_format === selectedFilter
            );
        }

        setFilteredHistory(filtered);
    }, [history, searchQuery, selectedFilter]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    const handleDelete = (item: ConversionHistoryItem) => {
        const performDelete = () => {
            removeFromHistory(item.id);
        };

        if (Platform.OS === 'web') {
            if (confirm(`Hapus riwayat ${item.file_name}?`)) {
                performDelete();
            }
        } else {
            Alert.alert(
                'Hapus Riwayat',
                `Yakin ingin menghapus ${item.file_name}?`,
                [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Hapus', style: 'destructive', onPress: performDelete }
                ]
            );
        }
    };

    const handleClearAll = () => {
        if (history.length === 0) return;

        const performClear = () => {
            clearHistory();
        };

        if (Platform.OS === 'web') {
            if (confirm('Hapus SEMUA riwayat konversi?')) {
                performClear();
            }
        } else {
            Alert.alert(
                'Hapus Semua',
                'Yakin ingin menghapus seluruh riwayat konversi?',
                [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Hapus Semua', style: 'destructive', onPress: performClear }
                ]
            );
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFormatColor = (format: string): string => {
        const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'heic'];
        const docFormats = ['pdf', 'docx', 'txt', 'html', 'md'];
        const dataFormats = ['json', 'xml', 'csv', 'xlsx'];

        if (imageFormats.includes(format)) return '#30D158';
        if (docFormats.includes(format)) return '#007AFF';
        if (dataFormats.includes(format)) return '#BF5AF2';
        return '#FF9F0A';
    };

    const getFormatIcon = (format: string): string => {
        const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'heic'];
        const docFormats = ['pdf', 'docx', 'txt', 'html', 'md'];
        const dataFormats = ['json', 'xml', 'csv', 'xlsx'];

        if (imageFormats.includes(format)) return 'image';
        if (docFormats.includes(format)) return 'file-document';
        if (dataFormats.includes(format)) return 'database';
        return 'file';
    };

    const uniqueFormats = [...new Set(
        history.flatMap(item => [item.original_format, item.target_format])
    )].slice(0, 8);

    const renderHistoryItem = ({ item }: { item: ConversionHistoryItem }) => {
        const formatColor = getFormatColor(item.original_format);

        return (
            <View style={styles.historyItem}>
                <View style={[styles.formatBadge, { backgroundColor: formatColor + '20' }]}>
                    <MaterialCommunityIcons
                        name={getFormatIcon(item.original_format) as any}
                        size={22}
                        color={formatColor}
                    />
                </View>
                <View style={styles.itemContent}>
                    <Text numberOfLines={1} style={styles.fileName}>{item.file_name}</Text>
                    <View style={styles.formatRow}>
                        <Text style={styles.formatText}>{item.original_format.toUpperCase()}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={14} color="#8E8E93" style={{ marginHorizontal: 6 }} />
                        <Text style={styles.formatText}>{item.target_format.toUpperCase()}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.sizeText}>{formatFileSize(item.original_size)}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.dateText}>{formatDate(item.converted_at)}</Text>
                    </View>
                </View>
                <Menu
                    visible={visibleMenuId === item.id}
                    onDismiss={closeMenu}
                    anchor={
                        <IconButton
                            icon="dots-vertical"
                            size={20}
                            iconColor="#8E8E93"
                            onPress={() => openMenu(item.id)}
                        />
                    }
                >
                    <Menu.Item
                        onPress={() => { closeMenu(); handleDelete(item); }}
                        title="Hapus"
                        leadingIcon="delete"
                        titleStyle={{ color: '#FF3B30' }}
                    />
                </Menu>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="history" size={48} color="#48484A" />
            </View>
            <Text style={styles.emptyTitle}>Tidak ada riwayat</Text>
            <Text style={styles.emptyText}>
                {searchQuery || selectedFilter
                    ? 'Tidak ditemukan hasil yang cocok'
                    : 'Konversi file untuk melihat riwayat di sini'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header / Search */}
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Cari file..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor="#007AFF"
                    placeholderTextColor="#8E8E93"
                />
            </View>

            {/* Filter Chips */}
            {uniqueFormats.length > 0 && (
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        onPress={() => setSelectedFilter(null)}
                        style={[
                            styles.filterChip,
                            selectedFilter === null && styles.filterChipSelected,
                        ]}
                    >
                        <Text style={[
                            styles.filterChipText,
                            selectedFilter === null && styles.filterChipTextSelected,
                        ]}>Semua</Text>
                    </TouchableOpacity>
                    {uniqueFormats.map((format) => (
                        <TouchableOpacity
                            key={format}
                            onPress={() => setSelectedFilter(selectedFilter === format ? null : format)}
                            style={[
                                styles.filterChip,
                                selectedFilter === format && styles.filterChipSelected,
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                selectedFilter === format && styles.filterChipTextSelected,
                            ]}>{format.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Stats & Clear */}
            <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                    📊 {filteredHistory.length} items
                </Text>
                {history.length > 0 && (
                    <TouchableOpacity onPress={handleClearAll} style={styles.clearFilterBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                        <Text style={[styles.clearFilterText, { color: '#FF3B30' }]}>Bersihkan</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            <FlatList
                data={filteredHistory}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

// Keep styles below...

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7', // iOS System Gray 6
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
    },
    loadingText: {
        color: '#8E8E93',
        marginTop: 12,
    },

    // Search
    searchContainer: {
        padding: 16,
        paddingBottom: 8,
    },
    searchBar: {
        backgroundColor: '#ffffff',
        borderRadius: 14,

        ...Platform.select({
            ios: {
                // shadowColor, shadowOffset, shadowOpacity, shadowRadius are deprecated on web,
                // and for shared styles should be moved to boxShadow or used platform-specifically.
            },
            android: {
                elevation: 2,
            },
            web: {
                // @ts-ignore
                boxShadow: '0px 1px 4px rgba(0,0,0,0.05)',
            }
        }),
    },
    searchInput: {
        color: '#000000',
    },

    // Filter
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 12,
    },
    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        borderWidth: 1,

        borderColor: '#E5E5EA',
        ...Platform.select({
            ios: {
                // shadowColor, shadowOffset, shadowOpacity, shadowRadius are deprecated
            },
            android: {
                elevation: 1,
            },
            web: {
                // @ts-ignore
                boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
            }
        }),
    },
    filterChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterChipText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '500',
    },
    filterChipTextSelected: {
        color: '#ffffff',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    statsText: {
        color: '#3A3A3C',
        fontSize: 14,
        fontWeight: '600',
    },
    clearFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    clearFilterText: {
        color: '#8E8E93',
        fontSize: 13,
    },

    // List
    listContent: {
        padding: 16,
        paddingTop: 4,
        flexGrow: 1,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        marginBottom: 12,

        ...Platform.select({
            ios: {
                // shadowColor, shadowOffset, shadowOpacity, shadowRadius are deprecated
            },
            android: {
                elevation: 2,
            },
            web: {
                // @ts-ignore
                boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
            }
        }),
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    formatBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
    },
    fileName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    formatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    formatText: {
        color: '#1C1C1E',
        fontWeight: '600',
        fontSize: 15,
    },
    arrowContainer: {
        marginHorizontal: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sizeText: {
        color: '#8E8E93',
        fontSize: 13,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#C7C7CC',
        marginHorizontal: 8,
    },
    dateText: {
        color: '#8E8E93',
        fontSize: 13,
    },
    separator: {
        height: 8, // Not used since marginBottom is set, but kept for compatibility
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        color: '#1C1C1E',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
});
