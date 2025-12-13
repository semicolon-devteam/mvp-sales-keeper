-- 1. Ensure Columns Exist (Safe to run multiple times)
ALTER TABLE store_members ADD COLUMN IF NOT EXISTS hourly_wage INTEGER DEFAULT 9860;
ALTER TABLE store_members ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE store_members ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'teal';

-- 2. Reset & Fix Permissions (RLS)
-- Disabling RLS temporarily to ensure no block, then re-enabling with correct policies is cleaner, 
-- but let's just add a broad policy for Owners.

-- Drop potential conflicting policies (names must match exactly, so we try a few common guesses or generic names)
DROP POLICY IF EXISTS "Owners can update their store members" ON store_members;
DROP POLICY IF EXISTS "Allow owners to update members" ON store_members;

-- Create the DEFINITIVE policy for Update
CREATE POLICY "Owners can update their store members"
ON store_members
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id 
    from store_members as owners
    where owners.store_id = store_members.store_id 
    and owners.role = 'owner'
  )
);

-- Ensure Select is allowed (usually existing, but let's be safe)
DROP POLICY IF EXISTS "Members can view their store members" ON store_members;
CREATE POLICY "Members can view their store members"
ON store_members
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id 
    from store_members as members
    where members.store_id = store_members.store_id
  )
);
