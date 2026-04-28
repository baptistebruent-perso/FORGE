import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-surface border border-border rounded-card p-4', className)} {...props}>
      {children}
    </div>
  )
}
