-- Drop the old constraint
ALTER TABLE mvp_sales DROP CONSTRAINT IF EXISTS mvp_sales_type_check;

-- Add the new constraint with expanded types
ALTER TABLE mvp_sales ADD CONSTRAINT mvp_sales_type_check 
CHECK (type IN ('manual', 'excel', 'hall', 'baemin', 'coupang', 'yogiyo'));
