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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: call the AI proxy edge function
async function callAiProxy(messages, systemPrompt, apiKey) {
  const res = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey || supabaseKey}`,
    },
    body: JSON.stringify({ messages, systemPrompt, apiKey }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'AI proxy error')
  }
  const data = await res.json()
  return data.text || ''
}

// AI Agent execution with real model
async function runAgent(agentType, input, userProfile, apiKey) {
  const systemPrompts = {
    commander: `You are JobAgent Commander, a senior AI career strategist. Orchestrate a complete job search pipeline. Generate realistic, detailed, actionable results with specific numbers, company names, and concrete advice.`,
    'job-scanner': `You are a Job Scanner AI. Scan job boards for matching positions. Provide realistic job listings with company names, salary ranges, locations, and match scores. Include 5-8 detailed listings.`,
    'linkedin-optimizer': `You are a LinkedIn Profile Optimization AI. Rewrite the user's headline, about section, and skills for maximum recruiter appeal. Provide exact copy-paste ready text.`,
    'resume-customizer': `You are a Resume Customization AI. Provide ATS-optimized resume improvements with before/after bullet points, keyword analysis, and formatting tips.`,
    'recruiter-outreach': `You are a Recruiter Outreach AI. Generate personalized LinkedIn connection messages and follow-up sequences. Provide 3-5 templates with company names and a follow-up timeline.`,
  }

  const systemPrompt = systemPrompts[agentType] || systemPrompts.commander
  const userContent = `User Profile:\n${JSON.stringify(userProfile, null, 2)}\n\nJob Search Criteria:\n${input}\n\nProvide detailed, actionable results.`

  return callAiProxy([{ role: 'user', content: userContent }], systemPrompt, apiKey)
}

// API: Get run history
app.get('/api/history/runs', async (req, res) => {
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return res.status(500).json({ error: error.message })
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
  const { input, apiKey } = req.body

  if (!input) return res.status(400).json({ error: 'Input required' })
  if (!apiKey) return res.status(400).json({ error: 'Gemini API key required. Get a free key at ai.google.dev' })

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

  // Get user profile for context
  let userProfile = {}
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (profile) userProfile = profile
  } catch (e) {
    // ignore
  }

  try {
    const result = await runAgent(agentType, input, userProfile, apiKey)
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
  const { apiKey } = req.body
  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API key required for scheduled runs' })
  }

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
        try {
          const result = await runAgent('job-scanner', input, {}, apiKey)
          await supabase.from('agent_runs').update({
            result,
            status: 'done',
            completed_at: new Date().toISOString(),
          }).eq('id', run.id)
        } catch (err) {
          await supabase.from('agent_runs').update({
            status: 'error',
            result: err.message,
          }).eq('id', run.id)
        }

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
// Note: This requires a global API key to work. If none is set, it skips.
const SCHEDULER_API_KEY = process.env.GEMINI_API_KEY || ''

if (SCHEDULER_API_KEY) {
  cron.schedule('* * * * *', async () => {
    console.log('[Scheduler] Checking for pending jobs...')
    try {
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
            try {
              const result = await runAgent('job-scanner', input, {}, SCHEDULER_API_KEY)
              await supabase.from('agent_runs').update({
                result,
                status: 'done',
                completed_at: new Date().toISOString(),
              }).eq('id', run.id)
            } catch (err) {
              await supabase.from('agent_runs').update({
                status: 'error',
                result: err.message,
              }).eq('id', run.id)
            }

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
} else {
  console.log('[Scheduler] Skipping background scheduler - no GEMINI_API_KEY set')
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`JobAgent AI Server running on port ${PORT}`)
  if (SCHEDULER_API_KEY) {
    console.log('24/7 Scheduler active - checking every minute')
  } else {
    console.log('24/7 Scheduler inactive - set GEMINI_API_KEY to enable')
  }
})
