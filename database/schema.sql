-- =====================================================
-- HYP TOKEN & REFERRAL SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_ip TEXT,
  
  -- Prevent multiple profiles for one user
  CONSTRAINT profiles_id_key UNIQUE(id)
);

-- Turn on RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. UPDATE TABEL PROFILES
-- Tambah kolom untuk token dan referral
-- =====================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hyp_tokens INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(8) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Index untuk referral code lookup
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- =====================================================
-- 2. TABEL TOKEN_TRANSACTIONS (Riwayat Transaksi Token)
-- =====================================================

CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own transactions" ON token_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON token_transactions;

-- Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON token_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON token_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);

-- =====================================================
-- 3. TABEL REFERRALS (Tracking Referral)
-- =====================================================

CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    referrer_bonus INTEGER DEFAULT 50,
    referred_bonus INTEGER DEFAULT 25,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;

-- Policy: Users can see referrals where they are referrer or referred
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals" ON referrals
    FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- =====================================================
-- 4. UPDATE TABEL CONVERSIONS (pastikan struktur benar)
-- =====================================================

CREATE TABLE IF NOT EXISTS conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    original_format VARCHAR(20) NOT NULL,
    target_format VARCHAR(20) NOT NULL,
    original_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own conversions" ON conversions;
DROP POLICY IF EXISTS "Users can insert own conversions" ON conversions;

-- Policies
CREATE POLICY "Users can view own conversions" ON conversions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversions" ON conversions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);

-- =====================================================
-- 5. UPDATE TABEL PROFILES untuk RLS (jika belum)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view any profile for referral" ON profiles;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to lookup referral codes (limited columns)
CREATE POLICY "Users can view any profile for referral" ON profiles
    FOR SELECT USING (true);

-- =====================================================
-- 6. ADMIN & ADS SYSTEM
-- =====================================================

-- Add role to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- =====================================================
-- CARA MEMBUAT ADMIN:
-- 1. Daftar user baru di aplikasi (misal: admin@gmail.com)
-- 2. Jalankan perintah SQL ini di Supabase Editor:
--    UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@gmail.com');
-- =====================================================

-- APP SETTINGS (Maintenance Mode)
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT DEFAULT 'System is under maintenance.'
);

-- Insert default settings row if empty
INSERT INTO app_settings (id, maintenance_mode, maintenance_message)
VALUES (1, false, 'System is under maintenance.')
ON CONFLICT (id) DO NOTHING;

-- AD CONFIGURATIONS
CREATE TABLE IF NOT EXISTS ad_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_type VARCHAR(20) NOT NULL, -- 'native', 'interstitial', 'popup'
    script_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default ad placeholders
INSERT INTO ad_configs (ad_type, script_content, is_active)
VALUES 
    ('native', '<h2>Sponsored Ad</h2><p>This is a native ad placeholder.</p>', true),
    ('interstitial', '<h1>Interstitial Ad</h1><p>Full screen ad content.</p>', true),
    ('popup', '<h3>Popup Ad</h3><p>Welcome to our app!</p>', true)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_configs ENABLE ROW LEVEL SECURITY;

-- Policies for App Settings
-- Everyone can read stats
CREATE POLICY "Everyone can read app settings" ON app_settings FOR SELECT USING (true);
-- Only admin can update (This requires a trigger or check, but for now we'll allow auth users with specific ID or just open for this demo context if role check is hard in SQL directly without custom claims. 
-- Ideally: USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
CREATE POLICY "Admins can update app settings" ON app_settings 
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Policies for Ad Configs
CREATE POLICY "Everyone can read ads" ON ad_configs FOR SELECT USING (true);
CREATE POLICY "Admins can manage ads" ON ad_configs 
    FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- =====================================================
-- 7. PASSWORD RESET FUNCTION (tanpa verifikasi email)
-- =====================================================
-- Fungsi ini memverifikasi email + username cocok,
-- lalu langsung mengubah password user.
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION reset_user_password(
    user_email TEXT,
    user_username TEXT,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Step 1: Find user by email in auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = lower(user_email);

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Email tidak ditemukan';
    END IF;

    -- Step 2: Verify username matches in profiles
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = target_user_id
        AND username = user_username
    ) THEN
        RAISE EXCEPTION 'Email dan username tidak cocok';
    END IF;

    -- Step 3: Update password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = target_user_id;

    RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION reset_user_password TO anon;
GRANT EXECUTE ON FUNCTION reset_user_password TO authenticated;

-- =====================================================
-- SELESAI!
-- =====================================================
