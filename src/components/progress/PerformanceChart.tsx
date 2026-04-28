import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts'

interface DataPoint {
  date: string
  estimated1RM: number
  weight: number
}

interface WeeklyPoint {
  week: string
  volume: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-card px-3 py-2 text-xs">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.value}{p.name === 'estimated1RM' ? ' kg 1RM' : p.name === 'weight' ? ' kg' : ' kg'}
        </p>
      ))}
    </div>
  )
}

export function OneRMChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) return (
    <div className="h-48 flex items-center justify-center text-muted text-sm">
      Pas encore de données
    </div>
  )
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fill: '#8A8A92', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#8A8A92', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone" dataKey="estimated1RM" stroke="#B4FF39"
          strokeWidth={2} dot={{ fill: '#B4FF39', r: 3 }} activeDot={{ r: 5 }}
          name="estimated1RM"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function WeeklyVolumeChart({ data }: { data: WeeklyPoint[] }) {
  if (data.length === 0) return (
    <div className="h-48 flex items-center justify-center text-muted text-sm">
      Pas encore de données
    </div>
  )
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222226" />
        <XAxis dataKey="week" tick={{ fill: '#8A8A92', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#8A8A92', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="volume" fill="#B4FF39" radius={[4, 4, 0, 0]} name="volume" />
      </BarChart>
    </ResponsiveContainer>
  )
}
