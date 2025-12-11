-- Create fixed_costs table
create table if not exists fixed_costs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  amount numeric not null,
  payment_day integer check (payment_day between 1 and 31),
  created_at timestamptz default now()
);

-- Enable RLS
alter table fixed_costs enable row level security;

-- Create Policy
create policy "Users can only see their own fixed costs" on fixed_costs
  for all using (auth.uid() = user_id);
