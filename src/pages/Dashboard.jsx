import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, Play, Loader2, Bot, Briefcase, FileText, Users, Target, MessageSquare, Sparkles, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiKey } from '../lib/ai'
import ApiKeySetup from '../components/ApiKeySetup'

async function fetchApi(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.body ? JSON.stringify({ ...options.body, apiKey: getApiKey() }) : undefined,
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed')
  return res.json()
}

const agents = [
  { id: 'commander', name: 'Commander', icon: Bot, color: 'emerald', description: 'Run all agents in sequence' },
  { id: 'job-scanner', name: 'Job Scanner', icon: Briefcase, color: 'cyan', description: 'Scan job boards for matches' },
  { id: 'linkedin-optimizer', name: 'LinkedIn Optimizer', icon: Users, color: 'blue', description: 'Optimize your profile' },
  { id: 'resume-customizer', name: 'Resume Customizer', icon: FileText, color: 'purple', description: 'Tailor resume for jobs' },
  { id: 'recruiter-outreach', name: 'Recruiter Outreach', icon: Target, color: 'orange', description: 'Generate outreach messages' },
]

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [selectedAgent, setSelectedAgent] = useState('commander')
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => fetchApi('/api/history/runs'),
  })

  const runAgent = useMutation({
    mutationFn: (data) => fetchApi(`/api/agents/${selectedAgent}`, { method: 'POST', body: data }),
    onSuccess: (data) => {
      setResult(data.result)
      queryClient.invalidateQueries({ queryKey: ['runs'] })
    },
  })

  const handleRun = () => {
    if (!input.trim()) return
    setResult(null)
    runAgent.mutate({ input: input.trim() })
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">Run AI agents powered by Gemini 2.0 Flash</p>
        </div>
        <Link
          to="/ai-chat"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Open AI Chat
        </Link>
      </div>

      {/* AI Status Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-slate-900" />
        </div>
        <div>
          <p className="font-medium text-emerald-400">Gemini 2.0 Flash Active</p>
          <p className="text-sm text-slate-400">All agents now use the most advanced free AI model for job search automation.</p>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedAgent(agent.id)}
            className={`p-4 rounded-xl border transition-all text-left ${
              selectedAgent === agent.id
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedAgent === agent.id ? 'bg-emerald-500/20' : 'bg-slate-700'
              }`}>
                <agent.icon className={`w-5 h-5 ${
                  selectedAgent === agent.id ? 'text-emerald-400' : 'text-slate-400'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-sm text-slate-400">{agent.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Run Panel */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Run Agent</h2>
        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter job search criteria (e.g., 'Senior React Developer in NYC, $150k+, remote preferred')"
            className="w-full h-32 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg resize-none focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleRun}
            disabled={runAgent.isPending || !input.trim()}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {runAgent.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running with Gemini 2.0 Flash...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run {agents.find(a => a.id === selectedAgent)?.name}
              </>
            )}
          </button>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-emerald-400">AI Result</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{result}</pre>
            </div>
          </div>
        )}

        {runAgent.isError && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {runAgent.error?.message || 'Failed to run agent. Please try again.'}
          </div>
        )}
      </div>

      {/* Recent Runs */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold">Recent Runs</h2>
        </div>
        <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No runs yet</div>
          ) : (
            runs.slice(0, 10).map((run) => (
              <div key={run.id} className="p-4 hover:bg-slate-700/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{run.agentType?.replace('-', ' ')}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        run.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                        run.status === 'running' ? 'bg-cyan-500/20 text-cyan-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 truncate mt-1">{run.input}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(run.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
