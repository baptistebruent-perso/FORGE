import { useEffect, useRef, useState } from 'react'

/**
 * Counts down from endsAt (epoch ms). Returns remaining seconds (0 when done).
 * Calls onComplete once when it hits 0.
 */
export function useCountdown(endsAt: number | null, onComplete?: () => void) {
  const [remaining, setRemaining] = useState(0)
  const rafRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => { onCompleteRef.current = onComplete })

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0)
      completedRef.current = false
      return
    }

    completedRef.current = false

    const tick = () => {
      const diff = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setRemaining(diff)
      if (diff > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else if (!completedRef.current) {
        completedRef.current = true
        onCompleteRef.current?.()
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [endsAt])

  return remaining
}

/**
 * Measures elapsed seconds since startedAt (ISO string).
 */
export function useStopwatch(startedAt: string | null): number {
  const [elapsed, setElapsed] = useState(() => {
    if (!startedAt) return 0
    return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  })

  useEffect(() => {
    if (!startedAt) { setElapsed(0); return }
    const start = new Date(startedAt).getTime()

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt])

  return elapsed
}
