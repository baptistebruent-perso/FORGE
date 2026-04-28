import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { haptic } from '../../lib/haptic'

interface PRCelebrationProps {
  visible: boolean
  exerciseName: string
  prType: string
  value: number
  onDone: () => void
}

export function PRCelebration({ visible, exerciseName, prType, value, onDone }: PRCelebrationProps) {
  useEffect(() => {
    if (visible) {
      haptic.pr()
      const t = setTimeout(onDone, 2500)
      return () => clearTimeout(t)
    }
  }, [visible, onDone])

  const label =
    prType === 'max_weight' ? `${value}kg — nouveau record de charge !` :
    prType === 'max_reps' ? `${value} reps — nouveau record !` :
    `1RM estimé : ${value}kg`

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-accent-orange/10 border border-accent-orange/50 rounded-modal p-8 mx-8 text-center"
            initial={{ scale: 0.5, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 300 }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Trophy size={48} className="text-accent-orange mx-auto mb-3" />
            </motion.div>
            <p className="text-accent-orange text-xs font-bold tracking-widest mb-1">NOUVEAU RECORD</p>
            <p className="text-text font-black text-xl mb-2">{exerciseName}</p>
            <p className="text-accent font-bold text-lg">{label}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
