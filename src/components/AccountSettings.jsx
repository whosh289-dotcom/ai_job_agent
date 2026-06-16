import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { User, Briefcase, MapPin, Save, LogOut, Linkedin, Check, ExternalLink } from 'lucide-react'
import LinkedInConnect from './LinkedInConnect'

export default function AccountSettings({ onClose }) {
  const { user, profile, updateProfile, signOut } = useAuth()
  const [name, setName] = useState(profile?.linkedin_name || '')
  const [headline, setHeadline] = useState(profile?.linkedin_headline || '')
  const [saving, setSaving] = useState(false)
  const [showLinkedIn, setShowLinkedIn] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateProfile({
      linkedin_name: name,
      linkedin_headline: headline,
    })
    setSaving(false)
    onClose()
  }

  async function handleSignOut() {
    await signOut()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold">Account Settings</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* User info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">
                  {(profile?.linkedin_name || user?.email)?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold">{profile?.linkedin_name || 'New User'}</p>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>

            {/* LinkedIn Connection */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0077B5]/20 rounded-lg flex items-center justify-center">
                    <Linkedin className="w-5 h-5 text-[#0077B5]" />
                  </div>
                  <div>
                    <p className="font-medium">LinkedIn</p>
                    {profile?.linkedin_id ? (
                      <p className="text-sm text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Connected
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400">Not connected</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowLinkedIn(true)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  {profile?.linkedin_id ? 'Manage' : 'Connect'}
                </button>
              </div>
              {profile?.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Profile
                </a>
              )}
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Headline / Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Software Engineer at TechCorp"
                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>

              <button
                onClick={handleSignOut}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-red-400"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLinkedIn && <LinkedInConnect onClose={() => setShowLinkedIn(false)} />}
    </>
  )
}
