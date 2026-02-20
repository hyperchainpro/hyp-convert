-- =====================================================
-- FIX: ADD DELETE POLICY FOR CONVERSIONS
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor
-- This is required to allow users to delete their history items.

CREATE POLICY "Users can delete own conversions" ON conversions
    FOR DELETE USING (auth.uid() = user_id);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'conversions';
