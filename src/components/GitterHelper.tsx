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
 *   the user's own free API key from Google Gemini or Groq. The key is
 *   stored only in the user's browser (localStorage) and sent straight
 *   through our serverless proxy (/api/gitter) to the chosen provider.
 *   DevFlow Academy never holds or pays for any AI key — all usage cost
 *   and rate limits belong to the user's own account with that provider.
 *
 * Other retained features:
 * - Proactive suggestions when a module is completed
 * - Completion badge on the toggle button
 * - Mobile keyboard fix using visualViewport
 * - Typing indicator, avatar messages, greeting by name
 * - Login gate, 340px width cap
 *
 * FIXED: the proactive "you just finished X" message used to find the
 * finished module by array index into `modules` — but `modules` gets
 * re-sorted whenever `rolePath` changes, so after a role switch the
 * index could point at the wrong module. It now diffs `completedModules`
 * by id (the newly-added id is always the one that just finished,
 * regardless of how `modules` happens to be sorted).
 *
 * ADDED: chat history now persists to sessionStorage, so closing the
 * panel or reloading the tab doesn't wipe the conversation. It's
 * cleared automatically on logout (so the next person signing in on the
 * same tab doesn't see someone else's chat), and there's a small clear
 * button in the header for starting fresh manually.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Bot, ChevronDown, MessageCircle, Send, Sparkles, Star, KeyRound, Zap, ChevronRight, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { answerWithGitterLite } from '../lib/gitterLite'

const QUICK_PROMPTS = [
  'What should I learn next?',
  'Explain merge conflicts',
  'How do I use GitHub for my career?',
]

type AiProvider = 'gemini' | 'groq'

const API_KEY_STORAGE = 'devflow_gitter_api_key'
const PROVIDER_STORAGE = 'devflow_gitter_provider'
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
      const available = vv.height
      const total = window.innerHeight
      // If keyboard is open, available << total — shrink panel accordingly
      const kbOpen = available < total * 0.75
      setPanelHeight(kbOpen ? `${Math.max(available * 0.85, 320)}px` : '72vh')
    }
    vv.addEventListener('resize', update)
    return () => vv.removeEventListener('resize', update)
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Persist chat history so closing the panel or reloading doesn't wipe it.
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE, JSON.stringify(messages))
    } catch {
      // sessionStorage may be unavailable in some private-browsing edge
      // cases — the chat still works within the tab, it just won't persist.
    }
  }, [messages])

  // Clear this tab's chat on logout, so the next person signing in on the
  // same tab doesn't see the previous person's conversation.
  useEffect(() => {
    if (prevIsLoggedInRef.current && !isLoggedIn) {
      setMessages([])
      setHasGreeted(false)
      try { sessionStorage.removeItem(CHAT_STORAGE) } catch { /* noop */ }
    }
    prevIsLoggedInRef.current = isLoggedIn
  }, [isLoggedIn])

  // Greeting on first open — skipped if a persisted conversation already exists
  useEffect(() => {
    if (isOpen && isLoggedIn && user && !hasGreeted) {
      const firstName = user.name.split(' ')[0]
      setHasGreeted(true)
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages([{
          role: 'gitter',
          text: `Hey ${firstName}! I am Gitter, your Git guide. ${rolePath.helperTone} Ask me anything about Git, GitHub, or your dev career.`,
        }])
      }, 900)
    }
  }, [isOpen, isLoggedIn, user, hasGreeted, rolePath.helperTone])

  // Proactive message when user completes a module
  useEffect(() => {
    const prevIds = prevCompletedIdsRef.current
    const currIds = completedModules
    prevCompletedIdsRef.current = currIds

    if (currIds.length > prevIds.length && isLoggedIn && hasGreeted) {
      // Diff by id, not index — `modules` gets re-sorted whenever the role
      // path changes, so an index into it can point at the wrong module
      // after a role switch. The newly-added id in completedModules is
      // always the one that just finished, regardless of sort order.
      const newlyCompletedId = currIds.find(id => !prevIds.includes(id))
      const justFinished = modules.find(m => m.id === newlyCompletedId)
      const upNext = modules.find(m => !currIds.includes(m.id))

      const proactiveText = upNext
        ? `Nice work finishing "${justFinished?.title}"! 🎉 Up next: "${upNext.title}" — want a quick 30-second summary before you start?`
        : `You've finished all the modules! 🏆 That's a huge deal. Go leave your review to earn your certificate.`

      // Small delay so it doesn't fire instantly
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'gitter', text: proactiveText }])
        if (!isOpen) setIsOpen(true) // pop open if closed
      }, 1200)
    }
  }, [completedModules, isLoggedIn, hasGreeted, modules, isOpen])

  // Focus input on open
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, isLoggedIn])

  /** Save a newly entered API key and switch into AI mode. */
  const saveApiKey = () => {
    const trimmed = keyInput.trim()
    if (trimmed.length < 10) {
      setKeyError('That key looks too short — double check you copied the whole thing.')
      return
    }
    localStorage.setItem(API_KEY_STORAGE, trimmed)
    localStorage.setItem(PROVIDER_STORAGE, setupProvider)
    setApiKey(trimmed)
    setProvider(setupProvider)
    setKeyInput('')
    setKeyError('')
    setShowKeySettings(false)
    setMessages(prev => [...prev, {
      role: 'gitter',
      text: `AI mode connected via ${PROVIDER_INFO[setupProvider].name}! This uses your own free key, so there's no cost to DevFlow Academy or to you beyond that provider's free limits.`,
    }])
  }

  /** Remove the stored key and fall back to Gitter Lite. */
  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE)
    localStorage.removeItem(PROVIDER_STORAGE)
    setApiKey('')
    setMessages(prev => [...prev, {
      role: 'gitter',
      text: "Back to Gitter Lite — still free, still here, just working from my built-in Git knowledge instead of live AI.",
    }])
  }

  /** Clears the on-screen conversation and its persisted copy — a fresh start. */
  const clearChat = () => {
    setMessages([])
    setHasGreeted(false)
    try { sessionStorage.removeItem(CHAT_STORAGE) } catch { /* noop */ }
  }

  const sendMessage = useCallback(async (prompt = question) => {
    const cleaned = prompt.trim()
    if (!cleaned || isTyping) return

    const userMsg: Message = { role: 'user', text: cleaned }
    setMessages(prev => [...prev, userMsg])
    setQuestion('')
    setIsTyping(true)

    // ---- Gitter Lite: default, free forever, no network call at all ----
    if (!isAiMode) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'gitter', text: answerWithGitterLite(cleaned) }])
        setIsTyping(false)
      }, 500) // small delay so replies don't feel instant/robotic
      return
    }

    // ---- Gitter AI: user's own key, user's own provider, user's own cost ----
    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      }))
      const contextNote = `[Context: User is on the "${rolePath.label}" path. Next module: "${nextModule.title}". Completed ${completedModules.length}/${modules.length} modules.]`
      history[history.length - 1].content = `${contextNote}\n\n${history[history.length - 1].content}`

      const response = await fetch('/api/gitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, apiKey, provider }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'INVALID_API_KEY') {
          setMessages(prev => [...prev, {
            role: 'gitter',
            text: `Your ${PROVIDER_INFO[provider].name} key was rejected — switching back to Gitter Lite. Check the key in settings.`,
          }])
          clearApiKey()
        } else {
          setMessages(prev => [...prev, {
            role: 'gitter',
            text: data.message || data.error || 'Something went wrong reaching the AI provider — try again shortly.',
          }])
        }
        return
      }

      const raw: string = data.text ?? "I am having a moment — try again?"
      const reply = raw.trim() === 'UNRELATED_TOPIC'
        ? "That one is a bit outside my lane! I am best with Git workflows, GitHub, and dev career questions. Try something workflow-related."
        : raw

      setMessages(prev => [...prev, { role: 'gitter', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'gitter', text: "Lost my connection. Check your network and try again!" }])
    } finally {
      setIsTyping(false)
    }
  }, [question, isTyping, messages, rolePath.label, nextModule.title, completedModules.length, modules.length, isAiMode, apiKey, provider])

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="fixed bottom-4 right-4 z-[140]">
        <div className="flex items-center gap-2 bg-[#4A2F2F]/60 border border-white/10 px-4 py-3
          font-display font-semibold text-white/30 text-sm card-shadow select-none"
          style={{ borderRadius: 8 }} title="Sign in to chat with Gitter">
          <Bot className="h-5 w-5" /> Gitter
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-[140]" style={{ width: 'min(calc(100vw - 2rem), 340px)' }}>

      {isOpen && (
        <div className="mb-3 overflow-hidden bg-[#4A2F2F] card-shadow card-outline flex flex-col"
          style={{ borderRadius: 8, maxHeight: panelHeight }}>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <img src="/footer_cat.png" alt="Gitter"
                className="h-9 w-9 rounded-full bg-[#F7B731]/20 object-cover flex-shrink-0" />
              <div>
                <p className="font-display text-base font-bold text-white leading-tight">Gitter</p>
                <p className="text-[10px] text-white/45 font-accent uppercase tracking-wider">
                  {isAiMode ? `AI mode · ${PROVIDER_INFO[provider].name}` : 'Lite mode · free, no key'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Clear conversation"
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setShowKeySettings(v => !v)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="AI settings"
                title={isAiMode ? 'AI mode settings' : 'Upgrade to Gitter AI'}
              >
                <KeyRound className={`h-4 w-4 ${isAiMode ? 'text-[#3CCF4A]' : ''}`} />
              </button>
              <button onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Collapse Gitter">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* AI / key settings panel */}
          {showKeySettings && (
            <div className="flex-shrink-0 border-b border-white/10 bg-black/20 px-3 py-3 space-y-3">
              {isAiMode ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#3CCF4A]">
                    {PROVIDER_INFO[provider].name} connected ({apiKey.slice(0, 8)}…)
                  </span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={clearApiKey} className="text-xs text-white/50 hover:text-white underline">
                      Switch back to Lite
                    </button>
                    <button
                      onClick={() => setShowKeySettings(false)}
                      className="text-xs text-white/40 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-display font-semibold text-white text-sm">Get free AI chat</p>
                    <button
                      onClick={() => setShowKeySettings(false)}
                      className="text-white/40 hover:text-white transition-colors text-xs"
                    >
                      Close
                    </button>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Gitter Lite is free forever with no signup. If you'd like real conversational AI, add your own
                    free key from Gemini or Groq — it stays in your browser, and any usage cost is on your own
                    account, not ours.
                  </p>

                  {/* Provider tabs */}
                  <div className="flex gap-2">
                    {(['gemini', 'groq'] as AiProvider[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setSetupProvider(p)}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-display font-semibold transition-colors ${
                          setupProvider === p ? 'bg-[#F7B731] text-[#2A2A2A]' : 'bg-white/10 text-white/70 hover:bg-white/15'
                        }`}
                      >
                        {PROVIDER_INFO[p].name}
                      </button>
                    ))}
                  </div>

                  <ol className="list-decimal list-inside text-xs text-white/60 space-y-1">
                    {PROVIDER_INFO[setupProvider].steps.map((step, i) => (
                      <li key={i}>
                        {i === 0 ? (
                          <>
                            Go to{' '}
                            <a
                              href={PROVIDER_INFO[setupProvider].url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#F7B731] hover:underline"
                            >
                              {PROVIDER_INFO[setupProvider].host}
                            </a>{' '}
                            and{' '}
                            {setupProvider === 'gemini'
                              ? 'log in with any Google account.'
                              : 'sign up with an email — no card needed.'}
                          </>
                        ) : (
                          step
                        )}
                      </li>
                    ))}
                  </ol>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveApiKey() }}
                      placeholder="Paste your key here…"
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5
                        text-xs text-white placeholder-white/30 outline-none focus:border-[#F7B731]/60"
                    />
                    <button
                      onClick={saveApiKey}
                      className="rounded-lg bg-[#F7B731] px-3 py-1.5 text-xs font-display font-semibold text-[#2A2A2A] flex-shrink-0"
                    >
                      Save
                    </button>
                  </div>
                  {keyError && <p className="text-[#FF4D6D] text-xs">{keyError}</p>}
                </>
              )}
            </div>
          )}

          {/* Tip */}
          <div className="flex-shrink-0 border-b border-white/10 bg-[#F7B731]/10 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="h-3.5 w-3.5 text-[#F7B731]" />
              <span className="font-display font-semibold text-[#F7B731] text-xs">This week</span>
            </div>
            <p className="text-white/70 text-xs leading-snug">{helperTip}</p>
            {!isAiMode && !showKeySettings && (
              <button
                onClick={() => setShowKeySettings(true)}
                className="mt-1.5 flex items-center gap-1 text-[10px] text-[#F7B731]/80 hover:text-[#F7B731] transition-colors"
              >
                <Zap className="h-3 w-3" /> Want smarter answers? Add a free AI key <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'gitter' && (
                  <img src="/footer_cat.png" alt="Gitter"
                    className="h-6 w-6 rounded-full object-cover flex-shrink-0 bg-[#F7B731]/20" />
                )}
                <div className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-white/15 text-white rounded-2xl rounded-br-sm'
                    : 'bg-black/30 text-white/85 rounded-2xl rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-end">
                <img src="/footer_cat.png" alt="Gitter is typing"
                  className="h-6 w-6 rounded-full object-cover flex-shrink-0 bg-[#F7B731]/20" />
                <div className="bg-black/30 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 180, 360].map(delay => (
                    <span key={delay} className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
                      style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="flex-shrink-0 flex flex-wrap gap-1.5 border-t border-white/10 px-3 py-2.5">
            {QUICK_PROMPTS.map(prompt => (
              <button key={prompt} onClick={() => sendMessage(prompt)} disabled={isTyping}
                className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/65
                  hover:bg-white/18 disabled:opacity-40 transition-colors">
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 flex gap-2 border-t border-white/10 p-3">
            <input
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask Gitter…"
              disabled={isTyping}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2
                text-sm text-white placeholder-white/35 outline-none
                focus:border-[#F7B731]/60 disabled:opacity-50 transition-colors"
            />
            <button onClick={() => sendMessage()} disabled={isTyping || !question.trim()}
              className="rounded-xl bg-rose-punch px-3 text-white disabled:opacity-40 transition-opacity hover:bg-[#ff3d5d]"
              aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button — shows completed module count badge */}
      <div className="relative ml-auto w-fit">
        {completedModules.length > 0 && (
          <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#F7B731] flex items-center justify-center z-10 shadow">
            <span className="font-display font-bold text-[#2A2A2A] text-[10px]">{completedModules.length}</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(v => !v)}
          className="flex items-center gap-2 bg-rose-punch px-4 py-3
            font-display font-semibold text-white card-shadow
            transition-transform hover:scale-105 active:scale-95"
          style={{ borderRadius: 8 }}>
          {isOpen ? <Bot className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          Gitter
          {completedModules.length > 0 && <Star className="h-3.5 w-3.5 text-[#F7B731] fill-[#F7B731]" />}
        </button>
      </div>
    </div>
  )
}
