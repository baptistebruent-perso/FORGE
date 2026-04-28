import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronDown, ChevronUp, Play, Pencil, Trash2 } from 'lucide-react'
import { Screen } from '../components/layout/Screen'
import { PageHeader } from '../components/layout/PageHeader'
import { Button, Card, Input, Textarea, Modal } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useWorkouts, type WorkoutWithExercises } from '../hooks/useWorkouts'
import type { Database } from '../types/database'

type Exercise = Database['public']['Tables']['exercises_template']['Row']

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ---- Workout Form Modal ----
interface WorkoutFormData {
  name: string
  dayOfWeek: string // '' for flexible
}

function WorkoutModal({
  open,
  onClose,
  initial,
  onSubmit,
  title,
}: {
  open: boolean
  onClose: () => void
  initial?: WorkoutFormData
  onSubmit: (data: WorkoutFormData) => Promise<void>
  title: string
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [day, setDay] = useState(initial?.dayOfWeek ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({ name, dayOfWeek: day })
      onClose()
    } catch {
      // error handling is done by the parent via useToast
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-muted text-sm mb-1 block">Nom de la séance</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push, Pull, Legs..."
            required
            autoFocus
          />
        </div>
        <div>
          <label className="text-muted text-sm mb-1 block">Jour (optionnel)</label>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setDay('')}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${day === '' ? 'bg-accent text-bg' : 'bg-surface border border-border text-muted'}`}
            >
              Flexible
            </button>
            {DAY_NAMES.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDay(String(i))}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${day === String(i) ? 'bg-accent text-bg' : 'bg-surface border border-border text-muted'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" size="lg" disabled={saving || !name.trim()}>
          {saving ? '...' : 'Enregistrer'}
        </Button>
      </form>
    </Modal>
  )
}

// ---- Exercise Form Modal ----
interface ExerciseFormData {
  name: string
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  target_rest_seconds: number
  rest_after_exercise_seconds: number
  notes: string
}

function ExerciseModal({
  open,
  onClose,
  initial,
  onSubmit,
  title,
}: {
  open: boolean
  onClose: () => void
  initial?: Partial<ExerciseFormData>
  onSubmit: (data: ExerciseFormData) => Promise<void>
  title: string
}) {
  const [form, setForm] = useState<ExerciseFormData>({
    name: initial?.name ?? '',
    target_sets: initial?.target_sets ?? 3,
    target_reps_min: initial?.target_reps_min ?? 8,
    target_reps_max: initial?.target_reps_max ?? 12,
    target_rest_seconds: initial?.target_rest_seconds ?? 90,
    rest_after_exercise_seconds: initial?.rest_after_exercise_seconds ?? 120,
    notes: initial?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const num = (field: keyof ExerciseFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: Number(e.target.value) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } catch {
      // error handling is done by the parent via useToast
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-muted text-sm mb-1 block">Nom de l'exercice</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Développé couché..."
            required
            autoFocus
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-muted text-xs mb-1 block">Séries</label>
            <Input type="number" value={form.target_sets} onChange={num('target_sets')} min={1} max={10} inputMode="numeric" />
          </div>
          <div>
            <label className="text-muted text-xs mb-1 block">Reps min</label>
            <Input type="number" value={form.target_reps_min} onChange={num('target_reps_min')} min={1} max={50} inputMode="numeric" />
          </div>
          <div>
            <label className="text-muted text-xs mb-1 block">Reps max</label>
            <Input type="number" value={form.target_reps_max} onChange={num('target_reps_max')} min={1} max={50} inputMode="numeric" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-muted text-xs mb-1 block">Repos (s)</label>
            <Input type="number" value={form.target_rest_seconds} onChange={num('target_rest_seconds')} min={0} max={600} inputMode="numeric" />
          </div>
          <div>
            <label className="text-muted text-xs mb-1 block">Repos exo (s)</label>
            <Input type="number" value={form.rest_after_exercise_seconds} onChange={num('rest_after_exercise_seconds')} min={0} max={600} inputMode="numeric" />
          </div>
        </div>
        <div>
          <label className="text-muted text-sm mb-1 block">Notes (optionnel)</label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Technique, conseils..."
            rows={2}
          />
        </div>
        {form.target_reps_min > form.target_reps_max && (
          <p className="text-error text-xs">Reps min doit être ≤ reps max</p>
        )}
        <Button type="submit" size="lg" disabled={saving || !form.name.trim() || form.target_reps_min > form.target_reps_max}>
          {saving ? '...' : 'Enregistrer'}
        </Button>
      </form>
    </Modal>
  )
}

// ---- Exercise item row ----
function ExerciseRow({
  exercise,
  onEdit,
  onDelete,
}: {
  exercise: Exercise
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-text font-semibold text-sm truncate">{exercise.name}</p>
        <p className="text-muted text-xs">
          {exercise.target_sets} × {exercise.target_reps_min}–{exercise.target_reps_max} · {exercise.target_rest_seconds}s
        </p>
      </div>
      <div className="flex gap-1 ml-2 shrink-0">
        <button type="button" onClick={onEdit} className="p-2 text-muted hover:text-text transition-colors">
          <Pencil size={14} />
        </button>
        <button type="button" onClick={onDelete} className="p-2 text-muted hover:text-error transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ---- Workout card ----
function WorkoutCard({
  workout,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onStart,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
}: {
  workout: WorkoutWithExercises
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onStart: () => void
  onAddExercise: () => void
  onEditExercise: (ex: Exercise) => void
  onDeleteExercise: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          {workout.day_of_week !== null && (
            <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              {DAY_NAMES[workout.day_of_week]}
            </span>
          )}
          <div className="text-left">
            <p className="text-text font-bold">{workout.name}</p>
            <p className="text-muted text-xs">{workout.exercises.length} exercice{workout.exercises.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          {/* Exercise list */}
          {workout.exercises.length > 0 ? (
            <div className="mb-3">
              {workout.exercises.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  onEdit={() => onEditExercise(ex)}
                  onDelete={() => onDeleteExercise(ex.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm mb-3">Aucun exercice. Ajoute-en un.</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="primary" size="sm" onClick={onStart} className="flex items-center gap-1.5">
              <Play size={14} /> Démarrer
            </Button>
            <Button variant="secondary" size="sm" onClick={onAddExercise}>
              + Exercice
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil size={14} />
            </Button>
            {confirmDelete ? (
              <div className="flex gap-1">
                <Button variant="danger" size="sm" onClick={() => { onDelete(); setConfirmDelete(false) }}>
                  Supprimer
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Annuler
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="hover:text-error">
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// ---- Main page ----
export default function Program() {
  const navigate = useNavigate()
  const { add } = useToast()
  const {
    workouts, loading,
    createWorkout, updateWorkout, deleteWorkout,
    createExercise, updateExercise, deleteExercise,
  } = useWorkouts()

  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Modals state
  const [createWorkoutOpen, setCreateWorkoutOpen] = useState(false)
  const [editWorkout, setEditWorkout] = useState<WorkoutWithExercises | null>(null)
  const [addExerciseWorkoutId, setAddExerciseWorkoutId] = useState<string | null>(null)
  const [editExercise, setEditExercise] = useState<Exercise | null>(null)

  const handleCreateWorkout = async ({ name, dayOfWeek }: { name: string; dayOfWeek: string }) => {
    const error = await createWorkout(name, dayOfWeek !== '' ? Number(dayOfWeek) : undefined)
    if (error) add(error.message, 'error')
  }

  const handleUpdateWorkout = async ({ name, dayOfWeek }: { name: string; dayOfWeek: string }) => {
    if (!editWorkout) return
    const error = await updateWorkout(editWorkout.id, {
      name,
      day_of_week: dayOfWeek !== '' ? Number(dayOfWeek) : null,
    })
    if (error) add(error.message, 'error')
  }

  const handleDeleteWorkout = async (id: string) => {
    const error = await deleteWorkout(id)
    if (error) add(error.message, 'error')
    if (expandedId === id) setExpandedId(null)
  }

  const handleAddExercise = async (data: {
    name: string; target_sets: number; target_reps_min: number; target_reps_max: number;
    target_rest_seconds: number; rest_after_exercise_seconds: number; notes: string
  }) => {
    if (!addExerciseWorkoutId) return
    const error = await createExercise(addExerciseWorkoutId, data)
    if (error) add(error.message, 'error')
  }

  const handleUpdateExercise = async (data: {
    name: string; target_sets: number; target_reps_min: number; target_reps_max: number;
    target_rest_seconds: number; rest_after_exercise_seconds: number; notes: string
  }) => {
    if (!editExercise) return
    const error = await updateExercise(editExercise.id, {
      name: data.name,
      target_sets: data.target_sets,
      target_reps_min: data.target_reps_min,
      target_reps_max: data.target_reps_max,
      target_rest_seconds: data.target_rest_seconds,
      rest_after_exercise_seconds: data.rest_after_exercise_seconds,
      notes: data.notes || null,
    })
    if (error) add(error.message, 'error')
  }

  const handleDeleteExercise = async (id: string) => {
    const error = await deleteExercise(id)
    if (error) add(error.message, 'error')
  }

  const handleStart = (workoutId: string) => {
    navigate(`/session/new?workoutId=${workoutId}`)
  }

  return (
    <Screen>
      <PageHeader
        title="Programme"
        subtitle={`${workouts.length} séance${workouts.length !== 1 ? 's' : ''}`}
        action={
          <Button size="sm" onClick={() => setCreateWorkoutOpen(true)}>
            <Plus size={16} />
          </Button>
        }
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface rounded-card animate-pulse" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted mb-4">Aucune séance. Crée ton programme.</p>
          <Button onClick={() => setCreateWorkoutOpen(true)}>+ Nouvelle séance</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              expanded={expandedId === workout.id}
              onToggle={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
              onEdit={() => setEditWorkout(workout)}
              onDelete={() => handleDeleteWorkout(workout.id)}
              onStart={() => handleStart(workout.id)}
              onAddExercise={() => setAddExerciseWorkoutId(workout.id)}
              onEditExercise={(ex) => setEditExercise(ex)}
              onDeleteExercise={handleDeleteExercise}
            />
          ))}
        </div>
      )}

      {/* Create workout modal */}
      <WorkoutModal
        open={createWorkoutOpen}
        onClose={() => setCreateWorkoutOpen(false)}
        onSubmit={handleCreateWorkout}
        title="Nouvelle séance"
      />

      {/* Edit workout modal */}
      <WorkoutModal
        key={editWorkout?.id ?? 'none'}
        open={!!editWorkout}
        onClose={() => setEditWorkout(null)}
        initial={editWorkout ? {
          name: editWorkout.name,
          dayOfWeek: editWorkout.day_of_week !== null ? String(editWorkout.day_of_week) : '',
        } : undefined}
        onSubmit={handleUpdateWorkout}
        title="Modifier la séance"
      />

      {/* Add exercise modal */}
      <ExerciseModal
        open={!!addExerciseWorkoutId}
        onClose={() => setAddExerciseWorkoutId(null)}
        onSubmit={handleAddExercise}
        title="Ajouter un exercice"
      />

      {/* Edit exercise modal */}
      <ExerciseModal
        key={editExercise?.id ?? 'none'}
        open={!!editExercise}
        onClose={() => setEditExercise(null)}
        initial={editExercise ? {
          name: editExercise.name,
          target_sets: editExercise.target_sets,
          target_reps_min: editExercise.target_reps_min,
          target_reps_max: editExercise.target_reps_max,
          target_rest_seconds: editExercise.target_rest_seconds,
          rest_after_exercise_seconds: editExercise.rest_after_exercise_seconds,
          notes: editExercise.notes ?? '',
        } : undefined}
        onSubmit={handleUpdateExercise}
        title="Modifier l'exercice"
      />
    </Screen>
  )
}
