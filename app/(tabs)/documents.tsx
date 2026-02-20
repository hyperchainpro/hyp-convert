/**
 * Documents Library Screen
 * Manages folders, documents, and organization
 */
import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    Platform
} from 'react-native';
import {
    Text,
    Surface,
    IconButton,
    Menu,
    FAB,
    Searchbar,
    Portal,
    Modal,
    Button,
    Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSecurity } from '@/hooks/useSecurity';
import { useDocumentStore, Document, Folder } from '@/hooks/useDocumentStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function DocumentsScreen() {
    const params = useLocalSearchParams();
    const {
        documents,
        folders,
        createFolder,
        deleteDocument,
        moveDocumentToFolder,
        toggleFavorite
    } = useDocumentStore();
    const { authenticate } = useSecurity();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [visibleMenuDocId, setVisibleMenuDocId] = useState<string | null>(null);
    const [isCreateFolderVisible, setCreateFolderVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Document categories based on file extension/format
    const CATEGORIES = [
        { id: 'image', label: 'Gambar', icon: 'image', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'] },
        { id: 'pdf', label: 'PDF', icon: 'file-pdf-box', extensions: ['pdf'] },
        { id: 'document', label: 'Dokumen', icon: 'file-document', extensions: ['doc', 'docx', 'txt', 'rtf', 'odt'] },
        { id: 'spreadsheet', label: 'Spreadsheet', icon: 'file-excel', extensions: ['xls', 'xlsx', 'csv'] },
        { id: 'scan', label: 'Scan', icon: 'scanner', extensions: ['scan'] },
    ];

    // Helper to determine document category
    const getDocumentCategory = (doc: Document): string => {
        // If it's a scanned document (from scanner), mark as scan
        if (doc.pages && doc.pages.length > 0) return 'scan';

        // Extract file extension from name
        const ext = doc.name.split('.').pop()?.toLowerCase() || '';

        for (const category of CATEGORIES) {
            if (category.extensions.includes(ext)) {
                return category.id;
            }
        }
        return 'document'; // default
    };

    // Filter documents
    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());

            // Security Filter: Hide secure docs unless we are explicitly viewing the secure folder
            if (doc.isSecure) {
                if (!selectedFolderId) return false;
                const folder = folders.find(f => f.id === selectedFolderId);
                if (!folder?.isSecure) return false;
            }

            const matchesFolder = selectedFolderId ? doc.folderId === selectedFolderId : true;
            const matchesCategory = selectedCategory ? getDocumentCategory(doc) === selectedCategory : true;

            return matchesSearch && matchesFolder && matchesCategory;
        }).sort((a, b) => b.createdAt - a.createdAt);
    }, [documents, searchQuery, selectedFolderId, selectedCategory, folders]);

    const activeFolder = folders.find(f => f.id === selectedFolderId);

    const handleFolderSelect = async (folderId: string | null) => {
        if (folderId === null) {
            setSelectedFolderId(null);
            return;
        }

        const folder = folders.find(f => f.id === folderId);
        if (folder?.isSecure) {
            const success = await authenticate();
            if (success) {
                setSelectedFolderId(folderId);
            }
        } else {
            setSelectedFolderId(folderId);
        }
    };

    // ... existing handlers ...

    // Update Chips to use new handler
    // ...


    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            createFolder(newFolderName.trim());
            setNewFolderName('');
            setCreateFolderVisible(false);
        }
    };

    const handleDeleteDoc = async (doc: Document) => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm(`Yakin ingin menghapus ${doc.name}?`);
            if (confirm) {
                await deleteDocument(doc.id);
            }
        } else {
            Alert.alert(
                'Hapus Dokumen',
                `Yakin ingin menghapus ${doc.name}?`,
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Hapus',
                        style: 'destructive',
                        onPress: async () => {
                            await deleteDocument(doc.id);
                        }
                    },
                ]
            );
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const openMenu = (docId: string) => setVisibleMenuDocId(docId);
    const closeMenu = () => setVisibleMenuDocId(null);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text variant="headlineMedium" style={styles.title}>
                        {activeFolder ? activeFolder.name : 'Dokumen Saya'}
                    </Text>
                    <View style={styles.headerActions}>
                        <IconButton
                            icon={viewMode === 'grid' ? "view-list" : "view-grid"}
                            iconColor="#007AFF"
                            size={24}
                            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        />
                        <IconButton
                            icon="folder-plus"
                            iconColor="#007AFF"
                            size={24}
                            onPress={() => setCreateFolderVisible(true)}
                        />
                    </View>
                </View>

                {/* Search Bar */}
                <Searchbar
                    placeholder="Cari dokumen..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor="#8E8E93"
                    placeholderTextColor="#8E8E93"
                />

                {/* Filter Button */}
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <MaterialCommunityIcons name="filter-variant" size={20} color="#007AFF" />
                    <Text style={styles.filterButtonText}>
                        {selectedFolderId || selectedCategory ? 'Filter Aktif' : 'Filter'}
                    </Text>
                    {(selectedFolderId || selectedCategory) && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>
                                {(selectedFolderId ? 1 : 0) + (selectedCategory ? 1 : 0)}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Documents List */}
                {filteredDocs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="file-search-outline" size={64} color="#3A3A3C" />
                        <Text style={styles.emptyText}>Tidak ada dokumen ditemukan</Text>
                    </View>
                ) : (
                    <View style={viewMode === 'grid' ? styles.grid : styles.list}>
                        {filteredDocs.map(doc => (
                            <View
                                key={doc.id}
                                style={viewMode === 'grid' ? styles.gridItem : styles.listItem}
                            >
                                <TouchableOpacity
                                    style={{ flex: 1, flexDirection: viewMode === 'list' ? 'row' : 'column', alignItems: viewMode === 'list' ? 'center' : undefined }}
                                    onPress={() => {
                                        // Navigate to viewer/editor
                                        // For now just back to scanner with this doc loaded?
                                        // Or maybe a detail modal?
                                        // Ideally: router.push(`/documents/${doc.id}`)
                                        console.log('Open doc', doc.id);
                                    }}
                                    onLongPress={() => handleDeleteDoc(doc)}
                                >
                                    <View style={viewMode === 'grid' ? styles.gridThumb : styles.listThumb}>
                                        {doc.pages.length > 0 ? (
                                            <Image
                                                source={{ uri: doc.pages[0].editedUri }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                <MaterialCommunityIcons name="file-document" size={viewMode === 'grid' ? 40 : 24} color="#8E8E93" />
                                            </View>
                                        )}
                                        {doc.favorite && (
                                            <View style={styles.favBadge}>
                                                <MaterialCommunityIcons name="star" size={12} color="#FFD60A" />
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.docInfo}>
                                        <Text numberOfLines={1} style={styles.docName}>{doc.name}</Text>
                                        <View style={styles.docMeta}>
                                            <Text style={styles.docDate}>{formatDate(doc.createdAt)}</Text>
                                            <Text style={styles.docPages}>{doc.pages.length} Hal</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {/* Visible Actions Menu */}
                                <View style={viewMode === 'grid' ? styles.gridAction : styles.listAction}>
                                    <Menu
                                        visible={visibleMenuDocId === doc.id}
                                        onDismiss={closeMenu}
                                        anchor={
                                            <IconButton
                                                icon="dots-vertical"
                                                size={20}
                                                iconColor="#8E8E93"
                                                onPress={() => openMenu(doc.id)}
                                            />
                                        }
                                    >
                                        <Menu.Item
                                            onPress={() => { closeMenu(); handleDeleteDoc(doc); }}
                                            title="Hapus"
                                            leadingIcon="delete"
                                            titleStyle={{ color: '#FF3B30' }}
                                        />
                                    </Menu>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <FAB
                icon="plus"
                style={styles.fab}
                color="#fff"
                onPress={() => router.push('/(tabs)/scanner')}
                label="Scan Baru"
            />

            {/* Create Folder Modal */}
            <Portal>
                <Modal
                    visible={isCreateFolderVisible}
                    onDismiss={() => setCreateFolderVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text style={styles.modalTitle}>Buat Folder Baru</Text>
                    <TextInput
                        value={newFolderName}
                        onChangeText={setNewFolderName}
                        placeholder="Nama Folder"
                        placeholderTextColor="#8E8E93"
                        style={styles.input}
                        autoFocus
                    />
                    <View style={styles.modalActions}>
                        <Button onPress={() => setCreateFolderVisible(false)} textColor="#FF453A">Batal</Button>
                        <Button onPress={handleCreateFolder} textColor="#007AFF">Buat</Button>
                    </View>
                </Modal>

                {/* Filter Modal - Bottom Sheet Style */}
                <Modal
                    visible={filterModalVisible}
                    onDismiss={() => setFilterModalVisible(false)}
                    contentContainerStyle={styles.filterModal}
                >
                    <View style={styles.filterHeader}>
                        <Text style={styles.filterTitle}>Filter Dokumen</Text>
                        <TouchableOpacity onPress={() => {
                            setSelectedFolderId(null);
                            setSelectedCategory(null);
                        }}>
                            <Text style={styles.resetText}>Reset</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.filterContent}>
                        {/* Folder Section */}
                        <Text style={styles.filterSectionTitle}>Folder</Text>
                        <TouchableOpacity
                            style={[styles.filterItem, !selectedFolderId && styles.filterItemActive]}
                            onPress={() => handleFolderSelect(null)}
                        >
                            <MaterialCommunityIcons name="folder-multiple" size={20} color={!selectedFolderId ? "#007AFF" : "#8E8E93"} />
                            <Text style={[styles.filterItemText, !selectedFolderId && styles.filterItemTextActive]}>Semua Folder</Text>
                            {!selectedFolderId && <MaterialCommunityIcons name="check" size={20} color="#007AFF" />}
                        </TouchableOpacity>
                        {folders.map(folder => (
                            <TouchableOpacity
                                key={folder.id}
                                style={[styles.filterItem, selectedFolderId === folder.id && styles.filterItemActive]}
                                onPress={() => handleFolderSelect(folder.id)}
                            >
                                <MaterialCommunityIcons
                                    name={folder.isSecure ? "shield-lock" : "folder"}
                                    size={20}
                                    color={selectedFolderId === folder.id ? "#007AFF" : folder.color}
                                />
                                <Text style={[styles.filterItemText, selectedFolderId === folder.id && styles.filterItemTextActive]}>{folder.name}</Text>
                                {selectedFolderId === folder.id && <MaterialCommunityIcons name="check" size={20} color="#007AFF" />}
                            </TouchableOpacity>
                        ))}

                        {/* Category Section */}
                        <Text style={[styles.filterSectionTitle, { marginTop: 24 }]}>Kategori Dokumen</Text>
                        <TouchableOpacity
                            style={[styles.filterItem, !selectedCategory && styles.filterItemActive]}
                            onPress={() => setSelectedCategory(null)}
                        >
                            <MaterialCommunityIcons name="file-multiple" size={20} color={!selectedCategory ? "#34C759" : "#8E8E93"} />
                            <Text style={[styles.filterItemText, !selectedCategory && styles.filterItemTextActive]}>Semua Tipe</Text>
                            {!selectedCategory && <MaterialCommunityIcons name="check" size={20} color="#34C759" />}
                        </TouchableOpacity>
                        {CATEGORIES.map(category => (
                            <TouchableOpacity
                                key={category.id}
                                style={[styles.filterItem, selectedCategory === category.id && styles.filterItemActive]}
                                onPress={() => setSelectedCategory(category.id)}
                            >
                                <MaterialCommunityIcons
                                    name={category.icon as any}
                                    size={20}
                                    color={selectedCategory === category.id ? "#34C759" : "#8E8E93"}
                                />
                                <Text style={[styles.filterItemText, selectedCategory === category.id && styles.filterItemTextActive]}>{category.label}</Text>
                                {selectedCategory === category.id && <MaterialCommunityIcons name="check" size={20} color="#34C759" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.filterFooter}>
                        <Button
                            mode="contained"
                            onPress={() => setFilterModalVisible(false)}
                            buttonColor="#007AFF"
                            style={{ flex: 1 }}
                        >
                            Terapkan Filter
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: '#000',
        fontWeight: '700',
    },
    headerActions: {
        flexDirection: 'row',
    },
    searchBar: {
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        height: 48,
        marginBottom: 16,
        elevation: 0,
    },
    searchInput: {
        color: '#000',
        fontSize: 16,
    },
    folderScroll: {
        gap: 8,
    },
    folderChip: {
        backgroundColor: '#F2F2F7',
        borderColor: '#E5E5EA',
        borderWidth: 1,
    },
    categoryChip: {
        backgroundColor: '#F2F2F7',
        borderColor: '#34C759',
        borderWidth: 1,
        height: 32,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        marginTop: 12,
    },
    filterButtonText: {
        flex: 1,
        color: '#000',
        fontSize: 15,
        fontWeight: '600',
    },
    filterBadge: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    filterModal: {
        backgroundColor: '#FFFFFF',
        margin: 0,
        marginTop: 'auto',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    filterTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    resetText: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: '600',
    },
    filterContent: {
        padding: 20,
    },
    filterSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    filterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F2F2F7',
        marginBottom: 8,
        gap: 12,
    },
    filterItemActive: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    filterItemText: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    filterItemTextActive: {
        fontWeight: '600',
        color: '#007AFF',
    },
    filterFooter: {
        padding: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    content: {
        padding: 20,
        paddingBottom: 80,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    gridItem: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        elevation: 2,
    },
    gridThumb: {
        height: 140,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    list: {
        gap: 12,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        elevation: 1,
    },
    listThumb: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
        marginRight: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    docInfo: {
        flex: 1,
        padding: 12,
    },
    docName: {
        color: '#000',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    docMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    docDate: {
        color: '#8E8E93',
        fontSize: 12,
    },
    docPages: {
        color: '#8E8E93',
        fontSize: 12,
    },
    favBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 4,
        borderRadius: 10,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#8E8E93',
        marginTop: 16,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#007AFF',
    },
    modal: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        margin: 20,
        borderRadius: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#F2F2F7',
        color: '#000',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    listAction: {
        justifyContent: 'center',
    },
    gridAction: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
    }
});
