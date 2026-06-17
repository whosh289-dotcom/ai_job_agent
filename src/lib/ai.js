import { supabase } from './supabase'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`

export function getApiKey() {
  return localStorage.getItem('gemini_api_key') || ''
}

export function setApiKey(key) {
  localStorage.setItem('gemini_api_key', key)
}

export async function sendChatMessage(messages, systemPrompt) {
  const apiKey = getApiKey()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY

  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, systemPrompt, apiKey }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'AI request failed')
  }

  return res.json()
}

export async function generateAgentResult(agentType, input, userProfile) {
  const systemPrompts = {
    commander: `You are JobAgent Commander, a senior AI career strategist. Your job is to orchestrate a complete job search pipeline. You have access to simulate LinkedIn optimization, job scanning, resume customization, and recruiter outreach. Generate realistic, detailed, and actionable results for the user's job search criteria. Always include specific numbers, company names, and concrete advice.`,
    'job-scanner': `You are a Job Scanner AI. You scan job boards (LinkedIn, Indeed, Glassdoor, AngelList, etc.) for matching positions. Provide realistic job listings with company names, salary ranges, locations, and match scores. Include 5-8 detailed listings.`,
    'linkedin-optimizer': `You are a LinkedIn Profile Optimization AI. Rewrite the user's headline, about section, and skills for maximum recruiter appeal. Provide the exact optimized text they can copy-paste into their profile. Include keywords relevant to their target role.`,
    'resume-customizer': `You are a Resume Customization AI. Analyze the user's target role and provide ATS-optimized resume improvements. Include before/after bullet points, keyword analysis, and formatting tips. Make the resume quantifiable and impactful.`,
    'recruiter-outreach': `You are a Recruiter Outreach AI. Generate personalized LinkedIn connection messages and follow-up sequences. Provide 3-5 recruiter outreach templates with company names, recruiter names, and specific talking points. Include a follow-up timeline.`,
  }

  const systemPrompt = systemPrompts[agentType] || systemPrompts.commander

  const userContent = `User Profile:\n${JSON.stringify(userProfile, null, 2)}\n\nJob Search Criteria:\n${input}\n\nPlease provide a detailed, actionable result.`

  const messages = [
    { role: 'user', content: userContent },
  ]

  return sendChatMessage(messages, systemPrompt)
}
