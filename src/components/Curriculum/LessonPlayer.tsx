/**
 * LessonPlayer.tsx
 *
 * Plays ONE short snippet of a longer YouTube video, using YouTube's own
 * start/end embed params — no custom video processing needed, and it
 * still counts as watching the original creator's video (their view
 * count, their ad revenue, same as the old full-video embed).
 *
 * `end` on the YouTube iframe API stops playback at that timestamp, but
 * doesn't disable seeking past it — good enough for a short, low-stakes
 * snippet. If someone scrubs ahead, the quiz still gates progress.
 */
import { useState } from 'react'
import { Clock, ArrowRight } from 'lucide-react'
import type { Lesson } from '../../content/lessons'

interface Props {
  lesson: Lesson
  onContinue: () => void
}

export default function LessonPlayer({ lesson, onContinue }: Props) {
  const [hasWatched, setHasWatched] = useState(false)

  if (!lesson.youtubeId || lesson.startSeconds == null || lesson.endSeconds == null) return null

  const snippetLength = Math.round((lesson.endSeconds - lesson.startSeconds) / 60 * 10) / 10
  const embedUrl = `https://www.youtube.com/embed/${lesson.youtubeId}?rel=0&start=${lesson.startSeconds}&end=${lesson.endSeconds}`

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider bg-[#F7B731] text-[#2A2A2A]">
          Snippet
        </span>
        <span className="flex items-center gap-1 text-white/40 text-xs">
          <Clock className="w-3 h-3" /> ~{snippetLength} min
        </span>
      </div>

      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black mb-4">
        <iframe
          src={embedUrl}
          title={lesson.title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setHasWatched(true)}
        />
      </div>

      <h4 className="font-display font-bold text-white text-xl mb-2">{lesson.title}</h4>
      <p className="text-white/60 text-sm mb-5">
        This is a short clip from a longer lesson — just the part covering this idea. Watch it, then answer a
        couple of quick questions.
      </p>

      <button
        onClick={onContinue}
        disabled={!hasWatched}
        className="flex items-center gap-2 bg-rose-punch text-white font-display font-semibold px-5 py-2.5 rounded-xl
          hover:bg-[#ff3d5d] disabled:opacity-50 transition-all"
      >
        Continue to quiz <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
