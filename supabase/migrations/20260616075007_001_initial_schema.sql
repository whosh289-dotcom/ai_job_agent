-- Agent runs history
CREATE TABLE IF NOT EXISTS agent_runs (
  id SERIAL PRIMARY KEY,
  linkedin_sub TEXT,
  agent_type TEXT NOT NULL,
  input TEXT NOT NULL,
  result TEXT,
  status TEXT DEFAULT 'pending',
  is_scheduled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Scheduled jobs
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id SERIAL PRIMARY KEY,
  linkedin_sub TEXT,
  job_goal TEXT NOT NULL,
  target_role TEXT NOT NULL,
  location TEXT DEFAULT '',
  skills TEXT DEFAULT '',
  frequency TEXT DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach history
CREATE TABLE IF NOT EXISTS outreach_history (
  id SERIAL PRIMARY KEY,
  linkedin_sub TEXT,
  recruiter_name TEXT,
  recruiter_link TEXT,
  company TEXT,
  outreach_type TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_runs
CREATE POLICY "select_agent_runs" ON agent_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_agent_runs" ON agent_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_agent_runs" ON agent_runs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_agent_runs" ON agent_runs FOR DELETE TO authenticated USING (true);

-- RLS Policies for scheduled_jobs
CREATE POLICY "select_scheduled_jobs" ON scheduled_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_scheduled_jobs" ON scheduled_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_scheduled_jobs" ON scheduled_jobs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_scheduled_jobs" ON scheduled_jobs FOR DELETE TO authenticated USING (true);

-- RLS Policies for outreach_history
CREATE POLICY "select_outreach_history" ON outreach_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_outreach_history" ON outreach_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_outreach_history" ON outreach_history FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_outreach_history" ON outreach_history FOR DELETE TO authenticated USING (true);
