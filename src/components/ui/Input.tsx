import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-bg border border-border rounded-card px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors text-base',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
