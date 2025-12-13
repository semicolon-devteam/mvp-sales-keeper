-- Drop the existing check constraint
ALTER TABLE public.mvp_sales DROP CONSTRAINT IF EXISTS mvp_sales_type_check;

-- Add the new check constraint with expanded types
ALTER TABLE public.mvp_sales 
ADD CONSTRAINT mvp_sales_type_check 
CHECK (type IN ('manual', 'excel', 'hall', 'baemin', 'yogiyo', 'coupang'));
