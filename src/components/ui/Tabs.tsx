import { cn } from '../../lib/utils'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 bg-surface rounded-card p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 py-2 px-3 rounded-[8px] text-sm font-semibold transition-all',
            active === tab.id ? 'bg-accent text-bg' : 'text-muted hover:text-text'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
