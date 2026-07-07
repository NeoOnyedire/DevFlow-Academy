/**
 * GitterHelper.tsx
 *
 * Changes:
 * - Proactive suggestions: when completedModules changes (user just finished
 *   a module), Gitter sends an unprompted "nice work + next step" message
 * - Completion badge: a small gold star badge appears on the toggle button
 *   counting total completed modules, so progress is always visible
 * - Mobile keyboard fix: panel uses window.visualViewport height when
 *   available so the input stays accessible when the keyboard is open
 * - API calls now go through /api/gitter (serverless proxy) instead of
 *   calling api.anthropic.com directly from the browser — keeps the API
 *   key server-side and lets requests actually authenticate
 * - All previous features retained: AI responses, typing indicator,
 *   avatar messages, greeting by name, login gate, 340px cap
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Bot, ChevronDown, MessageCircle, Send, Sparkles, Star } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const QUICK_PROMPTS = [
  'What should I learn next?',
  'Explain merge conflicts',
  'How do I use GitHub for my career?',
]

interface Message {
  role: 'gitter' | 'user'
  text: string
}

export default function GitterHelper() {
  const { rolePath, completedModules, modules, githubProfile, weeklyChallenge } = useApp()
  const { isLoggedIn, user } = useAuth()

  const [isOpen, setIsOpen]           = useState(false)
  const [question, setQuestion]       = useState('')
  const [messages, setMessages]       = useState<Message[]>([])
  const [isTyping, setIsTyping]       = useState(false)
  const [hasGreeted, setHasGreeted]   = useState(false)
  const [panelHeight, setPanelHeight] = useState('72vh')
  const prevCompletedCount            = useRef(completedModules.length)
  const messagesEndRef                = useRef<HTMLDivElement>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)

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

  // Greeting on first open
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
    const prev = prevCompletedCount.current
    const curr = completedModules.length
    prevCompletedCount.current = curr

    if (curr > prev && isLoggedIn && hasGreeted) {
      const justFinished = modules.find((_, i) => i === prev)
      const upNext = modules.find(m => !completedModules.includes(m.id))

      const proactiveText = upNext
        ? `Nice work finishing "${justFinished?.title}"! 🎉 Up next: "${upNext.title}" — want a quick 30-second summary before you start?`
        : `You've finished all the modules! 🏆 That's a huge deal. Go leave your review to earn your certificate.`

      // Small delay so it doesn't fire instantly
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'gitter', text: proactiveText }])
        if (!isOpen) setIsOpen(true) // pop open if closed
      }, 1200)
    }
  }, [completedModules.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input on open
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, isLoggedIn])

  const sendMessage = useCallback(async (prompt = question) => {
    const cleaned = prompt.trim()
    if (!cleaned || isTyping) return

    const userMsg: Message = { role: 'user', text: cleaned }
    setMessages(prev => [...prev, userMsg])
    setQuestion('')
    setIsTyping(true)

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      }))
      const contextNote = `[Context: User is on the "${rolePath.label}" path. Next module: "${nextModule.title}". Completed ${completedModules.length}/${modules.length} modules.]`
      history[history.length - 1].content = `${contextNote}\n\n${history[history.length - 1].content}`

      // Calls our own serverless proxy — the Anthropic key never touches the browser
      const response = await fetch('/api/gitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!response.ok) throw new Error('Request failed')

      const data = await response.json()
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
  }, [question, isTyping, messages, rolePath.label, nextModule.title, completedModules.length, modules.length])

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
                <p className="text-[10px] text-white/45 font-accent uppercase tracking-wider">{rolePath.label} mode</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Collapse Gitter">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Tip */}
          <div className="flex-shrink-0 border-b border-white/10 bg-[#F7B731]/10 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="h-3.5 w-3.5 text-[#F7B731]" />
              <span className="font-display font-semibold text-[#F7B731] text-xs">This week</span>
            </div>
            <p className="text-white/70 text-xs leading-snug">{helperTip}</p>
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