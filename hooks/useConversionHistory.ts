/**
 * Conversion History Hook
 * Manages persistent storage of conversion history using AsyncStorage
 * Replaces remote dependency for a robust local-first experience
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

// Storage Key
const HISTORY_STORAGE_KEY = 'hyp_conversion_history_local_v1';

// Shared Interface
export interface ConversionHistoryItem {
    id: string;
    original_format: string;
    target_format: string;
    original_size: number;
    converted_at: string; // ISO String
    file_uri?: string; // Optional local URI
    file_name: string;
    status: 'success' | 'failed';
}

export const useConversionHistory = () => {
    const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load History
    const loadHistory = useCallback(async () => {
        try {
            const json = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
            if (json) {
                const parsed = JSON.parse(json);
                setHistory(parsed);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create / Add Item
    const addToHistory = async (
        fileUri: string,
        fileName: string, // Original or New Name? Original usually.
        fromFormat: string,
        toFormat: string,
        size: number
    ) => {
        try {
            // Read latest
            const json = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
            const currentHistory = json ? JSON.parse(json) : [];

            const newItem: ConversionHistoryItem = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
                original_format: fromFormat,
                target_format: toFormat,
                original_size: size,
                converted_at: new Date().toISOString(),
                file_uri: fileUri,
                file_name: fileName,
                status: 'success'
            };

            const updatedHistory = [newItem, ...currentHistory];
            // Update state (if mounted)
            setHistory(updatedHistory);
            // Persist
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Failed to add to history:', error);
        }
    };

    // Remove Item
    const removeFromHistory = async (id: string) => {
        try {
            const updatedHistory = history.filter(item => item.id !== id);
            setHistory(updatedHistory);
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Failed to delete from history:', error);
        }
    };

    // Clear All
    const clearHistory = async () => {
        try {
            setHistory([]);
            await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    // Auto-reload on focus (navigation)
    // We export a refresh function, but useFocusEffect can be used in the component

    return {
        history,
        loading,
        addToHistory,
        removeFromHistory,
        clearHistory,
        refresh: loadHistory
    };
};
