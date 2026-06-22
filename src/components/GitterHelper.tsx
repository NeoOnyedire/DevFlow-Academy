import { useMemo, useState } from 'react'
import { Bot, ChevronDown, MessageCircle, Send, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'

const QUICK_PROMPTS = [
  'What should I learn next?',
  'Explain merge conflicts',
  'How do I use GitHub for my career?',
]

function answerQuestion(question: string, roleLabel: string, nextModuleTitle: string) {
  const text = question.toLowerCase()

  if (text.includes('merge') || text.includes('conflict')) {
    return 'A merge conflict means Git needs a human decision. Open the conflicted file, choose the final lines, remove the conflict markers, then run git add and commit the resolution.'
  }

  if (text.includes('career') || text.includes('job') || text.includes('portfolio')) {
    return 'For Career Mode, make your GitHub profile show proof: clean commits, descriptive pull requests, and one public repo where you explain a real fix in the README.'
  }

  if (text.includes('next') || text.includes('learn')) {
    return `For your ${roleLabel} path, I would open "${nextModuleTitle}" next. It is the next strongest step for your current track.`
  }

  if (text.includes('github')) {
    return 'Connect your public GitHub username in Progress. I will use public profile signals like repos and followers as portfolio proof inside Career Mode.'
  }

  return 'Try turning the issue into a Git symptom: rejected push, detached HEAD, merge conflict, stash, or wrong branch. Then search it in Find Your Fix Fast.'
}

export default function GitterHelper() {
  const { rolePath, completedModules, modules, githubProfile, weeklyChallenge } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    `Hi, I am Gitter. ${rolePath.helperTone} Ask me for a Git hint, next lesson, or career proof idea.`,
  ])

  const nextModule = useMemo(() => {
    return modules.find(module => !completedModules.includes(module.id)) || modules[0]
  }, [completedModules, modules])

  const helperTip = githubProfile
    ? `This week: solve "${weeklyChallenge.title}" and add proof to @${githubProfile.username}.`
    : `This week: solve "${weeklyChallenge.title}". Connect GitHub to make it career proof.`

  const ask = (prompt = question) => {
    const cleaned = prompt.trim()
    if (!cleaned) return

    setMessages(prev => [
      ...prev,
      cleaned,
      answerQuestion(cleaned, rolePath.label, nextModule.title),
    ])
    setQuestion('')
  }

  return (
    <div className="fixed bottom-4 right-4 z-[140] w-[calc(100vw-2rem)] max-w-sm">
      {isOpen && (
        <div className="mb-3 overflow-hidden bg-[#4A2F2F] card-shadow card-outline" style={{ borderRadius: 8 }}>
          <div className="flex items-center justify-between border-b border-white/10 p-3">
            <div className="flex items-center gap-2">
              <img src="/footer_cat.png" alt="Gitter helper" className="h-10 w-10 rounded-full bg-[#F7B731]/20 object-cover" />
              <div>
                <p className="font-display text-lg font-bold text-white">Gitter Helper</p>
                <p className="text-xs text-white/45">{rolePath.label} mode</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Collapse helper">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-72 space-y-3 overflow-y-auto p-3">
            <div className="rounded-lg bg-[#F7B731]/15 p-3 text-sm text-white/80">
              <div className="mb-1 flex items-center gap-2 font-display font-semibold text-[#F7B731]">
                <Sparkles className="h-4 w-4" />
                Tip
              </div>
              {helperTip}
            </div>
            {messages.map((message, index) => {
              const isUser = index % 2 === 1
              return (
                <div
                  key={`${message}-${index}`}
                  className={`rounded-lg p-3 text-sm leading-relaxed ${isUser ? 'ml-8 bg-white/10 text-white' : 'mr-8 bg-black/20 text-white/75'}`}
                >
                  {message}
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/10 p-3">
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => ask(prompt)}
                className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/15"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={question}
              onChange={event => setQuestion(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') ask()
              }}
              placeholder="Ask Gitter..."
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/35 outline-none focus:border-[#F7B731]/60"
            />
            <button onClick={() => ask()} className="rounded-lg bg-rose-punch px-3 text-white" aria-label="Ask Gitter">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(current => !current)}
        className="ml-auto flex items-center gap-2 bg-rose-punch px-4 py-3 font-display font-semibold text-white card-shadow transition-transform hover:scale-105"
        style={{ borderRadius: 8 }}
      >
        {isOpen ? <Bot className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        Gitter
      </button>
    </div>
  )
}
