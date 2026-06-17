import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { generateAgentResult, getApiKey } from '../lib/ai'
import { sendChatMessage } from '../lib/ai'
import { Send, Loader2, Sparkles, Bot, User, Copy, Check, X } from 'lucide-react'
import ApiKeySetup from './ApiKeySetup'

function AgentSelector({ selected, onSelect }) {
  const agents = [
    { id: 'commander', label: 'Commander', icon: Bot, desc: 'All agents' },
    { id: 'job-scanner', label: 'Job Scanner', icon: Sparkles, desc: 'Scan jobs' },
    { id: 'linkedin-optimizer', label: 'LinkedIn', icon: User, desc: 'Optimize' },
    { id: 'resume-customizer', label: 'Resume', icon: Copy, desc: 'Tailor' },
    { id: 'recruiter-outreach', label: 'Outreach', icon: Send, desc: 'Messages' },
  ]
  return (
    <div className="flex gap-2 flex-wrap">
      {agents.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selected === a.id
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
          }`}
        >
          <a.icon className="w-3.5 h-3.5" />
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function AIChat({ onClose, initialAgent = 'commander', standalone = false }) {
  const { user, profile } = useAuth()
  const [agentType, setAgentType] = useState(initialAgent)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const [hasKey, setHasKey] = useState(!!getApiKey())
  const bottomRef = useRef(null)

  const userInitial = (profile?.linkedin_name || user?.email || 'U')[0].toUpperCase()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (messages.length === 0 && standalone) {
      setMessages([{
        role: 'assistant',
        content: 'Hello! I am Gemini 2.0 Flash, the most advanced free AI model. I power your job search automation. How can I help you today?'
      }])
    }
  }, [standalone])

  useEffect(() => {
    const checkKey = () => setHasKey(!!getApiKey())
    window.addEventListener('storage', checkKey)
    const iv = setInterval(checkKey, 1000)
    return () => {
      window.removeEventListener('storage', checkKey)
      clearInterval(iv)
    }
  }, [])

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const { text } = await generateAgentResult(agentType, userMsg, profile || {})
      setMessages(prev => [...prev, { role: 'assistant', content: text }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}. Please try again or check that the AI service is configured.`,
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleCopy(text, idx) {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={`flex flex-col ${standalone ? 'h-[calc(100vh-4rem)] max-w-4xl mx-auto' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h2 className="font-semibold">AI Assistant</h2>
            <p className="text-xs text-slate-400">Powered by Gemini 2.0 Flash</p>
          </div>
        </div>
        {!standalone && (
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Agent selector */}
      <div className="px-4 py-3 border-b border-slate-700">
        <AgentSelector selected={agentType} onSelect={setAgentType} />
      </div>

      {/* API Key Setup */}
      {!hasKey && (
        <div className="px-4 py-3">
          <ApiKeySetup />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === 'user'
                ? 'bg-slate-700'
                : 'bg-gradient-to-br from-emerald-400 to-cyan-400'
            }`}>
              {msg.role === 'user' ? (
                <span className="text-xs font-bold text-white">{userInitial}</span>
              ) : (
                <Bot className="w-4 h-4 text-slate-900" />
              )}
            </div>
            <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block text-left rounded-xl px-4 py-3 max-w-full ${
                msg.role === 'user'
                  ? 'bg-emerald-500/20 text-emerald-100'
                  : msg.isError
                  ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
                {msg.role === 'assistant' && !msg.isError && (
                  <button
                    onClick={() => handleCopy(msg.content, i)}
                    className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {copied === i ? (
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
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <Bot className="w-4 h-4 text-slate-900" />
            </div>
            <div className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={hasKey ? `Ask ${agentType.replace('-', ' ')}...` : 'Enter API key above to start'}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 pr-12"
              disabled={loading || !hasKey}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim() || !hasKey}
            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2 text-center">
          AI-generated responses may need review. Always verify job details before applying.
        </p>
      </div>
    </div>
  )
}
