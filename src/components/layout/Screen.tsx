import { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ScreenProps extends HTMLAttributes<HTMLDivElement> {
  noBottomNav?: boolean
  noPadding?: boolean
}

export function Screen({ className, noBottomNav, noPadding, children, ...props }: ScreenProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-bg',
        !noPadding && 'px-4 pt-6',
        !noBottomNav && 'pb-24',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
