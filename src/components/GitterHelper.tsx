/**
 * GitterHelper.tsx
 *
 * Two modes, both $0 for DevFlow Academy, always:
 *
 * - "Gitter Lite" (default): answers come from a local, built-in Git
 *   knowledge base (src/lib/gitterLite.ts). No key, no signup, no
 *   network call, no cost — works for every logged-in user immediately.
 *
 * - "Gitter AI" (optional, opt-in): real conversational AI, powered by
 *   the user's own API key from Google Gemini, Groq, or Anthropic. The
 *   key is stored only in the user's browser (localStorage) and sent
 *   straight through our serverless proxy (/api/gitter) to the chosen
 *   provider. DevFlow Academy never holds or pays for any AI key — all
 *   usage cost and rate limits belong to the user's own account with
 *   that provider. Note: unlike Gemini/Groq, Anthropic isn't free
 *   forever — new accounts get a small trial credit, then need a
 *   payment method on file for ongoing use (see PROVIDER_INFO below).
 *
 * Storage keys (API_KEY_STORAGE / PROVIDER_STORAGE) live in
 * lib/gitterKeys.ts so ReviewModal.tsx and CurriculumPanel.tsx can read
 * the same "has this learner activated Gitter AI?" state without
 * duplicating the storage logic.
 *
 * Other retained features:
 * - Proactive suggestions when a module is completed
 * - Completion badge on the toggle button
 * - Mobile keyboard fix using visualViewport
 * - Typing indicator, avatar messages, greeting by name
 * - Login gate, 340px width cap
 * - Chat history persists to sessionStorage, cleared on logout
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Bot, ChevronDown, MessageCircle, Send, Sparkles, Star, KeyRound, Zap, ChevronRight, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { answerWithGitterLite } from '../lib/gitterLite'
import {
  GITTER_API_KEY_STORAGE as API_KEY_STORAGE,
  GITTER_PROVIDER_STORAGE as PROVIDER_STORAGE,
  type AiProvider,
} from '../lib/gitterKeys'

const QUICK_PROMPTS = [
  'What should I learn next?',
  'Explain merge conflicts',
  'How do I use GitHub for my career?',
]

const CHAT_STORAGE = 'devflow_gitter_messages'

const PROVIDER_INFO: Record<AiProvider, { name: string; url: string; host: string; steps: string[] }> = {
  gemini: {
    name: 'Google Gemini',
    url: 'https://aistudio.google.com/apikey',
    host: 'aistudio.google.com/apikey',
    steps: [
      'Go to aistudio.google.com/apikey and log in with any Google account.',
      'Click "Create API key" — no credit card required.',
      'Copy the key and paste it below.',
    ],
  },
  groq: {
    name: 'Groq',
    url: 'https://console.groq.com/keys',
    host: 'console.groq.com/keys',
    steps: [
      'Go to console.groq.com/keys and sign up with an email — no card needed.',
      'Click "Create API Key."',
      'Copy the key and paste it below.',
    ],
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    url: 'https://console.anthropic.com/settings/keys',
    host: 'console.anthropic.com',
    steps: [
      'Go to console.anthropic.com and create an account.',
      "New accounts get a small amount of free trial credit — after that, ongoing use needs a payment method on file (unlike Gemini/Groq, this one isn't free forever).",
      'Go to Settings → API Keys → Create Key, copy it, and paste it below.',
    ],
  },
}

interface Message {
  role: 'gitter' | 'user'
  text: string
}

function loadStoredMessages(): Message[] {
  try {
    const saved = sessionStorage.getItem(CHAT_STORAGE)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export default function GitterHelper() {
  const { rolePath, completedModules, modules, githubProfile, weeklyChallenge } = useApp()
  const { isLoggedIn, user } = useAuth()

  const [isOpen, setIsOpen]           = useState(false)
  const [question, setQuestion]       = useState('')
  const [messages, setMessages]       = useState<Message[]>(loadStoredMessages)
  const [isTyping, setIsTyping]       = useState(false)
  // If we restored a conversation from a previous session, don't re-greet.
  const [hasGreeted, setHasGreeted]   = useState(() => loadStoredMessages().length > 0)
  const [panelHeight, setPanelHeight] = useState('72vh')
  const prevCompletedIdsRef           = useRef<string[]>(completedModules)
  const prevIsLoggedInRef             = useRef(isLoggedIn)
  const messagesEndRef                = useRef<HTMLDivElement>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)

  // ---- AI mode state (optional, BYOK) ----
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE) || '')
  const [provider, setProvider] = useState<AiProvider>(
    () => (localStorage.getItem(PROVIDER_STORAGE) as AiProvider) || 'gemini'
  )
  const isAiMode = !!apiKey

  const [showKeySettings, setShowKeySettings] = useState(false)
  const [setupProvider, setSetupProvider] = useState<AiProvider>('gemini')
  const [keyInput, setKeyInput] = useState('')
  const [keyError, setKeyError] = useState('')

  const nextModule = useMemo(() =>
    modules.find(m => !completedModules.includes(m.id)) || modules[0],
    [completedModules, modules]
  )

  const helperTip = githubProfile
    ? `This week: solve "${weeklyChallenge.title}" and add proof to @${githubProfile.username}.`
    : `This week: solve "${weeklyChallenge.title}". Connect GitHub to make it career proof.`

  // Adjust panel height when mobile keyboard opens/closes
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {