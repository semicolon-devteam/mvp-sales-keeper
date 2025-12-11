-- 1. Modify store_members to add staff details
ALTER TABLE store_members 
ADD COLUMN IF NOT EXISTS hourly_wage INTEGER DEFAULT 9860, -- 2024 Minimum Wage
ADD COLUMN IF NOT EXISTS alias TEXT,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'teal';

-- 2. Create work_schedules table (Planned Shifts)
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  user_id UUID NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  break_minutes INTEGER DEFAULT 0, -- Unpaid break time
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys (Assuming tables exist)
  -- CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES stores(id),
  -- CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) -- Assuming auth.users is not directly linkable in public schema usually, but logic holds.
  -- Simplified for now:
  CONSTRAINT fk_member_link FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- 3. Create work_logs table (Actual Attendance)
CREATE TABLE IF NOT EXISTS work_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  user_id UUID NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  wage_snapshot INTEGER NOT NULL, -- Wage at the time of work
  status TEXT DEFAULT 'working', -- 'working', 'completed', 'corrected'
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Security)
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Adjust based on your actual RLS needs)
-- Allow read/write for members of the same store
CREATE POLICY "Allow members to view schedules" ON work_schedules
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM store_members WHERE store_id = work_schedules.store_id
    )
  );

CREATE POLICY "Allow managers to manage schedules" ON work_schedules
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM store_members WHERE store_id = work_schedules.store_id AND role IN ('owner', 'manager')
    )
  );

-- Logs Policies
CREATE POLICY "View own logs or manager view" ON work_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM store_members WHERE store_id = work_logs.store_id AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Insert own logs" ON work_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own logs" ON work_logs
  FOR UPDATE USING (auth.uid() = user_id);
