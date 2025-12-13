-- Create expenses table
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount numeric not null,
  merchant_name text not null,
  date date not null,
  category text,
  image_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table expenses enable row level security;

-- Create Policy
create policy "Users can only see their own expenses" on expenses
  for all using (auth.uid() = user_id);
