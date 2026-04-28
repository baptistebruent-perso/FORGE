import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, Dumbbell, Flame } from 'lucide-react'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { formatDurationHuman } from '../../lib/time'
import type { SetLog } from '../../stores/activeSessionStore'

interface PRInfo {
  exerciseName: string
  type: string
  value: number
}

interface SessionRecapProps {
  workoutName: string
  startedAt: string
  sets: SetLog[]
  prs: PRInfo[]
  onFinish: (mood: number, notes: string) => Promise<void>
}

export function SessionRecap({ workoutName, startedAt, sets, prs, onFinish }: SessionRecapProps) {
  const [mood, setMood] = useState(3)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const completedSets = sets.filter((s) => s.completed)
  const totalVolume = completedSets.reduce(
    (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0
  )
  const durationSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)

  const moodEmojis = ['😴', '😐', '💪', '🔥', '⚡']
  const moodLabels = ['Fatigué', 'Ok', 'Bien', 'Super', 'Exceptionnel']

  const handleFinish = async () => {
    setSaving(true)
    try {
      await onFinish(mood, notes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-bg overflow-y-auto"
      initial={{ y: '100%' }} animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="px-4 pt-8 pb-24">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏁</div>
          <h1 className="text-2xl font-black text-text">{workoutName}</h1>
          <p className="text-muted text-sm">Séance terminée !</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-surface border border-border rounded-card p-4 flex items-center gap-3">
            <Clock size={20} className="text-accent shrink-0" />
            <div>
              <p className="text-muted text-xs">Durée</p>
              <p className="text-text font-bold text-lg">{formatDurationHuman(durationSeconds)}</p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-card p-4 flex items-center gap-3">
            <Dumbbell size={20} className="text-accent shrink-0" />
            <div>
              <p className="text-muted text-xs">Volume</p>
              <p className="text-text font-bold text-lg">{Math.round(totalVolume).toLocaleString()} kg</p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-card p-4 flex items-center gap-3">
            <Flame size={20} className="text-accent shrink-0" />
            <div>
              <p className="text-muted text-xs">Séries</p>
              <p className="text-text font-bold text-lg">{completedSets.length}</p>
            </div>
          </div>
          {prs.length > 0 && (
            <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-card p-4 flex items-center gap-3">
              <Trophy size={20} className="text-accent-orange shrink-0" />
              <div>
                <p className="text-muted text-xs">PR battus</p>
                <p className="text-accent-orange font-bold text-lg">{prs.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* PR list */}
        {prs.length > 0 && (
          <div className="bg-surface border border-border rounded-card p-4 mb-6">
            <p className="text-accent-orange font-bold text-sm mb-3">🏆 Nouveaux records</p>
            {prs.map((pr, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-text text-sm font-semibold">{pr.exerciseName}</span>
                <span className="text-accent text-sm font-bold">
                  {pr.type === 'max_weight' ? `${pr.value}kg` :
                   pr.type === 'max_reps' ? `${pr.value} reps` :
                   `${pr.value}kg 1RM`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Mood selector */}
        <div className="mb-6">
          <p className="text-muted text-sm font-semibold mb-3">Comment tu te sens ?</p>
          <div className="flex gap-2 justify-between">
            {moodEmojis.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMood(i + 1)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-card border transition-all ${
                  mood === i + 1
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-surface'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs text-muted">{moodLabels[i]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8">
          <label className="text-muted text-sm font-semibold block mb-2">Notes (optionnel)</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ressenti, ajustements, objectifs..."
            rows={3}
          />
        </div>

        <Button size="lg" onClick={handleFinish} disabled={saving}>
          {saving ? 'Enregistrement...' : 'TERMINER LA SÉANCE'}
        </Button>
      </div>
    </motion.div>
  )
}
