-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_records ENABLE ROW LEVEL SECURITY;

-- Personnel Policies (can see and edit their own data)
CREATE POLICY "Personnel can view own profile" ON profiles FOR SELECT USING (auth.uid()::text = person_id);
CREATE POLICY "Personnel can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = person_id);

CREATE POLICY "Personnel can view own duty" ON duty_records FOR SELECT USING (auth.uid()::text = person_id);
CREATE POLICY "Personnel can insert own duty" ON duty_records FOR INSERT WITH CHECK (auth.uid()::text = person_id);

CREATE POLICY "Personnel can view own sleep" ON sleep_records FOR SELECT USING (auth.uid()::text = person_id);
CREATE POLICY "Personnel can insert own sleep" ON sleep_records FOR INSERT WITH CHECK (auth.uid()::text = person_id);

CREATE POLICY "Personnel can view own recovery" ON recovery_records FOR SELECT USING (auth.uid()::text = person_id);
CREATE POLICY "Personnel can insert own recovery" ON recovery_records FOR INSERT WITH CHECK (auth.uid()::text = person_id);

-- Command / Welfare Officer view (simplified for demo)
CREATE POLICY "Command can view all units" ON units FOR SELECT USING (true);
