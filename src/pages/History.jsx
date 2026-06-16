import { useQuery } from '@tanstack/react-query'
import { Clock, Bot, Briefcase, FileText, Users, Target } from 'lucide-react'

async function fetchApi(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

const agentIcons = {
  commander: Bot,
  'job-scanner': Briefcase,
  'linkedin-optimizer': Users,
  'resume-customizer': FileText,
  'recruiter-outreach': Target,
}

export default function History() {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => fetchApi('/api/history/runs'),
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-slate-400 mt-1">View all agent executions</p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400">Loading...</div>
      ) : runs.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No history yet</h2>
          <p className="text-slate-400">Run some agents to see results here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => {
            const Icon = agentIcons[run.agentType] || Bot
            return (
              <div key={run.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-medium capitalize">{run.agentType?.replace('-', ' ')}</h3>
                      <p className="text-sm text-slate-400">{new Date(run.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    run.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                    run.status === 'running' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {run.status}
                  </span>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="text-xs uppercase text-slate-500 mb-1">Input</h4>
                    <p className="text-slate-300">{run.input}</p>
                  </div>
                  {run.result && (
                    <div>
                      <h4 className="text-xs uppercase text-slate-500 mb-1">Result</h4>
                      <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto scrollbar-thin">
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap">{run.result}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
