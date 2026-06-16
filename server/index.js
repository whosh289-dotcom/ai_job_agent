import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// AI Agent execution simulation
async function runAgent(agentType, input) {
  const delay = Math.random() * 2000 + 1000
  await new Promise(r => setTimeout(r, delay))

  const outputs = {
    commander: `Job Search Pipeline Executed Successfully

════════════════════════════
AGENT 1 — LINKEDIN OPTIMIZER
════════════════════════════
Headline optimized for: ${input}
Profile updated with relevant keywords
Skills section refreshed with trending terms

════════════════════════════
AGENT 2 — JOB SCANNER
════════════════════════════
Scanned LinkedIn, Indeed, Glassdoor
Found 25 relevant positions
Top matches identified based on criteria

════════════════════════════
AGENT 3 — RESUME CUSTOMIZER
════════════════════════════
ATS keywords extracted
Bullet points optimized for impact
Summary tailored to target role

════════════════════════════
AGENT 4 — RECRUITER OUTREACH
════════════════════════════
Connection notes drafted
Follow-up sequence planned
12 recruiters identified for outreach`,

    'job-scanner': `Job Search Results for: ${input}

Search Results Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LinkedIn Jobs: 15 matches
Indeed: 32 matches
Glassdoor: 18 matches

Top 5 Matches:
1. Senior Engineer - TechCorp (Remote) - $140k-180k
   Match Score: 95%
   Requirements: 5+ years experience, cloud platforms

2. Lead Developer - StartupXYZ (NYC) - $150k-200k
   Match Score: 90%
   Requirements: Full stack, team leadership

3. Principal Engineer - BigTech (SF) - $180k-250k
   Match Score: 88%
   Requirements: 10+ years, system design

4. Staff Engineer - GrowthCo (Remote) - $160k-210k
   Match Score: 85%
   Requirements: Architecture, mentoring

5. Senior SWE - FinanceHub (Chicago) - $130k-170k
   Match Score: 82%
   Requirements: Java, distributed systems`,

    'linkedin-optimizer': `LinkedIn Profile Optimization for: ${input}

Optimized Headline:
"Senior Engineer | Building Scalable Systems | Cloud Architecture | Team Leadership"

About Section (Rewritten):
Accomplished software engineer with 8+ years building high-impact products. Expert in distributed systems and cloud architecture. Led teams of 5-15 engineers delivering products used by millions. Passionate about clean code, mentoring, and driving technical excellence.

Skills Highlighted:
• Cloud Architecture (AWS/GCP)
• Distributed Systems
• Team Leadership
• System Design
• Agile Methodologies

Open-to-Work Settings Updated:
Status: Actively looking
Roles: Senior Engineer, Staff Engineer, Principal
Locations: Remote, NYC, SF
Salary Range: $150k-200k`,

    'resume-customizer': `Resume Customization for: ${input}

ATS Keyword Analysis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keywords Added: 24
Keywords Optimized: 15
ATS Score: 92%

Bullet Point Improvements:

Before: "Worked on backend services"
After: "Architected and maintained 15+ microservices handling 10M+ daily requests with 99.9% uptime"

Before: "Led a team"
After: "Led cross-functional team of 12 engineers, delivering 3 major product launches and increasing revenue by 40%"

Before: "Used AWS"
After: "Designed serverless architecture on AWS reducing infrastructure costs by 60% and improving deployment speed by 80%"

Final Resume Score: 94/100`,

    'recruiter-outreach': `Recruiter Outreach Strategy for: ${input}

Connection Notes Generated: 5

1. TechCorp - Sarah Johnson (Tech Recruiter)
   "Hi Sarah, I noticed TechCorp's impressive growth in the AI space. As a senior engineer with experience in scalable systems, I'd love to connect and learn about opportunities on your engineering teams."

2. StartupXYZ - Mike Chen (Engineering Recruiter)
   "Hi Mike, saw your posts about StartupXYZ's engineering culture. I'm a senior full-stack engineer excited about joining fast-growing teams. Would love to chat about open roles!"

Follow-up Templates Created:
• Initial outreach: 150 characters
• Post-connection: 300 characters
• Post-application: 250 characters
• 1-week follow-up: 200 characters

Recommended Outreach Order:
1. TechCorp (highest match score)
2. StartupXYZ (culture fit)
3. GrowthCo (remote friendly)`
  }

  return outputs[agentType] || `Agent ${agentType} processed: ${input}`
}

// API: Get run history
app.get('/api/history/runs', async (req, res) => {
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return res.status(500).json({ error: error.message })
  // Transform to camelCase for frontend
  const transformed = (data || []).map(row => ({
    id: row.id,
    linkedinSub: row.linkedin_sub,
    agentType: row.agent_type,
    input: row.input,
    result: row.result,
    status: row.status,
    isScheduled: row.is_scheduled,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }))
  res.json(transformed)
})

// API: Get outreach history
app.get('/api/history/outreach', async (req, res) => {
  const { data, error } = await supabase
    .from('outreach_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// API: Run agent
app.post('/api/agents/:agentType', async (req, res) => {
  const { agentType } = req.params
  const { input } = req.body

  if (!input) return res.status(400).json({ error: 'Input required' })

  const { data: run, error: createError } = await supabase
    .from('agent_runs')
    .insert({
      agent_type: agentType,
      input,
      status: 'running',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (createError) return res.status(500).json({ error: createError.message })

  try {
    const result = await runAgent(agentType, input)
    await supabase
      .from('agent_runs')
      .update({
        result,
        status: 'done',
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id)

    res.json({ id: run.id, result, status: 'done' })
  } catch (err) {
    await supabase.from('agent_runs').update({ status: 'error', result: err.message }).eq('id', run.id)
    res.status(500).json({ error: err.message })
  }
})

// API: Get scheduled jobs
app.get('/api/scheduler/jobs', async (req, res) => {
  const { data, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  // Transform to camelCase
  const transformed = (data || []).map(row => ({
    id: row.id,
    linkedinSub: row.linkedin_sub,
    jobGoal: row.job_goal,
    targetRole: row.target_role,
    location: row.location,
    skills: row.skills,
    frequency: row.frequency,
    isActive: row.is_active,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    createdAt: row.created_at,
  }))
  res.json(transformed)
})

// API: Create scheduled job
app.post('/api/scheduler/jobs', async (req, res) => {
  const { jobGoal, targetRole, location, skills, frequency = 'daily' } = req.body

  if (!jobGoal || !targetRole) {
    return res.status(400).json({ error: 'jobGoal and targetRole are required' })
  }

  const nextRunAt = new Date()
  nextRunAt.setHours(nextRunAt.getHours() + 1)

  const { data, error } = await supabase
    .from('scheduled_jobs')
    .insert({
      job_goal: jobGoal,
      target_role: targetRole,
      location: location || '',
      skills: skills || '',
      frequency,
      is_active: true,
      next_run_at: nextRunAt.toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({
    id: data.id,
    linkedinSub: data.linkedin_sub,
    jobGoal: data.job_goal,
    targetRole: data.target_role,
    location: data.location,
    skills: data.skills,
    frequency: data.frequency,
    isActive: data.is_active,
    lastRunAt: data.last_run_at,
    nextRunAt: data.next_run_at,
    createdAt: data.created_at,
  })
})

// API: Toggle job
app.post('/api/scheduler/jobs/:id/toggle', async (req, res) => {
  const { id } = req.params
  const { data: job } = await supabase.from('scheduled_jobs').select('is_active').eq('id', id).single()

  if (!job) return res.status(404).json({ error: 'Job not found' })

  const { data, error } = await supabase
    .from('scheduled_jobs')
    .update({ is_active: !job.is_active })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({
    id: data.id,
    isActive: data.is_active,
  })
})

// API: Delete job
app.delete('/api/scheduler/jobs/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase.from('scheduled_jobs').delete().eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

// API: Trigger scheduler
app.post('/api/scheduler/trigger', async (req, res) => {
  let executed = 0
  const now = new Date()

  const { data: jobs } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('is_active', true)
    .lte('next_run_at', now.toISOString())

  if (jobs) {
    for (const job of jobs) {
      const input = `${job.target_role} - ${job.job_goal}. Location: ${job.location || 'Any'}. Skills: ${job.skills || 'Not specified'}`

      const { data: run } = await supabase.from('agent_runs').insert({
        agent_type: 'job-scanner',
        input,
        status: 'running',
        created_at: now.toISOString(),
      }).select().single()

      if (run) {
        const result = await runAgent('job-scanner', input)
        await supabase.from('agent_runs').update({
          result,
          status: 'done',
          completed_at: new Date().toISOString(),
        }).eq('id', run.id)

        const nextRun = new Date(now)
        if (job.frequency === 'hourly') nextRun.setHours(nextRun.getHours() + 1)
        else if (job.frequency === 'daily') nextRun.setDate(nextRun.getDate() + 1)
        else nextRun.setDate(nextRun.getDate() + 7)

        await supabase.from('scheduled_jobs').update({
          last_run_at: now.toISOString(),
          next_run_at: nextRun.toISOString(),
        }).eq('id', job.id)

        executed++
      }
    }
  }

  res.json({ result: `Triggered scheduler. ${executed} job(s) executed.` })
})

// 24/7 Scheduler - runs every minute
cron.schedule('* * * * *', async () => {
  console.log('[Scheduler] Checking for pending jobs...')
  try {
    // Call the trigger logic directly instead of HTTP fetch
    const now = new Date()
    const { data: jobs } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', now.toISOString())

    let executed = 0
    if (jobs) {
      for (const job of jobs) {
        const input = `${job.target_role} - ${job.job_goal}. Location: ${job.location || 'Any'}. Skills: ${job.skills || 'Not specified'}`

        const { data: run } = await supabase.from('agent_runs').insert({
          agent_type: 'job-scanner',
          input,
          status: 'running',
          created_at: now.toISOString(),
        }).select().single()

        if (run) {
          const result = await runAgent('job-scanner', input)
          await supabase.from('agent_runs').update({
            result,
            status: 'done',
            completed_at: new Date().toISOString(),
          }).eq('id', run.id)

          const nextRun = new Date(now)
          if (job.frequency === 'hourly') nextRun.setHours(nextRun.getHours() + 1)
          else if (job.frequency === 'daily') nextRun.setDate(nextRun.getDate() + 1)
          else nextRun.setDate(nextRun.getDate() + 7)

          await supabase.from('scheduled_jobs').update({
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString(),
          }).eq('id', job.id)

          executed++
        }
      }
    }
    console.log(`[Scheduler] Executed ${executed} job(s)`)
  } catch (err) {
    console.error('[Scheduler Error]', err.message)
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`JobAgent AI Server running on port ${PORT}`)
  console.log('24/7 Scheduler active - checking every minute')
})
