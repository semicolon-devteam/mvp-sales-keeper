-- Allow Owners to update details of members in their store
-- Check if policy exists first or just create a new one (policies with same name might conflict, but harmless if distinct)

create policy "Owners can update their store members"
on store_members
for update
using (
  auth.uid() in (
    select user_id 
    from store_members as owners
    where owners.store_id = store_members.store_id 
    and owners.role = 'owner'
  )
);

-- Also ensure they can Select (usually yes, but good to be sure)
-- Existing select policies likely cover it.
