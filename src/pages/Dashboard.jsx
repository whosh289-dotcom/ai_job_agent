import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, Play, Loader2, Bot, Briefcase, FileText, Users, Target } from 'lucide-react'
import { useState } from 'react'

async function fetchApi(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
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

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => fetchApi('/api/history/runs'),
  })

  const runAgent = useMutation({
    mutationFn: (data) => fetchApi(`/api/agents/${selectedAgent}`, { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['runs'] }),
  })

  const handleRun = () => {
    if (!input.trim()) return
    runAgent.mutate({ input: input.trim() })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-400 mt-1">Run AI agents to automate your job search</p>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedAgent(agent.id)}
            className={`p-4 rounded-xl border transition-all text-left ${
              selectedAgent === agent.id
                ? `bg-${agent.color}-500/20 border-${agent.color}-500/50`
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${agent.color}-500/20 flex items-center justify-center`}>
                <agent.icon className={`w-5 h-5 text-${agent.color}-400`} />
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
                Running...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run {agents.find(a => a.id === selectedAgent)?.name}
              </>
            )}
          </button>
        </div>
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
