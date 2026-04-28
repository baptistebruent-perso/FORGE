import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, TrendingUp, Target, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/program', icon: Dumbbell, label: 'Programme' },
  { to: '/progress', icon: TrendingUp, label: 'Prog.' },
  { to: '/goals', icon: Target, label: 'Objectifs' },
  { to: '/settings', icon: Settings, label: 'Réglages' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface border-t border-border z-30 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-semibold transition-colors ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
