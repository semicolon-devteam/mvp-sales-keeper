-- Create a dummy user in auth.users if possible (requires super admin), 
-- OR just insert into store_members if there is NO foreign key constraint (unlikely).
-- If there IS a foreign key constraint to auth.users, we cannot easily create a fake user without admin API.

-- ALTERNATIVE: MOCK_USER strategy.
-- We can't insert into auth.users from here easily.

-- BUT, we can update the CURRENT user's record to have a distinct Alias and Wage to specific values to PROVE it works.
-- "Test update on Myself"

UPDATE store_members
SET alias = '테스트 계정', hourly_wage = 12345, color = 'red'
WHERE user_id = auth.uid();
