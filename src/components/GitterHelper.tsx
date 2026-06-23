/**
 * ============================================================================
 * GitterHelper.tsx
 * ============================================================================
 *
 * AI-powered chat helper using the Anthropic API.
 *
 * Features:
 * - Login-gated: guests see a greyed-out button, not the chat
 * - Greets the user by first name when the panel first opens
 * - Typing indicator (animated ellipsis bubble) while the AI responds
 * - Each Gitter reply shows the cat avatar alongside the message
 * - Unrelated questions get a gentle redirect back to Git/workflow topics
 * - Mobile width capped at 340px so it does not overwhelm small screens
 * ============================================================================
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, ChevronDown, MessageCircle, Send, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const QUICK_PROMPTS = [
  'What should I learn next?',
  'Explain merge conflicts',
  'How do I use GitHub for my career?',
]

const SYSTEM_PROMPT = `You are Gitter, a friendly and encouraging Git & GitHub learning assistant for DevFlow Academy. You help developers learn Git workflows, understand version control concepts, and build career confidence.

Your personality:
- Warm, encouraging, and practical — like a helpful senior dev on the team
- Concise: keep answers to 2-4 sentences unless a step-by-step is genuinely needed
- Use plain language, not jargon soup
- Occasionally use light humour but stay professional

Your scope:
- Git commands, workflows, branching strategies, merge conflicts, rebasing, PRs, CI/CD, GitHub features, career advice for developers, portfolio tips, interview prep for dev roles, general programming questions
- If someone asks about something completely unrelated to development, tech, or learning (e.g. cooking, sports, celebrity gossip), reply with ONLY this exact token: UNRELATED_TOPIC

Do not break character. Do not reveal you are Claude or made by Anthropic. You are Gitter.`

interface Message {
  role: 'gitter' | 'user'
  text: string
}

export default function GitterHelper() {
  const { rolePath, completedModules, modules, githubProfile, weeklyChallenge } = useApp()
  const { isLoggedIn, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const nextModule = useMemo(() => {
    return modules.find(m => !completedModules.includes(m.id)) || modules[0]
  }, [completedModules, modules])

  const helperTip = githubProfile
    ? `This week: solve "${weeklyChallenge.title}" and add proof to @${githubProfile.username}.`
    : `This week: solve "${weeklyChallenge.title}". Connect GitHub to make it career proof.`

  // Scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Greet by first name the first time the panel opens
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

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, isLoggedIn])

  const sendMessage = async (prompt = question) => {
    const cleaned = prompt.trim()
    if (!cleaned || isTyping) return

    const userMsg: Message = { role: 'user', text: cleaned }
    setMessages(prev => [...prev, userMsg])
    setQuestion('')
    setIsTyping(true)

    try {
      // Build conversation history for the API
      const history = [...messages, userMsg].map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))

      // Inject user context into the latest user turn
      const contextNote = `[Context: User is on the "${rolePath.label}" path. Next recommended module: "${nextModule.title}". Completed ${completedModules.length}/${modules.length} modules.]`
      history[history.length - 1].content = `${contextNote}\n\n${history[history.length - 1].content}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history,
        }),
      })

      const data = await response.json()
      const raw: string = data.content?.[0]?.text ?? "I am having a moment — try again?"

      const reply = raw.trim() === 'UNRELATED_TOPIC'
        ? "That one is a bit outside my lane! I am best with Git workflows, GitHub, and dev career questions. Try something workflow-related."
        : raw

      setMessages(prev => [...prev, { role: 'gitter', text: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'gitter',
        text: "Hmm, lost my connection. Check your network and try again!",
      }])
    } finally {
      setIsTyping(false)
    }
  }

  // ── Not logged in — show a disabled ghost button ──
  if (!isLoggedIn) {
    return (
      <div className="fixed bottom-4 right-4 z-[140]">
        <div
          className="flex items-center gap-2 bg-[#4A2F2F]/60 border border-white/10 px-4 py-3
            font-display font-semibold text-white/30 text-sm card-shadow select-none"
          style={{ borderRadius: 8 }}
          title="Sign in to chat with Gitter"
        >
          <Bot className="h-5 w-5" />
          Gitter
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-[140]" style={{ width: 'min(calc(100vw - 2rem), 340px)' }}>

      {/* ── Chat panel ── */}
      {isOpen && (
        <div
          className="mb-3 overflow-hidden bg-[#4A2F2F] card-shadow card-outline flex flex-col"
          style={{ borderRadius: 8, maxHeight: '72vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src="/footer_cat.png"
                alt="Gitter"
                className="h-9 w-9 rounded-full bg-[#F7B731]/20 object-cover flex-shrink-0"
              />
              <div>
                <p className="font-display text-base font-bold text-white leading-tight">Gitter</p>
                <p className="text-[10px] text-white/45 font-accent uppercase tracking-wider">{rolePath.label} mode</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Collapse Gitter"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Weekly tip strip */}
          <div className="flex-shrink-0 border-b border-white/10 bg-[#F7B731]/10 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="h-3.5 w-3.5 text-[#F7B731]" />
              <span className="font-display font-semibold text-[#F7B731] text-xs">This week</span>
            </div>
            <p className="text-white/70 text-xs leading-snug">{helperTip}</p>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Cat avatar — only on Gitter messages */}
                {msg.role === 'gitter' && (
                  <img
                    src="/footer_cat.png"
                    alt="Gitter"
                    className="h-6 w-6 rounded-full object-cover flex-shrink-0 bg-[#F7B731]/20"
                  />
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-white/15 text-white rounded-2xl rounded-br-sm'
                      : 'bg-black/30 text-white/85 rounded-2xl rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator — ellipsis bubble with avatar */}
            {isTyping && (
              <div className="flex gap-2 items-end">
                <img
                  src="/footer_cat.png"
                  alt="Gitter is typing"
                  className="h-6 w-6 rounded-full object-cover flex-shrink-0 bg-[#F7B731]/20"
                />
                <div className="bg-black/30 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
                    style={{ animationDelay: '0ms', animationDuration: '900ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
                    style={{ animationDelay: '180ms', animationDuration: '900ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
                    style={{ animationDelay: '360ms', animationDuration: '900ms' }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt chips */}
          <div className="flex-shrink-0 flex flex-wrap gap-1.5 border-t border-white/10 px-3 py-2.5">
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isTyping}
                className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/65
                  hover:bg-white/18 disabled:opacity-40 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input row */}
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
            <button
              onClick={() => sendMessage()}
              disabled={isTyping || !question.trim()}
              className="rounded-xl bg-rose-punch px-3 text-white
                disabled:opacity-40 transition-opacity hover:bg-[#ff3d5d]"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="ml-auto flex items-center gap-2 bg-rose-punch px-4 py-3
          font-display font-semibold text-white card-shadow
          transition-transform hover:scale-105 active:scale-95"
        style={{ borderRadius: 8 }}
      >
        {isOpen ? <Bot className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        Gitter
      </button>
    </div>
  )
}
