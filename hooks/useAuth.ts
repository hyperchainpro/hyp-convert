import { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Augmented User type to include role
type AugmentedUser = User & { role?: string };

interface AuthState {
    user: AugmentedUser | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
}

export const useAuth = () => {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            console.log('[useAuth] Getting initial session...');
            // Safety timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
                console.warn('[useAuth] Session check timed out, forcing load completion');
                setState(prev => {
                    if (!prev.loading) return prev;
                    return { ...prev, loading: false, error: 'Session check timeout' };
                });
            }, 5000); // 5 seconds timeout

            try {
                const { data: { session } } = await supabase.auth.getSession();
                clearTimeout(timeoutId);

                let role = 'user';
                if (session?.user) {
                    console.log('[useAuth] Session found, fetching profile...');
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();
                    if (profile?.role) role = profile.role;
                } else {
                    console.log('[useAuth] No active session found.');
                }

                setState(prev => ({
                    ...prev,
                    session,
                    user: session?.user ? { ...session.user, role } : null,
                    loading: false,
                }));
            } catch (error) {
                clearTimeout(timeoutId);
                console.error('[useAuth] Session check error:', error);
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Gagal memuat sesi',
                }));
            }
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                let role = 'user';
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();
                    if (profile?.role) role = profile.role;
                }

                setState(prev => ({
                    ...prev,
                    session,
                    user: session?.user ? { ...session.user, role } : null,
                    loading: false,
                }));
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        console.log('[useAuth] Signing in...');
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SignIn request timed out')), 15000)
            );

            // Actual sign in promise
            const signInPromise = async () => {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    console.error('[useAuth] SignIn Supabase Error:', error);
                    throw error;
                }
                return data;
            };

            const data = await Promise.race([signInPromise(), timeoutPromise]) as any;

            console.log('[useAuth] SignIn Success:', data.user?.id);

            setState(prev => ({
                ...prev,
                user: data.user,
                session: data.session,
                loading: false,
            }));

            return { success: true };
        } catch (error) {
            const rawMessage = error instanceof Error ? error.message : 'Gagal masuk';
            // Translate common Supabase error messages to Indonesian
            let message = rawMessage;
            if (rawMessage.toLowerCase().includes('email not confirmed')) {
                message = 'EMAIL_NOT_CONFIRMED';
            } else if (rawMessage.toLowerCase().includes('invalid login credentials')) {
                message = 'INVALID_CREDENTIALS';
            } else if (rawMessage.toLowerCase().includes('timed out')) {
                message = 'Koneksi timeout. Periksa jaringan Anda dan coba lagi.';
            }
            console.error('[useAuth] SignIn Exception:', rawMessage);
            setState(prev => ({ ...prev, loading: false, error: message }));
            return { success: false, error: message };
        }
    }, []);

    const signUp = useCallback(async (
        email: string,
        password: string,
        username: string
    ) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        console.log('[useAuth] signUp called for:', email);

        // Validate email domain
        const validDomains = ['@gmail.com', '@hotmail.com', '@hypconvert.com'];
        const hasValidDomain = validDomains.some(domain =>
            email.toLowerCase().endsWith(domain)
        );

        if (!hasValidDomain) {
            const errorMsg = 'Hanya email @gmail.com, @hotmail.com, dan @hypconvert.com yang diperbolehkan';
            setState(prev => ({ ...prev, loading: false, error: errorMsg }));
            return { success: false, error: errorMsg };
        }

        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SignUp request timed out')), 15000)
            );

            // Execute actual signup
            const signUpPromise = async () => {
                console.log('[useAuth] Invoking supabase.auth.signUp...');
                // Determine redirect URL for email confirmation
                const redirectTo = typeof window !== 'undefined'
                    ? `${window.location.origin}/auth/confirm`
                    : 'https://hyp-convert-psi.vercel.app/auth/confirm';

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username },
                        emailRedirectTo: redirectTo,
                    },
                });

                if (error) throw error;
                console.log('[useAuth] Supabase signUp success UserID:', data.user?.id);

                // Create profile
                if (data.user) {
                    console.log('[useAuth] Creating profile...');
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert({ id: data.user.id, username });

                    if (profileError) {
                        console.error('[useAuth] Profile creation failed (ignoring for auth success):', profileError);
                        // Optional: don't throw here if we want to allow login even if profile fails initially
                        // But usually we want it consistent. For now, let's log and proceed.
                    } else {
                        console.log('[useAuth] Profile created.');
                    }
                }
                return data;
            };

            // Race them
            const data = await Promise.race([signUpPromise(), timeoutPromise]) as any;

            setState(prev => ({
                ...prev,
                user: data.user,
                session: data.session,
                loading: false,
            }));

            return { success: true, session: data.session };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal mendaftar';
            console.error('[useAuth] SignUp Exception:', message);
            setState(prev => ({ ...prev, loading: false, error: message }));
            return { success: false, error: message };
        }
    }, []);

    const signOut = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            setState({
                user: null,
                session: null,
                loading: false,
                error: null,
            });

            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal keluar';
            setState(prev => ({ ...prev, loading: false, error: message }));
            return { success: false, error: message };
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setState(prev => ({ ...prev, loading: false }));
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal mengirim email reset';
            setState(prev => ({ ...prev, loading: false, error: message }));
            return { success: false, error: message };
        }
    }, []);

    const directResetPassword = useCallback(async (
        email: string,
        username: string,
        newPassword: string
    ) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Step 1: Verify username exists in profiles table
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, username')
                .eq('username', username)
                .limit(1);

            if (profileError) throw new Error('Gagal memverifikasi akun');

            if (!profiles || profiles.length === 0) {
                throw new Error('Username tidak ditemukan');
            }

            // Step 2: Call Supabase RPC function to reset password server-side
            const { data: rpcResult, error: rpcError } = await supabase
                .rpc('reset_user_password', {
                    user_email: email,
                    user_username: username,
                    new_password: newPassword
                });

            if (rpcError) {
                if (rpcError.message?.includes('tidak ditemukan') || rpcError.message?.includes('not found')) {
                    throw new Error('Email dan username tidak cocok');
                }
                throw new Error(rpcError.message || 'Gagal mereset password');
            }

            setState(prev => ({ ...prev, loading: false }));
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal mereset password';
            console.error('[useAuth] directResetPassword Exception:', message);
            setState(prev => ({ ...prev, loading: false, error: message }));
            return { success: false, error: message };
        }
    }, []);

    const updatePassword = useCallback(async (newPassword: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            setState(prev => ({ ...prev, loading: false }));
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal mengubah password';
            setState(prev => ({ ...prev, loading: false, error: message }));
            return { success: false, error: message };
        }
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        user: state.user,
        session: state.session,
        loading: state.loading,
        error: state.error,
        isAuthenticated: !!state.session,
        signIn,
        signUp,
        signOut,
        resetPassword,
        directResetPassword,
        updatePassword,
        clearError,
    };
};

export default useAuth;
