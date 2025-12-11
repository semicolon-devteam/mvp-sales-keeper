-- Fix Recursive RLS on store_members

-- 1. Create a secure function to check membership (Bypasses RLS recursion)
CREATE OR REPLACE FUNCTION is_member_of_store(_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM store_members
    WHERE store_id = _store_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view their store members" ON store_members;
DROP POLICY IF EXISTS "Owners can update their store members" ON store_members;
DROP POLICY IF EXISTS "Allow owners to update members" ON store_members;

-- 3. Create clean policies using the function

-- SELECT: Allow if I am the user OR if I am a member of the store
CREATE POLICY "View store members"
ON store_members
FOR SELECT
USING (
  auth.uid() = user_id -- Can always see my own
  OR
  is_member_of_store(store_id) -- Can see teammates if I am in the store
);

-- UPDATE: Allow if I am an OWNER of the store
CREATE POLICY "Update store members"
ON store_members
FOR UPDATE
USING (
  is_member_of_store(store_id) 
  AND 
  EXISTS (
    SELECT 1 FROM store_members 
    WHERE store_id = store_members.store_id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  )
);
-- Note: The exists subquery for owner check might still recurse if not careful, 
-- but since we filtered by is_member_of_store (Function) first, it might be safer,
-- OR we can make an `is_owner_of_store` function too. 
-- Let's make `is_owner_of_store` to be 100% safe.

CREATE OR REPLACE FUNCTION is_owner_of_store(_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM store_members
    WHERE store_id = _store_id
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY "Update store members" ON store_members;

CREATE POLICY "Update store members"
ON store_members
FOR UPDATE
USING (
  is_owner_of_store(store_id)
);

-- INSERT: Usually handled by invite system, but maybe needed?
-- For now, leave Insert restricted or existing policies.
