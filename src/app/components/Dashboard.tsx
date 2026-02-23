import { useEffect, useState } from 'react'
import {
  FlaskConical, TestTube, ClipboardCheck, TrendingUp,
  AlertCircle, Clock, CheckCircle2, PlayCircle,
  ArrowUpRight, CalendarDays, Users, Beaker, Loader2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Experiment } from '../../lib/database.types'
import { format, parseISO, startOfMonth } from 'date-fns'

// ─── status helpers ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  'In Progress': { color: 'bg-blue-100 text-blue-700', icon: <PlayCircle className="w-3.5 h-3.5" /> },
  Completed: { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  'Pending Review': { color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
  'On Hold': { color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
}
const priorityConfig: Record<string, string> = {
  High: 'bg-red-100 text-red-600',
  Medium: 'bg-amber-100 text-amber-600',
  Low: 'bg-gray-100 text-gray-500',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildActivityData(experiments: Experiment[]) {
  // Build last-7-months counts
  const now = new Date()
  const months: { month: string; experiments: number; completed: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = MONTHS[d.getMonth()]
    const started = experiments.filter((e) => {
      if (!e.started_at) return false
      const m = startOfMonth(parseISO(e.started_at))
      return m.getTime() === d.getTime()
    }).length
    const completed = experiments.filter((e) => {
      if (!e.completed_at) return false
      const m = startOfMonth(parseISO(e.completed_at))
      return m.getTime() === d.getTime()
    }).length
    months.push({ month: label, experiments: started, completed })
  }
  return months
}

export function Dashboard() {
  const { profile } = useAuth()
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false })
      setExperiments(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Computed stats
  const active = experiments.filter((e) => e.status === 'In Progress').length
  const pending = experiments.filter((e) => e.status === 'Pending Review').length
  const completed = experiments.filter((e) => e.status === 'Completed').length
  const total = experiments.length
  const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '—'

  const stats = [
    { label: 'Active Experiments', value: loading ? '…' : String(active), change: `${pending} pending review`, positive: true, icon: FlaskConical, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Samples in Queue', value: '—', change: 'See Samples page', positive: true, icon: TestTube, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Total Experiments', value: loading ? '…' : String(total), change: 'All time', positive: true, icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Success Rate', value: loading ? '…' : `${successRate}%`, change: `${completed} completed`, positive: true, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  ]

  const statusData = [
    { name: 'In Progress', value: experiments.filter((e) => e.status === 'In Progress').length, color: '#3b82f6' },
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'Pending Review', value: experiments.filter((e) => e.status === 'Pending Review').length, color: '#f59e0b' },
    { name: 'On Hold', value: experiments.filter((e) => e.status === 'On Hold').length, color: '#ef4444' },
  ]

  const activityData = buildActivityData(experiments)
  const recent = experiments.slice(0, 5)

  const greeting = profile?.full_name ? `Dr. ${profile.full_name.split(' ').pop()}` : 'there'

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1e3d] via-[#1a3a6b] to-[#2563eb] p-6 text-white">
        <div className="relative z-10">
          <p className="text-blue-200 text-sm mb-1">Welcome back,</p>
          <h1 className="text-white mb-1">{profile?.full_name ?? 'Researcher'}</h1>
          <p className="text-blue-200 text-sm">
            You have <span className="text-white font-semibold">{active} active</span> experiments and{' '}
            <span className="text-white font-semibold">{pending} pending</span> review today.
          </p>
          <div className="flex gap-3 mt-4">
            <Link to="/experiments" className="bg-white text-[#0b1e3d] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition">
              View Experiments
            </Link>
            <Link to="/lab-notebook" className="border border-white/30 text-white px-4 py-2 rounded-xl text-sm hover:bg-white/10 transition">
              Open Lab Notebook
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 top-10 w-32 h-32 rounded-full bg-white/5" />
        <Beaker className="absolute right-16 top-8 w-16 h-16 text-white/10" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-2xl p-5 border ${stat.border} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300 inline" /> : stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            <p className={`text-xs mt-1.5 font-medium ${stat.positive ? 'text-emerald-600' : 'text-red-500'}`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-800">Experiment Activity</h3>
              <p className="text-gray-400 text-xs mt-0.5">Monthly overview — last 7 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="experiments" name="Started" stroke="#3b82f6" strokeWidth={2} fill="url(#expGrad)" />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#compGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="mb-5">
            <h3 className="text-gray-800">Experiment Status</h3>
            <p className="text-gray-400 text-xs mt-0.5">Current distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-gray-600">{s.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Experiments */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-gray-800">Recent Experiments</h3>
            <Link to="/experiments" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-blue-300 animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">No experiments yet.</p>
              )}
              {recent.map((exp) => {
                const status = statusConfig[exp.status] ?? statusConfig['In Progress']
                const updatedAt = exp.updated_at ? format(parseISO(exp.updated_at), 'MMM d') : '—'
                return (
                  <Link
                    key={exp.id}
                    to={`/experiments/${exp.id}`}
                    className="block px-5 py-3.5 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-blue-600 font-semibold">{exp.id}</span>
                          {exp.phase && <><span className="text-xs text-gray-400">·</span><span className="text-xs text-gray-400">{exp.phase}</span></>}
                        </div>
                        <p className="text-sm text-gray-800 font-medium truncate">{exp.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {exp.researcher_name && (
                            <>
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{exp.researcher_name}</span>
                              <span className="text-xs text-gray-300">·</span>
                            </>
                          )}
                          <CalendarDays className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{updatedAt}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.icon}{exp.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${priorityConfig[exp.priority]}`}>
                          {exp.priority}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-gray-800">Lab Snapshot</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Active experiments', value: String(active), color: 'text-blue-600' },
              { label: 'Pending review', value: String(pending), color: 'text-amber-600' },
              { label: 'Completed', value: String(completed), color: 'text-emerald-600' },
              { label: 'On hold', value: String(experiments.filter((e) => e.status === 'On Hold').length), color: 'text-red-600' },
              { label: 'Success rate', value: `${successRate}%`, color: 'text-gray-700' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-600">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{loading ? '…' : item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
