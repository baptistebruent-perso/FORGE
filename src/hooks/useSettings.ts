import { useState } from 'react'

interface Settings {
  weightUnit: 'kg' | 'lbs'
  defaultRestSeconds: number
  soundEnabled: boolean
  vibrationEnabled: boolean
}

const DEFAULTS: Settings = {
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  soundEnabled: true,
  vibrationEnabled: true,
}

const KEY = 'forge-settings'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
    } catch {
      return DEFAULTS
    }
  })

  const update = (patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  return { settings, update }
}
