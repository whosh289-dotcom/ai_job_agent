import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Play, Pause, Calendar, Loader2 } from 'lucide-react'
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

export default function Schedule() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    jobGoal: '',
    targetRole: '',
    location: '',
    skills: '',
    frequency: 'daily',
  })

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['scheduled-jobs'],
    queryFn: () => fetchApi('/api/scheduler/jobs'),
  })

  const createJob = useMutation({
    mutationFn: (data) => fetchApi('/api/scheduler/jobs', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] })
      setShowForm(false)
      setForm({ jobGoal: '', targetRole: '', location: '', skills: '', frequency: 'daily' })
    },
  })

  const toggleJob = useMutation({
    mutationFn: (id) => fetchApi(`/api/scheduler/jobs/${id}/toggle`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] }),
  })

  const deleteJob = useMutation({
    mutationFn: (id) => fetchApi(`/api/scheduler/jobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] }),
  })

  const triggerScheduler = useMutation({
    mutationFn: () => fetchApi('/api/scheduler/trigger', { method: 'POST' }),
    onSuccess: (data) => alert(data.result),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createJob.mutate(form)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule</h1>
          <p className="text-slate-400 mt-1">Configure 24/7 automated job searches</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Job
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Scheduler Status</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm text-slate-400">Running 24/7 • {jobs.filter(j => j.isActive).length} active jobs</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => triggerScheduler.mutate()}
            disabled={triggerScheduler.isPending}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium flex items-center gap-2"
          >
            {triggerScheduler.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Now
          </button>
        </div>
      </div>

      {/* Job List */}
      {showForm && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="font-semibold mb-4">Create Scheduled Job</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Job Goal (e.g., Find senior roles)"
                value={form.jobGoal}
                onChange={(e) => setForm({ ...form, jobGoal: e.target.value })}
                className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Target Role (e.g., Software Engineer)"
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Location (e.g., Remote, NYC)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Skills (e.g., React, Python)"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createJob.isPending}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-medium"
              >
                {createJob.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold">Scheduled Jobs ({jobs.length})</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No scheduled jobs. Create one to start 24/7 automation.
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-700/20">
                <div className="flex-1">
                  <h3 className="font-medium">{job.targetRole}</h3>
                  <p className="text-sm text-slate-400">{job.jobGoal}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{job.location || 'Any location'}</span>
                    <span>•</span>
                    <span>{job.frequency}</span>
                    <span>•</span>
                    <span>Next: {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString() : 'Pending'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleJob.mutate(job.id)}
                    className={`p-2 rounded-lg ${job.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'} hover:opacity-80`}
                  >
                    {job.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteJob.mutate(job.id)}
                    className="p-2 rounded-lg bg-slate-700 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
