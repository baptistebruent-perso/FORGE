import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../hooks/useSettings'
import { supabase } from '../lib/supabase'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-border'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-bg transition-transform ${value ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const { settings, update } = useSettings()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleExport = async () => {
    if (!user) return

    const userId = user.id

    const [workouts, sessions, session_sets, personal_records, body_metrics, goals] =
      await Promise.all([
        supabase.from('workouts').select('*').eq('user_id', userId),
        supabase.from('sessions').select('*').eq('user_id', userId),
        supabase.from('session_sets').select('*'),
        supabase.from('personal_records').select('*').eq('user_id', userId),
        supabase.from('body_metrics').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
      ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: { id: userId, email: user.email },
      workouts: workouts.data ?? [],
      sessions: sessions.data ?? [],
      session_sets: session_sets.data ?? [],
      personal_records: personal_records.data ?? [],
      body_metrics: body_metrics.data ?? [],
      goals: goals.data ?? [],
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().split('T')[0]
    a.href = url
    a.download = `forge-export-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Screen>
      <PageHeader title="Réglages" />

      {/* Account section */}
      <div className="mb-6">
        <p className="text-muted text-xs font-bold uppercase tracking-wider mb-3">Compte</p>
        <div className="bg-surface rounded-card border border-border divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-text text-sm font-semibold">Email</span>
            <span className="text-muted text-sm">{user?.email ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Préférences section */}
      <div className="mb-6">
        <p className="text-muted text-xs font-bold uppercase tracking-wider mb-3">Préférences</p>
        <div className="bg-surface rounded-card border border-border divide-y divide-border">
          {/* Weight unit */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-text text-sm font-semibold">Unité de poids</span>
            <div className="flex gap-1">
              {(['kg', 'lbs'] as const).map(unit => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => update({ weightUnit: unit })}
                  className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                    settings.weightUnit === unit
                      ? 'bg-accent text-bg'
                      : 'bg-border text-muted hover:text-text'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Default rest */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-text text-sm font-semibold">Repos par défaut</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update({ defaultRestSeconds: Math.max(30, settings.defaultRestSeconds - 15) })}
                className="w-7 h-7 rounded bg-border text-text font-bold flex items-center justify-center hover:border-accent border border-transparent transition-colors"
              >
                −
              </button>
              <span className="text-text text-sm font-semibold w-14 text-center">
                {settings.defaultRestSeconds}s
              </span>
              <button
                type="button"
                onClick={() => update({ defaultRestSeconds: Math.min(300, settings.defaultRestSeconds + 15) })}
                className="w-7 h-7 rounded bg-border text-text font-bold flex items-center justify-center hover:border-accent border border-transparent transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-text text-sm font-semibold">Son</span>
            <Toggle value={settings.soundEnabled} onChange={v => update({ soundEnabled: v })} />
          </div>

          {/* Vibrations */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-text text-sm font-semibold">Vibrations</span>
            <Toggle value={settings.vibrationEnabled} onChange={v => update({ vibrationEnabled: v })} />
          </div>
        </div>
      </div>

      {/* Données section */}
      <div className="mb-6">
        <p className="text-muted text-xs font-bold uppercase tracking-wider mb-3">Données</p>
        <div className="bg-surface rounded-card border border-border divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-text text-sm font-semibold">Exporter mes données</span>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <Button
        variant="secondary"
        size="lg"
        onClick={handleSignOut}
        className="w-full text-error border-error hover:border-error"
      >
        Se déconnecter
      </Button>
    </Screen>
  )
}
