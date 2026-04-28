import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface CoachMessageProps {
  message: string
}

export function CoachMessage({ message }: CoachMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-accent/20 rounded-card px-4 py-3 flex gap-3 items-start"
    >
      <Zap size={16} className="text-accent mt-0.5 shrink-0" />
      <p className="text-sm font-semibold text-text leading-snug">{message}</p>
    </motion.div>
  )
}
