-- Menu Items (The "Menu Board")
create table if not exists menu_items (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references store_members(store_id) not null, -- Links to store
  name text not null,
  category text, -- 'Main', 'Side', 'Drink'
  price numeric not null default 0,
  cost numeric default 0, -- Cost of Goods Sold (Optional, for advanced margin calc)
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Sale Items (The "Receipt Details")
create table if not exists sale_items (
  id uuid default gen_random_uuid() primary key,
  sale_id uuid references mvp_sales(id) on delete cascade not null, -- Parent Sale
  menu_item_id uuid references menu_items(id), -- Link to specific menu (optional if ad-hoc)
  name text not null, -- Snapshot of name at time of sale
  quantity integer not null default 1,
  unit_price numeric not null,
  total_price numeric not null, -- quantity * unit_price
  created_at timestamptz default now()
);

-- Enable RLS
alter table menu_items enable row level security;
alter table sale_items enable row level security;

-- Policies (Reuse existing store logic pattern - simplified for MVP)
-- ideally we join via store_members, but for MVP we might need open access or specific owner check.
-- For now, allow authenticated users to read/write for velocity, 
-- relying on application-level filtering by store_id.
create policy "Users can crud menu items" on menu_items for all using (auth.role() = 'authenticated');
create policy "Users can crud sale items" on sale_items for all using (auth.role() = 'authenticated');
