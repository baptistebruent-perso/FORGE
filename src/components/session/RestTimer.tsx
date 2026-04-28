import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCountdown } from '../../hooks/useTimer'
import { formatDuration } from '../../lib/time'

interface RestTimerProps {
  endsAt: number | null
  totalSeconds: number
  onComplete: () => void
  onDismiss: () => void
}

export function RestTimer({ endsAt, totalSeconds, onComplete, onDismiss }: RestTimerProps) {
  const remaining = useCountdown(endsAt, onComplete)
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0

  // Circle SVG parameters
  const size = 240
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-bg/95 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <p className="text-muted text-sm font-semibold mb-8 tracking-widest uppercase">Repos</p>

      {/* Circular progress */}
      <div className="relative mb-8">
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#222226" strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#B4FF39" strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-black text-text tabular-nums">{formatDuration(remaining)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm font-semibold"
      >
        <X size={16} /> Passer
      </button>
    </motion.div>
  )
}
