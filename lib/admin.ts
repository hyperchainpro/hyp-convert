import { supabase } from './supabase';

// Types
export interface AppSettings {
    id?: number;
    maintenance_mode: boolean;
    maintenance_message: string;
}

export interface AdConfig {
    id: string;
    ad_type: 'native' | 'interstitial' | 'popup';
    script_content: string;
    android_ad_unit_id?: string;
    ios_ad_unit_id?: string;
    is_active: boolean;
}

export interface UserStat {
    id: string;
    username: string;
    email?: string; // Optional, may not always be available
    hyp_tokens: number;
    created_at: string;
}

// =====================================================
// SETTINGS
// =====================================================

export const getAppSettings = async (retries = 3): Promise<AppSettings> => {
    // In a real app, you'd fetch from 'app_settings' table
    // For now, we'll try to fetch, if error/empty return default
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .single();

        if (error) {
            if (retries > 0) {
                console.warn(`Fetch app_settings failed, retrying... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return getAppSettings(retries - 1);
            }
            // Return default if table doesn't exist yet or final failure
            return { maintenance_mode: false, maintenance_message: 'System is under maintenance.' };
        }
        return data || { maintenance_mode: false, maintenance_message: 'System is under maintenance.' };
    } catch (e) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getAppSettings(retries - 1);
        }
        return { maintenance_mode: false, maintenance_message: 'System is under maintenance.' };
    }
};

export const updateAppSettings = async (settings: Partial<AppSettings>) => {
    // Upsert logic
    const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 1, ...settings }); // Assuming single row with ID 1

    if (error) throw error;
};

// =====================================================
// ADS
// =====================================================

export const getAdConfigs = async (retries = 3): Promise<AdConfig[]> => {
    try {
        const { data, error } = await supabase
            .from('ad_configs')
            .select('*');

        if (error) {
            if (retries > 0) {
                console.warn(`Fetch ads failed, retrying... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return getAdConfigs(retries - 1);
            }
            console.error('Error fetching ads', error);
            return [];
        }
        return data || [];
    } catch (e) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getAdConfigs(retries - 1);
        }
        return [];
    }
};

export const updateAdConfig = async (id: string, updates: Partial<AdConfig>) => {
    const { error } = await supabase
        .from('ad_configs')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
};

export const createAdConfig = async (ad: Omit<AdConfig, 'id'>) => {
    const { error } = await supabase
        .from('ad_configs')
        .insert(ad);

    if (error) throw error;
};

// =====================================================
// USERS (Admin View)
// =====================================================

export const getAllUsers = async (): Promise<UserStat[]> => {
    try {
        // Main attempt with created_at
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, hyp_tokens, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            // Fallback attempt with all columns or updated_at
            console.warn('getAllUsers with created_at failed, trying fallback...', error.message);
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('profiles')
                .select('*')
                .limit(1000);

            if (fallbackError) throw fallbackError;
            return (fallbackData || []).map(u => ({
                ...u,
                created_at: u.created_at || u.updated_at || new Date().toISOString()
            })) as UserStat[];
        }
        return data || [];
    } catch (e) {
        console.error('Final failure in getAllUsers:', e);
        return [];
    }
};
