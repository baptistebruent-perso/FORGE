import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import type { Database } from '../../types/database'

type BodyMetric = Database['public']['Tables']['body_metrics']['Row']

const METRICS = [
  { key: 'weight_kg', label: 'Poids', unit: 'kg', color: '#B4FF39' },
  { key: 'chest_cm', label: 'Poitrine', unit: 'cm', color: '#FF6B35' },
  { key: 'waist_cm', label: 'Tour de taille', unit: 'cm', color: '#39FF88' },
  { key: 'arm_cm', label: 'Bras', unit: 'cm', color: '#FFD700' },
  { key: 'thigh_cm', label: 'Cuisse', unit: 'cm', color: '#00BFFF' },
] as const

type MetricKey = (typeof METRICS)[number]['key']

export function BodyChart({ data }: { data: BodyMetric[] }) {
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(new Set(['weight_kg']))

  const chartData = data.map((m) => {
    const point: Record<string, string | number | null> = { date: m.measured_at }
    for (const metric of METRICS) {
      point[metric.key] = m[metric.key]
    }
    return point
  })

  const toggleMetric = (key: MetricKey) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key) // keep at least one
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (data.length === 0) return (
    <div className="h-48 flex items-center justify-center text-muted text-sm">
      Aucune mesure enregistrée
    </div>
  )

  return (
    <div>
      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => toggleMetric(m.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              activeMetrics.has(m.key)
                ? 'border-transparent text-bg'
                : 'border-border text-muted bg-surface'
            }`}
            style={activeMetrics.has(m.key) ? { backgroundColor: m.color } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: '#8A8A92', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#8A8A92', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#141416', border: '1px solid #222226', borderRadius: 12 }}
            labelStyle={{ color: '#8A8A92', fontSize: 12 }}
          />
          {METRICS.filter((m) => activeMetrics.has(m.key)).map((m) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              stroke={m.color}
              strokeWidth={2}
              dot={{ fill: m.color, r: 3 }}
              connectNulls
              name={m.label}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
