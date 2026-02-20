/**
 * Document Store Hook
 * Provides persistent storage for scanned documents using AsyncStorage
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { ColorMode, ManualAdjustments, DEFAULT_ADJUSTMENTS } from '@/lib/imageFilters';

// =====================================================
// TYPES
// =====================================================

export interface ScannedPage {
    id: string;
    originalUri: string;
    editedUri: string;
    colorMode: ColorMode;
    adjustments: ManualAdjustments;
    rotation: number;
    ocrText?: string;
    createdAt: number;
}

export interface Document {
    id: string;
    name: string;
    pages: ScannedPage[];
    tags: string[];
    folderId?: string;
    createdAt: number;
    updatedAt: number;
    isSecure: boolean;
    favorite: boolean;
    thumbnailUri?: string;
}

export interface Folder {
    id: string;
    name: string;
    color: string;
    parentId?: string;
    createdAt: number;
    isSecure?: boolean;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
}

// =====================================================
// STORAGE KEYS
// =====================================================

const STORAGE_KEYS = {
    DOCUMENTS: 'hyp_documents',
    FOLDERS: 'hyp_folders',
    TAGS: 'hyp_tags',
    SETTINGS: 'hyp_scanner_settings',
};

// =====================================================
// HOOK
// =====================================================

export interface DocumentStoreState {
    documents: Document[];
    folders: Folder[];
    tags: Tag[];
    isLoading: boolean;
    error: string | null;
}

export function useDocumentStore() {
    const [state, setState] = useState<DocumentStoreState>({
        documents: [],
        folders: [],
        tags: [],
        isLoading: true,
        error: null,
    });

    // Load data on mount
    useEffect(() => {
        loadAllData();
    }, []);

    // =====================================================
    // LOAD DATA
    // =====================================================

    const loadAllData = async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const [documentsJson, foldersJson, tagsJson] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS),
                AsyncStorage.getItem(STORAGE_KEYS.FOLDERS),
                AsyncStorage.getItem(STORAGE_KEYS.TAGS),
            ]);

            setState({
                documents: documentsJson ? JSON.parse(documentsJson) : [],
                folders: foldersJson ? JSON.parse(foldersJson) : getDefaultFolders(),
                tags: tagsJson ? JSON.parse(tagsJson) : getDefaultTags(),
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error('Error loading document store:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Gagal memuat dokumen',
            }));
        }
    };

    // =====================================================
    // DOCUMENT OPERATIONS
    // =====================================================

    const createDocument = useCallback(async (
        pages: ScannedPage[],
        name?: string,
        folderId?: string,
        tags: string[] = []
    ): Promise<Document> => {
        const now = Date.now();
        const document: Document = {
            id: `doc-${now}`,
            name: name || `Scan ${new Date().toLocaleDateString('id-ID')}`,
            pages,
            tags,
            folderId,
            createdAt: now,
            updatedAt: now,
            isSecure: false,
            favorite: false,
            thumbnailUri: pages[0]?.editedUri,
        };

        const newDocuments = [...state.documents, document];
        await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(newDocuments));
        setState(prev => ({ ...prev, documents: newDocuments }));

        return document;
    }, [state.documents]);

    const updateDocument = useCallback(async (
        documentId: string,
        updates: Partial<Omit<Document, 'id' | 'createdAt'>>
    ): Promise<Document | null> => {
        const index = state.documents.findIndex(d => d.id === documentId);
        if (index === -1) return null;

        const updatedDoc: Document = {
            ...state.documents[index],
            ...updates,
            updatedAt: Date.now(),
        };

        const newDocuments = [...state.documents];
        newDocuments[index] = updatedDoc;

        await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(newDocuments));
        setState(prev => ({ ...prev, documents: newDocuments }));

        return updatedDoc;
    }, [state.documents]);

    const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
        const newDocuments = state.documents.filter(d => d.id !== documentId);
        await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(newDocuments));
        setState(prev => ({ ...prev, documents: newDocuments }));
        return true;
    }, [state.documents]);

    const getDocument = useCallback((documentId: string): Document | undefined => {
        return state.documents.find(d => d.id === documentId);
    }, [state.documents]);

    const searchDocuments = useCallback((query: string): Document[] => {
        const lowerQuery = query.toLowerCase();
        return state.documents.filter(doc => {
            // Search in name
            if (doc.name.toLowerCase().includes(lowerQuery)) return true;

            // Search in OCR text
            for (const page of doc.pages) {
                if (page.ocrText?.toLowerCase().includes(lowerQuery)) return true;
            }

            // Search in tags
            for (const tagId of doc.tags) {
                const tag = state.tags.find(t => t.id === tagId);
                if (tag?.name.toLowerCase().includes(lowerQuery)) return true;
            }

            return false;
        });
    }, [state.documents, state.tags]);

    const toggleFavorite = useCallback(async (documentId: string): Promise<Document | null> => {
        const doc = state.documents.find(d => d.id === documentId);
        if (!doc) return null;
        return updateDocument(documentId, { favorite: !doc.favorite });
    }, [state.documents, updateDocument]);

    const moveDocumentToFolder = useCallback(async (documentId: string, folderId: string | null): Promise<Document | null> => {
        return updateDocument(documentId, { folderId: folderId || undefined });
    }, [updateDocument]);

    const toggleSecureDocument = useCallback(async (documentId: string): Promise<Document | null> => {
        const doc = state.documents.find(d => d.id === documentId);
        if (!doc) return null;
        return updateDocument(documentId, { isSecure: !doc.isSecure });
    }, [state.documents, updateDocument]);

    // =====================================================
    // PAGE OPERATIONS
    // =====================================================

    const addPagesToDocument = useCallback(async (
        documentId: string,
        newPages: ScannedPage[]
    ): Promise<Document | null> => {
        const doc = state.documents.find(d => d.id === documentId);
        if (!doc) return null;

        return updateDocument(documentId, {
            pages: [...doc.pages, ...newPages],
        });
    }, [state.documents, updateDocument]);

    const updatePage = useCallback(async (
        documentId: string,
        pageId: string,
        updates: Partial<ScannedPage>
    ): Promise<Document | null> => {
        const doc = state.documents.find(d => d.id === documentId);
        if (!doc) return null;

        const pageIndex = doc.pages.findIndex(p => p.id === pageId);
        if (pageIndex === -1) return null;

        const newPages = [...doc.pages];
        newPages[pageIndex] = { ...newPages[pageIndex], ...updates };

        return updateDocument(documentId, { pages: newPages });
    }, [state.documents, updateDocument]);

    const deletePage = useCallback(async (
        documentId: string,
        pageId: string
    ): Promise<Document | null> => {
        const doc = state.documents.find(d => d.id === documentId);
        if (!doc) return null;

        const newPages = doc.pages.filter(p => p.id !== pageId);

        // If no pages left, delete the document
        if (newPages.length === 0) {
            await deleteDocument(documentId);
            return null;
        }

        return updateDocument(documentId, {
            pages: newPages,
            thumbnailUri: newPages[0]?.editedUri,
        });
    }, [state.documents, updateDocument, deleteDocument]);

    const reorderPages = useCallback(async (
        documentId: string,
        fromIndex: number,
        toIndex: number
    ): Promise<Document | null> => {
        const doc = state.documents.find(d => d.id === documentId);
        if (!doc) return null;

        const newPages = [...doc.pages];
        const [movedPage] = newPages.splice(fromIndex, 1);
        newPages.splice(toIndex, 0, movedPage);

        return updateDocument(documentId, {
            pages: newPages,
            thumbnailUri: newPages[0]?.editedUri,
        });
    }, [state.documents, updateDocument]);

    // =====================================================
    // FOLDER OPERATIONS
    // =====================================================

    const createFolder = useCallback(async (
        name: string,
        color: string = '#007AFF',
        parentId?: string
    ): Promise<Folder> => {
        const folder: Folder = {
            id: `folder-${Date.now()}`,
            name,
            color,
            parentId,
            createdAt: Date.now(),
        };

        const newFolders = [...state.folders, folder];
        await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(newFolders));
        setState(prev => ({ ...prev, folders: newFolders }));

        return folder;
    }, [state.folders]);

    const deleteFolder = useCallback(async (folderId: string): Promise<boolean> => {
        const newFolders = state.folders.filter(f => f.id !== folderId);
        await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(newFolders));
        setState(prev => ({ ...prev, folders: newFolders }));

        // Move documents from deleted folder to root
        const docsToUpdate = state.documents.filter(d => d.folderId === folderId);
        for (const doc of docsToUpdate) {
            await updateDocument(doc.id, { folderId: undefined });
        }

        return true;
    }, [state.folders, state.documents, updateDocument]);

    const toggleSecureFolder = useCallback(async (folderId: string): Promise<Folder | null> => {
        const folder = state.folders.find(f => f.id === folderId);
        if (!folder) return null;

        const updatedFolder = { ...folder, isSecure: !folder.isSecure };
        const newFolders = state.folders.map(f => f.id === folderId ? updatedFolder : f);

        await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(newFolders));
        setState(prev => ({ ...prev, folders: newFolders }));

        return updatedFolder;
    }, [state.folders]);

    const getDocumentsInFolder = useCallback((folderId?: string): Document[] => {
        return state.documents.filter(d => d.folderId === folderId);
    }, [state.documents]);

    // =====================================================
    // TAG OPERATIONS
    // =====================================================

    const createTag = useCallback(async (
        name: string,
        color: string = '#30D158'
    ): Promise<Tag> => {
        const tag: Tag = {
            id: `tag-${Date.now()}`,
            name,
            color,
        };

        const newTags = [...state.tags, tag];
        await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(newTags));
        setState(prev => ({ ...prev, tags: newTags }));

        return tag;
    }, [state.tags]);

    const deleteTag = useCallback(async (tagId: string): Promise<boolean> => {
        const newTags = state.tags.filter(t => t.id !== tagId);
        await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(newTags));
        setState(prev => ({ ...prev, tags: newTags }));

        // Remove tag from all documents
        for (const doc of state.documents) {
            if (doc.tags.includes(tagId)) {
                await updateDocument(doc.id, {
                    tags: doc.tags.filter(t => t !== tagId),
                });
            }
        }

        return true;
    }, [state.tags, state.documents, updateDocument]);

    const addTagToDocument = useCallback(async (
        documentId: string,
        tagId: string
    ): Promise<Document | null> => {
        const doc = state.documents.find(d => d.id === documentId);
        if (!doc || doc.tags.includes(tagId)) return null;

        return updateDocument(documentId, {
            tags: [...doc.tags, tagId],
        });
    }, [state.documents, updateDocument]);

    const removeTagFromDocument = useCallback(async (
        documentId: string,
        tagId: string
    ): Promise<Document | null> => {
        const doc = state.documents.find(d => d.id === documentId);
        if (!doc) return null;

        return updateDocument(documentId, {
            tags: doc.tags.filter(t => t !== tagId),
        });
    }, [state.documents, updateDocument]);

    // =====================================================
    // UTILITIES
    // =====================================================

    const getDocumentStats = useCallback(() => {
        return {
            totalDocuments: state.documents.length,
            totalPages: state.documents.reduce((sum, doc) => sum + doc.pages.length, 0),
            totalFolders: state.folders.length,
            totalTags: state.tags.length,
        };
    }, [state]);

    const exportDocument = useCallback(async (documentId: string): Promise<string | null> => {
        const doc = state.documents.find(d => d.id === documentId);
        if (!doc) return null;

        // Return JSON for backup purposes
        return JSON.stringify(doc, null, 2);
    }, [state.documents]);

    const importDocument = useCallback(async (jsonData: string): Promise<Document | null> => {
        try {
            const doc: Document = JSON.parse(jsonData);
            doc.id = `doc-${Date.now()}`; // Generate new ID
            doc.createdAt = Date.now();
            doc.updatedAt = Date.now();

            const newDocuments = [...state.documents, doc];
            await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(newDocuments));
            setState(prev => ({ ...prev, documents: newDocuments }));

            return doc;
        } catch (error) {
            console.error('Error importing document:', error);
            return null;
        }
    }, [state.documents]);

    return {
        // State
        ...state,

        // Document operations
        createDocument,
        updateDocument,
        deleteDocument,
        getDocument,
        searchDocuments,
        toggleFavorite,
        moveDocumentToFolder,
        toggleSecureDocument,

        // Page operations
        addPagesToDocument,
        updatePage,
        deletePage,
        reorderPages,

        // Folder operations
        createFolder,
        deleteFolder,
        getDocumentsInFolder,
        toggleSecureFolder,

        // Tag operations
        createTag,
        deleteTag,
        addTagToDocument,
        removeTagFromDocument,

        // Utilities
        getDocumentStats,
        exportDocument,
        importDocument,
        refreshData: loadAllData,
    };
}

// =====================================================
// DEFAULT DATA
// =====================================================

function getDefaultFolders(): Folder[] {
    return [
        { id: 'folder-documents', name: 'Dokumen', color: '#007AFF', createdAt: Date.now() },
        { id: 'folder-receipts', name: 'Struk & Kwitansi', color: '#30D158', createdAt: Date.now() },
        { id: 'folder-photos', name: 'Foto', color: '#FF9500', createdAt: Date.now() },
        { id: 'folder-ids', name: 'Kartu Identitas', color: '#FF3B30', createdAt: Date.now() },
        { id: 'folder-secure', name: 'Folder Aman', color: '#8E8E93', createdAt: Date.now(), isSecure: true },
    ];
}

function getDefaultTags(): Tag[] {
    return [
        { id: 'tag-important', name: 'Penting', color: '#FF3B30' },
        { id: 'tag-work', name: 'Pekerjaan', color: '#007AFF' },
        { id: 'tag-personal', name: 'Pribadi', color: '#30D158' },
        { id: 'tag-finance', name: 'Keuangan', color: '#FF9500' },
    ];
}

// =====================================================
// HELPER: Create ScannedPage from picked image
// =====================================================

export function createScannedPage(imageUri: string): ScannedPage {
    return {
        id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        originalUri: imageUri,
        editedUri: imageUri,
        colorMode: 'original',
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        rotation: 0,
        createdAt: Date.now(),
    };
}

export default useDocumentStore;
