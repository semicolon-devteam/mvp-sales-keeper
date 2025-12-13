-- Ensure store_id column exists in financial tables for multi-store support

-- mvp_sales
ALTER TABLE mvp_sales ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
CREATE INDEX IF NOT EXISTS idx_mvp_sales_store_id ON mvp_sales(store_id);

-- expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
CREATE INDEX IF NOT EXISTS idx_expenses_store_id ON expenses(store_id);

-- fixed_costs
ALTER TABLE fixed_costs ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_store_id ON fixed_costs(store_id);

-- Optional: Backfill store_id from user_id if null (Assuming 1 user = 1 store for MVP migration)
-- UPDATE mvp_sales SET store_id = (SELECT store_id FROM store_members WHERE user_id = mvp_sales.user_id AND role = 'owner' LIMIT 1) WHERE store_id IS NULL;
-- (Skipping auto-backfill to avoid performance hit on large data, App logic handles it on read/write usually)
