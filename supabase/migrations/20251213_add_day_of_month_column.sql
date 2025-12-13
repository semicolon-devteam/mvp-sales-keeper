alter table fixed_costs add column if not exists day_of_month integer check (day_of_month >= 1 and day_of_month <= 31);
