import { useState } from 'react'
import { Screen } from '../components/layout/Screen'
import { PageHeader } from '../components/layout/PageHeader'
import { Button, Card, Input, Textarea, Modal, Tabs } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { OneRMChart, WeeklyVolumeChart } from '../components/progress/PerformanceChart'
import { BodyChart } from '../components/progress/BodyChart'
import { usePerformanceData } from '../hooks/usePerformanceData'
import { useBodyMetrics } from '../hooks/useBodyMetrics'

const TABS = [
  { id: 'performance', label: 'Performance' },
  { id: 'body', label: 'Corps' },
  { id: 'photos', label: 'Photos' },
]

// ---- Performance Tab ----
function PerformanceTab() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const { dataPoints, prs, weeklyVolume, exerciseNames, loading } = usePerformanceData(selectedExercise)

  return (
    <div>
      {/* Exercise selector */}
      <div className="mb-4">
        <label className="text-muted text-xs font-semibold block mb-2">EXERCICE</label>
        <select
          value={selectedExercise ?? ''}
          onChange={(e) => setSelectedExercise(e.target.value || null)}
          className="w-full bg-surface border border-border rounded-card px-4 py-3 text-text focus:outline-none focus:border-accent"
        >
          <option value="">Sélectionner un exercice…</option>
          {exerciseNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {selectedExercise && (
        <>
          {/* 1RM chart */}
          <Card className="mb-4">
            <p className="text-muted text-xs font-semibold mb-3">1RM ESTIMÉ (kg)</p>
            {loading ? (
              <div className="h-48 bg-bg rounded animate-pulse" />
            ) : (
              <OneRMChart data={dataPoints} />
            )}
          </Card>

          {/* PRs */}
          <Card className="mb-4">
            <p className="text-muted text-xs font-semibold mb-3">RECORDS PERSONNELS</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-black text-accent">{prs.maxWeight || '—'}</p>
                <p className="text-muted text-xs">kg max</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-accent">{prs.maxReps || '—'}</p>
                <p className="text-muted text-xs">reps max</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-accent">{prs.max1RM ? Math.round(prs.max1RM) : '—'}</p>
                <p className="text-muted text-xs">1RM est.</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Weekly volume */}
      <Card>
        <p className="text-muted text-xs font-semibold mb-3">VOLUME HEBDOMADAIRE (kg)</p>
        <WeeklyVolumeChart data={weeklyVolume} />
      </Card>
    </div>
  )
}

// ---- Body metrics form modal ----
function BodyMetricModal({
  open, onClose, onSave
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Record<string, number | string | null>) => Promise<void>
}) {
  const fields = [
    { key: 'weight_kg', label: 'Poids (kg)', step: '0.1' },
    { key: 'body_fat_pct', label: 'Graisse corporelle (%)', step: '0.1' },
    { key: 'chest_cm', label: 'Poitrine (cm)', step: '0.5' },
    { key: 'waist_cm', label: 'Tour de taille (cm)', step: '0.5' },
    { key: 'hips_cm', label: 'Hanches (cm)', step: '0.5' },
    { key: 'arm_cm', label: 'Bras (cm)', step: '0.5' },
    { key: 'thigh_cm', label: 'Cuisse (cm)', step: '0.5' },
    { key: 'calf_cm', label: 'Mollet (cm)', step: '0.5' },
  ]
  const [values, setValues] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const parsed: Record<string, number | string | null> = {
        measured_at: new Date().toISOString().split('T')[0],
        notes: notes || null,
      }
      for (const f of fields) {
        parsed[f.key] = values[f.key] ? parseFloat(values[f.key]) : null
      }
      await onSave(parsed)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle mesure">
      <div className="flex flex-col gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-muted text-xs block mb-1">{f.label}</label>
            <Input
              type="number"
              inputMode="decimal"
              step={f.step}
              value={values[f.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder="—"
            />
          </div>
        ))}
        <div>
          <label className="text-muted text-xs block mb-1">Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? '...' : 'Enregistrer'}
        </Button>
      </div>
    </Modal>
  )
}

// ---- Body Tab ----
function BodyTab() {
  const { metrics, loading, addMetric } = useBodyMetrics()
  const [modalOpen, setModalOpen] = useState(false)
  const { add } = useToast()

  const handleSave = async (data: Record<string, number | string | null>) => {
    const error = await addMetric(data as any)
    if (error) add(error.message, 'error')
    else add('Mesures enregistrées', 'success')
  }

  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null

  return (
    <div>
      {latest && (
        <Card className="mb-4">
          <p className="text-muted text-xs font-semibold mb-3">DERNIÈRE MESURE</p>
          <div className="grid grid-cols-2 gap-2">
            {latest.weight_kg && (
              <div>
                <p className="text-2xl font-black text-text">{latest.weight_kg} <span className="text-muted text-sm font-normal">kg</span></p>
                <p className="text-muted text-xs">Poids</p>
              </div>
            )}
            {latest.body_fat_pct && (
              <div>
                <p className="text-2xl font-black text-text">{latest.body_fat_pct}<span className="text-muted text-sm font-normal">%</span></p>
                <p className="text-muted text-xs">Graisse</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="h-64 bg-surface rounded-card animate-pulse" />
      ) : (
        <Card className="mb-4">
          <p className="text-muted text-xs font-semibold mb-3">ÉVOLUTION</p>
          <BodyChart data={metrics} />
        </Card>
      )}

      <Button size="lg" onClick={() => setModalOpen(true)}>
        + Nouvelle mesure
      </Button>

      <BodyMetricModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  )
}

// ---- Photos Tab (stub — full implementation in Task 7.3) ----
function PhotosTab() {
  return (
    <div className="text-center py-16">
      <p className="text-muted">Photos de progression</p>
      <p className="text-muted text-sm mt-1">Disponible prochainement</p>
    </div>
  )
}

// ---- Main Progress Page ----
export default function Progress() {
  const [activeTab, setActiveTab] = useState('performance')

  return (
    <Screen>
      <PageHeader title="Progression" />
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} className="mb-6" />
      {activeTab === 'performance' && <PerformanceTab />}
      {activeTab === 'body' && <BodyTab />}
      {activeTab === 'photos' && <PhotosTab />}
    </Screen>
  )
}
