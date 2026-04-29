import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { flushQueue } from '../../lib/offline-queue'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      flushQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -48 }} animate={{ y: 0 }} exit={{ y: -48 }}
          className="fixed top-0 inset-x-0 z-50 bg-error text-bg flex items-center justify-center gap-2 py-2 text-sm font-bold"
        >
          <WifiOff size={14} />
          Mode hors-ligne
        </motion.div>
      )}
    </AnimatePresence>
  )
}
