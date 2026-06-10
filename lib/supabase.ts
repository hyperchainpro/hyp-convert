// =====================================================
// SUPABASE CLIENT - RUNTIME ONLY
// =====================================================

// This module is only safe to use in browser/native environments
// During static rendering/SSR in Node.js, all functions will be stubs

let supabaseInstance: any = null;
const isRuntimeEnv = () => {
    // Check if we're in a browser-like environment
    return typeof window !== 'undefined' || typeof navigator !== 'undefined';
};

const initSupabase = () => {
    if (!isRuntimeEnv()) return null;
    if (supabaseInstance) return supabaseInstance;

    try {
        const { createClient } = require('@supabase/supabase-js');
        const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
        const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Missing Supabase credentials');
            return null;
        }

        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const { Platform } = require('react-native');

            supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: Platform.OS === 'web',
                    lock: false as any,
                },
            });
        } catch (e) {
            // If react-native is not available, try basic config
            supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    lock: false as any,
                },
            });
        }
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return null;
    }
    
    return supabaseInstance;
};

// Stub object for non-runtime environments
const stubSupabase = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => ({ data: { user: null }, error: new Error('Not available during SSR') }),
        signInWithPassword: async () => ({ data: { user: null }, error: new Error('Not available during SSR') }),
        signOut: async () => ({ error: null }),
    },
    from: () => ({
        select: () => ({
            eq: () => ({ single: async () => ({ data: null, error: null }) }),
        }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
        delete: async () => ({ data: null, error: null }),
    }),
};

export const getSupabase = () => {
    return supabaseInstance || (isRuntimeEnv() ? initSupabase() : stubSupabase);
};

export const supabase = getSupabase();

// =====================================================
// TOKEN CONFIGURATION
// =====================================================

export const TOKEN_CONFIG = {
    SIGNUP_BONUS: 100,
    REFERRER_BONUS: 50,
    REFERRED_BONUS: 25,
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// =====================================================
// AUTH FUNCTIONS
// =====================================================

export const signUp = async (email: string, password: string, username: string, referralCode?: string) => {
    // Validate email domain
    const validDomains = ['@gmail.com', '@hotmail.com'];
    const hasValidDomain = validDomains.some(domain => email.toLowerCase().endsWith(domain));

    if (!hasValidDomain) {
        throw new Error('Hanya email @gmail.com dan @hotmail.com yang diperbolehkan');
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
            },
        },
    });

    if (error) throw error;

    // Create profile entry with tokens and referral code
    if (data.user) {
        const userReferralCode = generateReferralCode();
        let referredById: string | null = null;
        let totalBonus = TOKEN_CONFIG.SIGNUP_BONUS;

        // Check if referral code is valid
        if (referralCode) {
            const { data: referrerProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', referralCode.toUpperCase())
                .single();

            if (referrerProfile) {
                referredById = referrerProfile.id;
                totalBonus += TOKEN_CONFIG.REFERRED_BONUS;
            }
        }

        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: data.user.id,
                username,
                hyp_tokens: totalBonus,
                referral_code: userReferralCode,
                referred_by: referredById,
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
        } else {
            // Record signup bonus transaction
            await recordTokenTransaction(
                data.user.id,
                TOKEN_CONFIG.SIGNUP_BONUS,
                'signup_bonus',
                'Bonus pendaftaran akun baru'
            );

            // Process referral if exists
            if (referredById) {
                // Record referred bonus for new user
                await recordTokenTransaction(
                    data.user.id,
                    TOKEN_CONFIG.REFERRED_BONUS,
                    'referral_bonus',
                    'Bonus dari kode referral'
                );

                // Create referral record
                await supabase.from('referrals').insert({
                    referrer_id: referredById,
                    referred_id: data.user.id,
                    referrer_bonus: TOKEN_CONFIG.REFERRER_BONUS,
                    referred_bonus: TOKEN_CONFIG.REFERRED_BONUS,
                });

                // Give bonus to referrer
                await addTokensToUser(referredById, TOKEN_CONFIG.REFERRER_BONUS, 'referral_bonus', `Bonus referral dari ${username}`);
            }
        }
    }

    return data;
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
};

export const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    if (error) throw error;
    return data;
};

// =====================================================
// TOKEN MANAGEMENT FUNCTIONS
// =====================================================

const recordTokenTransaction = async (
    userId: string,
    amount: number,
    transactionType: string,
    description: string
) => {
    const { error } = await supabase.from('token_transactions').insert({
        user_id: userId,
        amount,
        transaction_type: transactionType,
        description,
    });

    if (error) {
        console.error('Error recording token transaction:', error);
    }
};

export const addTokensToUser = async (
    userId: string,
    amount: number,
    transactionType: string,
    description: string
) => {
    // Get current balance
    const { data: profile } = await supabase
        .from('profiles')
        .select('hyp_tokens')
        .eq('id', userId)
        .single();

    if (profile) {
        const newBalance = (profile.hyp_tokens || 0) + amount;

        // Update balance
        await supabase
            .from('profiles')
            .update({ hyp_tokens: newBalance })
            .eq('id', userId);

        // Record transaction
        await recordTokenTransaction(userId, amount, transactionType, description);
    }
};

// =====================================================
// TOKEN MANAGEMENT FUNCTIONS
// =====================================================

export const getTokenBalance = async (userId?: string): Promise<number> => {
    const id = userId || (await getCurrentUser())?.id;
    if (!id) return 0;

    const { data, error } = await supabase
        .from('profiles')
        .select('hyp_tokens')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error getting token balance:', error);
        return 0;
    }

    return data?.hyp_tokens || 0;
};

export const getTokenHistory = async (limit = 20, userId?: string) => {
    const id = userId || (await getCurrentUser())?.id;
    if (!id) return [];

    const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error getting token history:', error);
        return [];
    }

    return data || [];
};

// ... (useTokens remains unchanged as it performs action)

// =====================================================
// REFERRAL FUNCTIONS
// =====================================================

export const getReferralCode = async (userId?: string): Promise<string | null> => {
    const id = userId || (await getCurrentUser())?.id;
    if (!id) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error getting referral code:', error);
        return null;
    }

    return data?.referral_code || null;
};

export const getReferralStats = async (userId?: string) => {
    const id = userId || (await getCurrentUser())?.id;
    if (!id) return { totalReferrals: 0, totalBonus: 0, referrals: [] };

    try {
        const { data, error } = await supabase
            .from('referrals')
            .select(`
                id,
                referrer_bonus,
                created_at,
                referred:referred_id (
                    username
                )
            `)
            .eq('referrer_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Relational referral query failed, trying basic query...', error.message);
            // Basic fallback without inner join
            const { data: basicData, error: basicError } = await supabase
                .from('referrals')
                .select('id, referrer_bonus, created_at, referred_id')
                .eq('referrer_id', id)
                .order('created_at', { ascending: false });

            if (basicError) throw basicError;

            return {
                totalReferrals: basicData?.length || 0,
                totalBonus: basicData?.reduce((sum: number, item: any) => sum + (item.referrer_bonus || 0), 0) || 0,
                referrals: basicData || []
            };
        }

        const totalReferrals = data?.length || 0;
        const totalBonus = data?.reduce((sum: number, item: any) => sum + (item.referrer_bonus || 0), 0) || 0;

        return { totalReferrals, totalBonus, referrals: data || [] };
    } catch (e) {
        console.error('Final failure in getReferralStats:', e);
        return { totalReferrals: 0, totalBonus: 0, referrals: [] };
    }
};

// ...

// =====================================================
// CONVERSION HISTORY FUNCTIONS
// =====================================================

// ...

export const getConversionHistory = async (limit = 10, userId?: string) => {
    const id = userId || (await getCurrentUser())?.id;
    if (!id) return [];

    const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching conversion history:', error);
        return [];
    }
    return data || [];
};

// ...

// =====================================================
// PROFILE FUNCTIONS
// =====================================================

export const getProfile = async (userId?: string) => {
    const id = userId || (await getCurrentUser())?.id;
    if (!id) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error getting profile:', error);
        return null;
    }

    return data;
};

export const useTokens = async (amount: number, description: string): Promise<boolean> => {
    const user = await getCurrentUser();
    if (!user) return false;

    const currentBalance = await getTokenBalance();

    if (currentBalance < amount) {
        return false; // Insufficient balance
    }

    const newBalance = currentBalance - amount;

    const { error } = await supabase
        .from('profiles')
        .update({ hyp_tokens: newBalance })
        .eq('id', user.id);

    if (error) {
        console.error('Error using tokens:', error);
        return false;
    }

    await recordTokenTransaction(user.id, -amount, 'conversion_cost', description);
    return true;
};

// =====================================================
// REFERRAL FUNCTIONS
// =====================================================





export const validateReferralCode = async (code: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', code.toUpperCase())
        .single();

    if (error || !data) {
        return false;
    }

    return true;
};

// =====================================================
// CONVERSION HISTORY FUNCTIONS
// =====================================================

export const saveConversionHistory = async (
    originalFormat: string,
    targetFormat: string,
    originalSize: number
) => {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('conversions')
        .insert({
            user_id: user.id,
            original_format: originalFormat,
            target_format: targetFormat,
            original_size: originalSize,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving conversion history:', error);
        return null;
    }
    return data;
};



export const getConversionStats = async () => {
    const user = await getCurrentUser();
    if (!user) return { total: 0, totalSize: 0 };

    const { data, error } = await supabase
        .from('conversions')
        .select('original_size')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching conversion stats:', error);
        return { total: 0, totalSize: 0 };
    }

    const total = data?.length || 0;
    const totalSize = data?.reduce((sum, item) => sum + (item.original_size || 0), 0) || 0;

    return { total, totalSize };
};

export const deleteConversionHistory = async (conversionId: string): Promise<boolean> => {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
        .from('conversions')
        .delete()
        .eq('id', conversionId)
        .eq('user_id', user.id); // Ensure user can only delete their own records

    if (error) {
        console.error('Error deleting conversion history:', error);
        return false;
    }

    return true;
};

// =====================================================
// PROFILE FUNCTIONS
// =====================================================



export const updateProfile = async (updates: { username?: string }) => {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        return null;
    }

    return data;
};

