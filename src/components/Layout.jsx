import { NavLink } from 'react-router-dom'
import { Bot, Calendar, History, Zap, MessageSquare, Menu, X, User, LogIn, Linkedin, Check } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth'
import AuthModal from './AuthModal'
import AccountSettings from './AccountSettings'
import LinkedInConnect from './LinkedInConnect'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showLinkedIn, setShowLinkedIn] = useState(false)
  const { user, profile, loading } = useAuth()

  const navItems = [
    { to: '/', icon: Zap, label: 'Dashboard' },
    { to: '/ai-chat', icon: MessageSquare, label: 'AI Chat' },
    { to: '/schedule', icon: Calendar, label: 'Schedule' },
    { to: '/history', icon: History, label: 'History' },
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-40`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="font-bold text-lg">JobAgent AI</h1>
                <p className="text-xs text-slate-400">24/7 Automation</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Account Section */}
          <div className="p-4 border-t border-slate-700">
            {loading ? (
              <div className="px-4 py-3 bg-slate-700/50 rounded-lg animate-pulse">
                <div className="h-4 bg-slate-600 rounded w-20" />
              </div>
            ) : user ? (
              <div className="space-y-3">
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-900">
                      {(profile?.linkedin_name || user.email)?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile?.linkedin_name || 'Account'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </button>

                {profile?.linkedin_id && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#0077B5]/10 border border-[#0077B5]/30 rounded-lg">
                    <Linkedin className="w-4 h-4 text-[#0077B5]" />
                    <span className="text-xs text-[#0077B5] flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      LinkedIn Connected
                    </span>
                  </div>
                )}

                {!profile?.linkedin_id && (
                  <button
                    onClick={() => setShowLinkedIn(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-[#0077B5]/10 border border-[#0077B5]/30 rounded-lg hover:bg-[#0077B5]/20 transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-[#0077B5]" />
                    <span className="text-sm text-[#0077B5] font-medium">Connect LinkedIn</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                <LogIn className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Connect Account</span>
              </button>
            )}

            <div className="mt-3 px-4 py-2 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-slate-400">Scheduler Active</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Modals */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showSettings && <AccountSettings onClose={() => setShowSettings(false)} />}
      {showLinkedIn && <LinkedInConnect onClose={() => setShowLinkedIn(false)} />}
    </div>
  )
}
