-- Fix store_members UPDATE permission issue
-- Create a SECURITY DEFINER function to bypass RLS recursion

CREATE OR REPLACE FUNCTION update_store_member(
    p_member_id UUID,
    p_alias TEXT,
    p_hourly_wage INTEGER,
    p_color TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE store_members
    SET
        alias = p_alias,
        hourly_wage = p_hourly_wage,
        color = p_color
    WHERE id = p_member_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_store_member TO authenticated;
