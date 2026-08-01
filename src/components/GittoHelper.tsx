/**
 * ============================================================================
 * GittoHelper.tsx
 * ============================================================================
 *
 * Gitto 🐙 — a second, admin-focused helper alongside Gitter. Where Gitter
 * teaches Git/GitHub and requires login, Gitto answers account/settings
 * questions (theme, GitHub linking, verification, privacy) and is
 * available to guests too, since most of that applies before you even
 * have an account.
 *
 * Deliberately simpler than GitterHelper: no BYOK AI mode, just the fixed
 * knowledge base in lib/gittoLite.ts — these are admin FAQs, not
 * open-ended conversation, so a real AI model isn't needed here.
 *
 * Positioned bottom-left (teal accent) so it never collides with Gitter,
 * which stays bottom-right (rose-punch).
 * ============================================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronDown, MessageCircleQuestion, Send, Trash2 } from 'lucide-react'
import { answerWithGittoLite } from '../lib/gittoLite'

const QUICK_PROMPTS = [
  'How do I change the theme?',
  'How do I reset my password?',
  'How do I connect GitHub?',
]

const CHAT_STORAGE = 'devflow_gitto_messages'
const GITTO_TEAL = '#2FB8C6'

interface Message {
  role: 'gitto' | 'user'
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

export default function GittoHelper() {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>(loadStoredMessages)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE, JSON.stringify(messages))
    } catch {
      // sessionStorage may be unavailable in some private-browsing edge cases —
      // chat still works within the tab, it just won't persist.
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages([{
          role: 'gitto',
          text: "Hey! I'm Gitto 🐙 — ask me about account settings, themes, GitHub linking, or privacy. For Git questions, Gitter's your friend over on the right.",
        }])
      }, 700)
    }
  }, [isOpen, messages.length])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150)
  }, [isOpen])

  const clearChat = () => {
    setMessages([])
    try { sessionStorage.removeItem(CHAT_STORAGE) } catch { /* noop */ }
  }

  const sendMessage = useCallback((prompt = question) => {
    const cleaned = prompt.trim()
    if (!cleaned || isTyping) return

    setMessages(prev => [...prev, { role: 'user', text: cleaned }])
    setQuestion('')
    setIsTyping(true)

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'gitto', text: answerWithGittoLite(cleaned) }])
      setIsTyping(false)
    }, 450)
  }, [question, isTyping])

  return (
    <div className="fixed bottom-4 left-4 z-[140]" style={{ width: 'min(calc(100vw - 2rem), 320px)' }}>

      {isOpen && (
        <div className="mb-3 overflow-hidden bg-[#4A2F2F] card-shadow card-outline flex flex-col"
          style={{ borderRadius: 8, maxHeight: '65vh' }}>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                style={{ backgroundColor: `${GITTO_TEAL}30` }}>
                🐙
              </div>
              <div>
                <p className="font-display text-base font-bold text-white leading-tight">Gitto</p>
                <p className="text-[10px] text-white/45 font-accent uppercase tracking-wider">Admin &amp; settings help</p>
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
              <button onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Collapse Gitto">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'gitto' && (
                  <div className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                    style={{ backgroundColor: `${GITTO_TEAL}30` }}>
                    🐙
                  </div>
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
                <div className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                  style={{ backgroundColor: `${GITTO_TEAL}30` }}>
                  🐙
                </div>
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
              placeholder="Ask Gitto…"
              disabled={isTyping}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2
                text-sm text-white placeholder-white/35 outline-none
                focus:outline-none disabled:opacity-50 transition-colors"
              style={{ borderColor: undefined }}
              onFocus={e => { e.currentTarget.style.borderColor = `${GITTO_TEAL}99` }}
              onBlur={e => { e.currentTarget.style.borderColor = '' }}
            />
            <button onClick={() => sendMessage()} disabled={isTyping || !question.trim()}
              className="rounded-xl px-3 text-white disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: GITTO_TEAL }}
              aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-3 font-display font-semibold text-white card-shadow
          transition-transform hover:scale-105 active:scale-95"
        style={{ borderRadius: 8, backgroundColor: GITTO_TEAL }}>
        {isOpen ? <MessageCircleQuestion className="h-5 w-5" /> : <span className="text-lg leading-none">🐙</span>}
        Gitto
      </button>
    </div>
  )
}