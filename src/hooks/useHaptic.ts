import { haptic } from '../lib/haptic'

/**
 * Returns haptic functions bound to user settings.
 * For now reads from localStorage directly; will integrate with useSettings later.
 */
export function useHaptic() {
  const isEnabled = (): boolean => {
    try {
      const s = localStorage.getItem('forge-settings')
      if (!s) return true
      const parsed = JSON.parse(s) as { vibrationEnabled?: boolean }
      return parsed.vibrationEnabled !== false
    } catch {
      return true
    }
  }

  return {
    light: () => { if (isEnabled()) haptic.light() },
    medium: () => { if (isEnabled()) haptic.medium() },
    heavy: () => { if (isEnabled()) haptic.heavy() },
    success: () => { if (isEnabled()) haptic.success() },
    pr: () => { if (isEnabled()) haptic.pr() },
  }
}
