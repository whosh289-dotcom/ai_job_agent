import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { X, Linkedin, ExternalLink, Check, AlertCircle, Unlink } from 'lucide-react'

export default function LinkedInConnect({ onClose }) {
  const { profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(profile?.linkedin_id ? 'connected' : 'instructions')
  const [manualMode, setManualMode] = useState(false)
  const [form, setForm] = useState({
    linkedin_name: profile?.linkedin_name || '',
    linkedin_headline: profile?.linkedin_headline || '',
    linkedin_url: profile?.linkedin_url || '',
    linkedin_email: '',
  })

  async function handleManualConnect() {
    setLoading(true)
    const { error } = await updateProfile({
      linkedin_id: 'manual-' + Date.now(),
      linkedin_name: form.linkedin_name,
      linkedin_headline: form.linkedin_headline,
      linkedin_url: form.linkedin_url,
    })
    setLoading(false)
    if (!error) {
      setStep('connected')
      setTimeout(onClose, 1500)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    await updateProfile({
      linkedin_id: null,
      linkedin_name: null,
      linkedin_headline: null,
      linkedin_url: null,
      linkedin_picture: null,
    })
    setLoading(false)
    setStep('instructions')
  }

  if (step === 'connected') {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">LinkedIn Connected!</h2>
            <p className="text-slate-400 mb-4">
              Your LinkedIn profile is now linked. JobAgent AI will use your profile data to personalize job searches and optimize your applications.
            </p>
            <div className="p-4 bg-slate-900 rounded-lg text-left mb-6">
              <p className="font-medium">{profile?.linkedin_name || form.linkedin_name}</p>
              <p className="text-sm text-slate-400">{profile?.linkedin_headline || form.linkedin_headline}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0077B5]/20 rounded-lg flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-[#0077B5]" />
            </div>
            <h2 className="text-xl font-semibold">Connect LinkedIn</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Benefits */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Linking your account enables:</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Auto-fill your profile in job applications</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Personalized job matching based on your experience</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Profile optimization suggestions</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>One-click apply to supported job postings</span>
              </li>
            </ul>
          </div>

          {manualMode ? (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm">
                <p>Enter your LinkedIn profile details manually. You can update this anytime.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={form.linkedin_name}
                  onChange={(e) => setForm({ ...form, linkedin_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Headline</label>
                <input
                  type="text"
                  value={form.linkedin_headline}
                  onChange={(e) => setForm({ ...form, linkedin_headline: e.target.value })}
                  placeholder="Senior Software Engineer at TechCorp"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleManualConnect}
                disabled={loading || !form.linkedin_name}
                className="w-full py-3 bg-[#0077B5] hover:bg-[#006399] disabled:opacity-50 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                {loading ? 'Connecting...' : 'Connect LinkedIn'}
              </button>

              <button
                onClick={() => setManualMode(false)}
                className="w-full py-3 text-slate-400 hover:text-white transition-colors"
              >
                Back to OAuth
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => {
                  // In production, this would trigger Supabase OAuth with LinkedIn
                  // For now, switch to manual mode
                  setManualMode(true)
                }}
                className="w-full py-3 bg-[#0077B5] hover:bg-[#006399] rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                Sign in with LinkedIn
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800 text-slate-500">or</span>
                </div>
              </div>

              <button
                onClick={() => setManualMode(true)}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                Enter Profile Manually
              </button>

              <p className="text-xs text-slate-500 text-center">
                LinkedIn OAuth requires app approval. Use manual entry to get started immediately.
              </p>
            </div>
          )}

          {profile?.linkedin_id && (
            <button
              onClick={handleDisconnect}
              className="w-full mt-4 py-2 text-red-400 hover:text-red-300 text-sm flex items-center justify-center gap-2"
            >
              <Unlink className="w-4 h-4" />
              Disconnect LinkedIn
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
