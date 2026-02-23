import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  Search, Filter, Plus, FlaskConical, PlayCircle, CheckCircle2,
  Clock, AlertCircle, ChevronDown, MoreHorizontal, Eye, Edit,
  Trash2, Download, Users, CalendarDays, Tag, Loader2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Experiment } from '../../lib/database.types'
import { format, parseISO } from 'date-fns'

// ─── config ────────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; icon: React.ReactNode; dot: string }> = {
  'In Progress': { color: 'bg-blue-100 text-blue-700', icon: <PlayCircle className="w-3.5 h-3.5" />, dot: 'bg-blue-500' },
  Completed: { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: 'bg-emerald-500' },
  'Pending Review': { color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3.5 h-3.5" />, dot: 'bg-amber-500' },
  'On Hold': { color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-3.5 h-3.5" />, dot: 'bg-red-500' },
}
const priorityConfig: Record<string, string> = {
  High: 'bg-red-100 text-red-600',
  Medium: 'bg-amber-100 text-amber-600',
  Low: 'bg-gray-100 text-gray-500',
}

const statuses = ['All', 'In Progress', 'Completed', 'Pending Review', 'On Hold']
const categories = ['All', 'In Vitro', 'Pharmacokinetics', 'Molecular Biology', 'Biochemistry', 'Analytical Chemistry']

function fmtDate(d: string | null) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return d }
}

// Generate next experiment ID on the client
function nextExpId(existing: Experiment[]) {
  const nums = existing.map((e) => parseInt(e.id.replace('EXP-', ''))).filter((n) => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 2000
  return `EXP-${max + 1}`
}

export function Experiments() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // New experiment form state
  const [newForm, setNewForm] = useState({
    name: '', category: 'In Vitro', phase: 'Phase I',
    priority: 'Medium', due_date: '', description: '',
  })

  const canCreate = profile?.role !== 'reviewer'
  const canDelete = profile?.role === 'lab_manager'

  // ── fetch ──────────────────────────────────────────────────────────────────
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

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = experiments.filter((exp) => {
    const q = search.toLowerCase()
    const matchSearch =
      exp.name.toLowerCase().includes(q) ||
      exp.id.toLowerCase().includes(q) ||
      (exp.researcher_name?.toLowerCase().includes(q) ?? false)
    const matchStatus = statusFilter === 'All' || exp.status === statusFilter
    const matchCategory = categoryFilter === 'All' || exp.category === categoryFilter
    return matchSearch && matchStatus && matchCategory
  })

  // ── create ─────────────────────────────────────────────────────────────────
  async function createExperiment() {
    if (!newForm.name.trim() || !profile) return
    setSaving(true)
    const id = nextExpId(experiments)
    const { data, error } = await supabase
      .from('experiments')
      .insert({
        id,
        name: newForm.name,
        category: newForm.category,
        phase: newForm.phase,
        priority: newForm.priority as Experiment['priority'],
        status: 'In Progress',
        due_date: newForm.due_date || null,
        description: newForm.description || null,
        researcher_id: profile.id,
        researcher_name: profile.full_name,
        tags: [],
        progress: 0,
        started_at: new Date().toISOString().split('T')[0],
        created_by: profile.id,
      })
      .select()
      .single()
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    if (data) {
      setExperiments((prev) => [data, ...prev])
      setShowNewModal(false)
      setNewForm({ name: '', category: 'In Vitro', phase: 'Phase I', priority: 'Medium', due_date: '', description: '' })
    }
  }

  // ── delete ─────────────────────────────────────────────────────────────────
  async function deleteExperiment(id: string) {
    if (!confirm('Delete this experiment? This cannot be undone.')) return
    await supabase.from('experiments').delete().eq('id', id)
    setExperiments((prev) => prev.filter((e) => e.id !== id))
    setOpenMenu(null)
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-gray-500 text-sm">
          {loading ? 'Loading…' : `${filtered.length} experiment${filtered.length !== 1 ? 's' : ''} found`}
        </p>
        {canCreate && (
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            New Experiment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search experiments, IDs, researchers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none cursor-pointer text-gray-700">
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-4 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none cursor-pointer text-gray-700">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition ${
              statusFilter === s ? 'bg-[#2563eb] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-5 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Experiment Cards */}
      {!loading && (
        <div className="grid gap-3">
          {filtered.map((exp) => {
            const status = statusConfig[exp.status] ?? statusConfig['In Progress']
            const progressColor = exp.progress === 100 ? '#10b981' : exp.status === 'On Hold' ? '#ef4444' : '#3b82f6'
            return (
              <div
                key={exp.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
                onClick={() => { if (openMenu !== exp.id) navigate(`/experiments/${exp.id}`) }}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-5 h-5 text-blue-600" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600">{exp.id}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{exp.category}</span>
                      {exp.phase && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exp.phase}</span>
                        </>
                      )}
                    </div>
                    <h4 className="text-gray-800 font-medium">{exp.name}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {exp.researcher_name && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">{exp.researcher_name}</span>
                        </div>
                      )}
                      {exp.due_date && (
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">Due {fmtDate(exp.due_date)}</span>
                        </div>
                      )}
                      {exp.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          <div className="flex gap-1">
                            {exp.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs font-semibold text-gray-600">{exp.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${exp.progress}%`, background: progressColor }} />
                      </div>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.icon}{exp.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig[exp.priority]}`}>
                      {exp.priority}
                    </span>

                    {/* Actions */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === exp.id ? null : exp.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === exp.id && (
                        <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1">
                          <button onClick={() => { navigate(`/experiments/${exp.id}`); setOpenMenu(null) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition">
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                          {(canCreate && (exp.created_by === profile?.id || profile?.role === 'lab_manager')) && (
                            <button onClick={() => { navigate(`/experiments/${exp.id}`); setOpenMenu(null) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition">
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                          )}
                          {canDelete && (
                            <>
                              <div className="my-1 border-t border-gray-100" />
                              <button onClick={() => deleteExperiment(exp.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <FlaskConical className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No experiments found.</p>
              <button onClick={() => { setSearch(''); setStatusFilter('All'); setCategoryFilter('All') }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700">
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Experiment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-gray-800">New Experiment</h2>
              <p className="text-sm text-gray-500 mt-0.5">Fill in the details to create a new experiment.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Experiment Name *</label>
                <input type="text" value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Enter experiment name…"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Category</label>
                  <select value={newForm.category} onChange={(e) => setNewForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none">
                    {categories.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Phase</label>
                  <select value={newForm.phase} onChange={(e) => setNewForm((f) => ({ ...f, phase: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none">
                    {['Phase I', 'Phase II', 'Phase III'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Priority</label>
                  <select value={newForm.priority} onChange={(e) => setNewForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none">
                    {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Due Date</label>
                  <input type="date" value={newForm.due_date} onChange={(e) => setNewForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none transition" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Notes</label>
                <textarea rows={3} value={newForm.description} onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Initial experiment notes…"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNewModal(false)}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={createExperiment} disabled={saving || !newForm.name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-medium transition shadow-sm disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Experiment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
