import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-bg border border-border rounded-card px-4 py-3 text-text placeholder-muted focus:outline-none focus:border-accent transition-colors text-base resize-none',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
