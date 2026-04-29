import { supabase } from './supabase'

interface QueuedWrite {
  table: string
  data: Record<string, unknown>
  timestamp: number
}

const QUEUE_KEY = 'forge-offline-queue'

export function queueWrite(table: string, data: Record<string, unknown>) {
  const queue: QueuedWrite[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  queue.push({ table, data, timestamp: Date.now() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export async function flushQueue(): Promise<void> {
  const queue: QueuedWrite[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  if (!queue.length) return
  for (const item of queue) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from(item.table as any).insert(item.data)
  }
  localStorage.removeItem(QUEUE_KEY)
}

export function getQueueLength(): number {
  const queue: QueuedWrite[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  return queue.length
}
