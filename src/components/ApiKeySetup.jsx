import { useState } from 'react'
import { Key, ExternalLink, Check, Save } from 'lucide-react'
import { getApiKey, setApiKey } from '../lib/ai'

export default function ApiKeySetup() {
  const [key, setKey] = useState(getApiKey())
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setApiKey(key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Key className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-400">Gemini API Key Required</h3>
          <p className="text-sm text-slate-400">
            Enter your free API key to enable the AI. Keys are stored locally on your device.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 pr-12"
          />
          {saved && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-3 bg-amber-500 hover:bg-amber-600 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <a
          href="https://ai.google.dev/gemini-api/docs/api-key"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-amber-400 hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Get a free API key at ai.google.dev
        </a>
      </div>
    </div>
  )
}
