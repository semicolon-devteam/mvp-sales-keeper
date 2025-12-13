-- Create fixed_costs table
create table if not exists fixed_costs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  store_id uuid not null, -- Optional in code but let's enforce store context
  name text not null,
  amount integer not null,
  day_of_month integer not null check (day_of_month >= 1 and day_of_month <= 31),
  category text default '고정비',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table fixed_costs enable row level security;

create policy "Users can view their own fixed costs"
  on fixed_costs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own fixed costs"
  on fixed_costs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own fixed costs"
  on fixed_costs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own fixed costs"
  on fixed_costs for delete
  using (auth.uid() = user_id);
