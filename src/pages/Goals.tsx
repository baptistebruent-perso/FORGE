import { useState } from 'react'
import { Target, Trophy, Plus, Trash2 } from 'lucide-react'
import { Screen } from '../components/layout/Screen'
import { PageHeader } from '../components/layout/PageHeader'
import { Button, Card, Input, Modal } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useGoals } from '../hooks/useGoals'
import type { Database } from '../types/database'

type Goal = Database['public']['Tables']['goals']['Row']

const GOAL_TYPES = [
  { id: 'pr', label: '🏋️ PR exercice', unit: 'kg' },
  { id: 'bodyweight', label: '⚖️ Poids de corps', unit: 'kg' },
  { id: 'measurement', label: '📏 Mensuration', unit: 'cm' },
  { id: 'frequency', label: '📅 Fréquence', unit: 'séances/semaine' },
  { id: 'custom', label: '🎯 Personnalisé', unit: '' },
] as const

type GoalType = (typeof GOAL_TYPES)[number]['id']

function GoalProgress({ goal }: { goal: Goal }) {
  const current = goal.current_value ?? 0
  const target = goal.target_value ?? 1
  const pct = Math.min(100, Math.round((current / target) * 100))

  const typeLabel = GOAL_TYPES.find((t) => t.id === goal.type)?.label ?? goal.type

  return (
    <div>
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="text-text font-bold text-sm">{goal.title}</p>
          <p className="text-muted text-xs">{typeLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-accent font-black text-lg">
            {current}<span className="text-muted text-xs font-normal">/{target}</span>
          </p>
          {goal.unit && <p className="text-muted text-xs">{goal.unit}</p>}
        </div>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {goal.deadline && (
        <p className="text-muted text-xs mt-1">
          Échéance : {new Date(goal.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}

function CreateGoalModal({
  open, onClose, onSave
}: {
  open: boolean
  onClose: () => void
  onSave: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => Promise<void>
}) {
  const [type, setType] = useState<GoalType>('pr')
  const [title, setTitle] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [unit, setUnit] = useState('')
  const [exerciseName, setExerciseName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedType = GOAL_TYPES.find((t) => t.id === type)!

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        type,
        target_value: targetValue ? parseFloat(targetValue) : null,
        current_value: currentValue ? parseFloat(currentValue) : null,
        unit: unit || selectedType.unit || null,
        exercise_name: exerciseName || null,
        deadline: deadline || null,
        status: 'active',
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvel objectif">
      <div className="flex flex-col gap-4">
        {/* Type selector */}
        <div className="flex flex-col gap-2">
          {GOAL_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`py-2.5 px-4 rounded-card border text-sm font-semibold text-left transition-colors ${
                type === t.id ? 'border-accent bg-accent/10 text-text' : 'border-border text-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          <label className="text-muted text-xs block mb-1">Titre</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Squatter 100kg" />
        </div>

        {type === 'pr' && (
          <div>
            <label className="text-muted text-xs block mb-1">Exercice</label>
            <Input value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} placeholder="Squat" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-muted text-xs block mb-1">Valeur cible</label>
            <Input type="number" inputMode="decimal" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="100" />
          </div>
          <div>
            <label className="text-muted text-xs block mb-1">Valeur actuelle</label>
            <Input type="number" inputMode="decimal" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="80" />
          </div>
        </div>

        {type === 'custom' && (
          <div>
            <label className="text-muted text-xs block mb-1">Unité</label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, reps..." />
          </div>
        )}

        <div>
          <label className="text-muted text-xs block mb-1">Échéance (optionnel)</label>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>

        <Button size="lg" onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? '...' : 'Créer l\'objectif'}
        </Button>
      </div>
    </Modal>
  )
}

export default function Goals() {
  const { activeGoals, achievedGoals, loading, createGoal, updateGoal, deleteGoal } = useGoals()
  const [createOpen, setCreateOpen] = useState(false)
  const { add } = useToast()

  const handleCreate = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
    const error = await createGoal(goal)
    if (error) add(error.message, 'error')
    else add('Objectif créé !', 'success')
  }

  const handleDelete = async (id: string) => {
    const error = await deleteGoal(id)
    if (error) add(error.message, 'error')
  }

  const handleMarkAchieved = async (id: string) => {
    const error = await updateGoal(id, { status: 'achieved' })
    if (error) add(error.message, 'error')
    else add('🏆 Objectif atteint !', 'success')
  }

  return (
    <Screen>
      <PageHeader
        title="Objectifs"
        subtitle={`${activeGoals.length} actif${activeGoals.length !== 1 ? 's' : ''}`}
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
          </Button>
        }
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-surface rounded-card animate-pulse" />)}
        </div>
      ) : activeGoals.length === 0 ? (
        <div className="text-center py-16">
          <Target size={40} className="text-muted mx-auto mb-4" />
          <p className="text-muted mb-4">Aucun objectif actif.</p>
          <Button onClick={() => setCreateOpen(true)}>+ Créer un objectif</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {activeGoals.map((goal) => (
            <Card key={goal.id}>
              <GoalProgress goal={goal} />
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button variant="secondary" size="sm" onClick={() => handleMarkAchieved(goal.id)}>
                  ✓ Atteint
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(goal.id)} className="hover:text-error ml-auto">
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Achievements */}
      {achievedGoals.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-accent-orange" />
            <p className="text-text font-bold text-sm">Achievements ({achievedGoals.length})</p>
          </div>
          <div className="flex flex-col gap-2">
            {achievedGoals.map((goal) => (
              <div key={goal.id} className="bg-accent-orange/5 border border-accent-orange/20 rounded-card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-text font-semibold text-sm">{goal.title}</p>
                  {goal.target_value && (
                    <p className="text-muted text-xs">{goal.target_value} {goal.unit}</p>
                  )}
                </div>
                <span className="text-accent-orange text-lg">🏆</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateGoalModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
    </Screen>
  )
}
