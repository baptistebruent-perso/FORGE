import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none select-none'
    const variants = {
      primary: 'bg-accent text-bg rounded-full hover:opacity-90',
      secondary: 'bg-surface border border-border text-text rounded-card hover:border-accent',
      ghost: 'text-muted hover:text-text rounded-card',
      danger: 'bg-error text-white rounded-card',
    }
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg w-full',
    }
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
