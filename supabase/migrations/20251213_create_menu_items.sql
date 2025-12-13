-- Create menu_items table
create table if not exists public.menu_items (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null, -- Logic link to store (no strict FK to store_members for MVP flexibility)
  name text not null,
  category text, -- 'Main', 'Side', 'Drink'
  price numeric not null default 0,
  cost numeric default 0, -- Cost of Goods Sold
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(store_id, name) -- Prevent duplicate menu items per store
);

-- RLS
alter table public.menu_items enable row level security;

-- Policy: Users can view/edit menu items if they belong to the store (represented by ownership of sales for now, or just generic authenticated for MVP velocity)
-- For MVP, we'll restrict by "user who created it" or "store_id matches user's store context".
-- Since store_id is manual in this app currently, we'll allow Authenticated Users to CRUD, 
-- but Application Layer will filter by store_id.
create policy "Users can CRUD menu items"
on public.menu_items
for all
using (auth.role() = 'authenticated');
