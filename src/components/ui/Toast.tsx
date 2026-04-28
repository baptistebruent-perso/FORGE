import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: ToastItem[]
  add: (message: string, type?: ToastType) => void
  remove: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function ToastContainer() {
  const { toasts } = useToast()

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} />,
    error: <XCircle size={16} />,
    info: <Info size={16} />,
  }
  const colors: Record<ToastType, string> = {
    success: 'border-success text-success',
    error: 'border-error text-error',
    info: 'border-accent text-accent',
  }

  return (
    <div className="fixed top-4 inset-x-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-center gap-2 bg-surface border rounded-card px-4 py-3 text-sm font-semibold ${colors[t.type]}`}
          >
            {icons[t.type]}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
