-- Create mvp_sales table
create table if not exists mvp_sales (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount numeric not null,
  date date not null,
  type text check (type in ('manual', 'excel')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table mvp_sales enable row level security;

-- Create Policy
create policy "Users can only see their own sales" on mvp_sales
  for all using (auth.uid() = user_id);
