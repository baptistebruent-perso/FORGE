import { useState } from 'react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

interface SetInputProps {
  setNumber: number
  defaultWeight?: number | null
  defaultReps?: number | null
  onValidate: (weight: number, reps: number) => void
  disabled?: boolean
}

export function SetInput({ setNumber, defaultWeight, defaultReps, onValidate, disabled }: SetInputProps) {
  const [weight, setWeight] = useState(String(defaultWeight ?? ''))
  const [reps, setReps] = useState(String(defaultReps ?? ''))

  const handleValidate = () => {
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
      onValidate(w, r)
    }
  }

  const isValid = !isNaN(parseFloat(weight)) && !isNaN(parseInt(reps, 10)) &&
    parseFloat(weight) > 0 && parseInt(reps, 10) > 0

  return (
    <div className={cn('bg-bg rounded-card p-4 border border-border')}>
      <p className="text-muted text-xs font-semibold mb-3">SÉRIE {setNumber}</p>
      <div className="flex gap-3 mb-4">
        {/* Weight input */}
        <div className="flex-1">
          <label className="text-muted text-xs block mb-1">POIDS (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="80"
            step="2.5"
            min="0"
            className="w-full bg-surface border border-border rounded-card px-4 py-4 text-text text-2xl font-bold text-center focus:outline-none focus:border-accent transition-colors"
            disabled={disabled}
          />
        </div>
        {/* Reps input */}
        <div className="flex-1">
          <label className="text-muted text-xs block mb-1">REPS</label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="8"
            min="1"
            max="99"
            className="w-full bg-surface border border-border rounded-card px-4 py-4 text-text text-2xl font-bold text-center focus:outline-none focus:border-accent transition-colors"
            disabled={disabled}
          />
        </div>
      </div>
      <Button
        size="lg"
        onClick={handleValidate}
        disabled={!isValid || disabled}
        className="w-full"
      >
        VALIDER SÉRIE {setNumber}
      </Button>
    </div>
  )
}
