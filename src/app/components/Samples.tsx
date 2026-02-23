import { useState, useEffect } from 'react'
import {
  TestTube, Plus, Search, Filter, ChevronDown, Thermometer,
  MapPin, Calendar, AlertTriangle, CheckCircle, Clock,
  Package, QrCode, MoreHorizontal, Loader2, ShieldAlert,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { usePII } from '../../contexts/PIIContext'
import { maskPatientId, maskOrganization } from '../../lib/pii'
import type { Sample, Experiment } from '../../lib/database.types'
import { format, parseISO } from 'date-fns'

// ─── config ────────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  Active: { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Depleted: { color: 'bg-gray-100 text-gray-500', icon: <Package className="w-3.5 h-3.5" /> },
  'Low Stock': { color: 'bg-amber-100 text-amber-700', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  Quarantine: { color: 'bg-red-100 text-red-700', icon: <Clock className="w-3.5 h-3.5" /> },
}
const typeColors: Record<string, string> = {
  'Small Molecule': 'bg-blue-100 text-blue-700',
  Biological: 'bg-violet-100 text-violet-700',
  'Nucleic Acid': 'bg-emerald-100 text-emerald-700',
  Buffer: 'bg-gray-100 text-gray-600',
  Formulation: 'bg-orange-100 text-orange-700',
}
const storageIcons: Record<string, string> = {
  '-80°C Freezer': '❄️',
  '-20°C Freezer': '🧊',
  '4°C Fridge': '🌡️',
  RT: '🌡️',
}

const statuses = ['All', 'Active', 'Low Stock', 'Depleted', 'Quarantine']
const types = ['All', 'Small Molecule', 'Biological', 'Nucleic Acid', 'Buffer', 'Formulation']

function nextSampleId(existing: Sample[]) {
  const nums = existing.map((s) => parseInt(s.id.replace('SMP-', ''))).filter((n) => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 1100
  return `SMP-${max + 1}`
}

export function Samples() {
  const { profile } = useAuth()
  const { piiVisible } = usePII()

  const [samples, setSamples] = useState<Sample[]>([])
  const [experiments, setExperiments] = useState<Pick<Experiment, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newForm, setNewForm] = useState({
    name: '', type: 'Small Molecule', storage: '-80°C Freezer',
    volume: '', concentration: '', location: '',
    experiment_id: '', batch: '', expiry: '',
    patient_id: '', organization: '',
    quantity: 0, max_quantity: 20,
  })

  const canCreate = profile?.role !== 'reviewer'

  // ── load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [samplesRes, expsRes] = await Promise.all([
        supabase.from('samples').select('*').order('created_at', { ascending: false }),
        supabase.from('experiments').select('id, name'),
      ])
      setSamples(samplesRes.data ?? [])
      setExperiments(expsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = samples.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch =
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.experiment_id?.toLowerCase().includes(q) ?? false)
    const matchStatus = statusFilter === 'All' || s.status === statusFilter
    const matchType = typeFilter === 'All' || s.type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  // ── create ─────────────────────────────────────────────────────────────────
  async function createSample() {
    if (!newForm.name.trim() || !profile) return
    setSaving(true)
    const id = nextSampleId(samples)
    const { data, error } = await supabase
      .from('samples')
      .insert({
        id,
        name: newForm.name,
        type: newForm.type,
        storage: newForm.storage,
        volume: newForm.volume || null,
        concentration: newForm.concentration || null,
        location: newForm.location || null,
        experiment_id: newForm.experiment_id || null,
        batch: newForm.batch || null,
        expiry_month: newForm.expiry ? format(parseISO(newForm.expiry), 'MMM yyyy') : null,
        received_at: new Date().toISOString().split('T')[0],
        quantity: newForm.quantity,
        max_quantity: newForm.max_quantity,
        status: 'Active',
        patient_id: newForm.patient_id || null,
        organization: newForm.organization || null,
        created_by: profile.id,
      })
      .select()
      .single()
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    if (data) setSamples((prev) => [data, ...prev])
    setShowNew(false)
  }

  // ── stats ──────────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Samples', value: samples.length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active', value: samples.filter((s) => s.status === 'Active').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Low Stock', value: samples.filter((s) => s.status === 'Low Stock').length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Quarantine', value: samples.filter((s) => s.status === 'Quarantine').length, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <TestTube className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300 inline" /> : s.value}
            </p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search samples by name, ID, experiment…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition" />
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
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-4 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none cursor-pointer text-gray-700">
                {types.map((t) => <option key={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            {canCreate && (
              <button onClick={() => setShowNew(true)}
                className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                <Plus className="w-4 h-4" />
                Register Sample
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse h-52" />
          ))}
        </div>
      )}

      {/* Sample Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((sample) => {
            const status = statusConfig[sample.status]
            const stockPct = sample.max_quantity > 0 ? (sample.quantity / sample.max_quantity) * 100 : 0
            return (
              <div key={sample.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <TestTube className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">{sample.id}</p>
                      <p className="text-sm text-gray-800 font-medium leading-snug">{sample.name}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[sample.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {sample.type}
                  </span>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                    {status.icon}{sample.status}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {(sample.volume || sample.concentration) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <TestTube className="w-3.5 h-3.5 text-gray-400" />
                      <span>{[sample.volume, sample.concentration].filter(Boolean).join(' · ')}</span>
                    </div>
                  )}
                  {sample.storage && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Thermometer className="w-3.5 h-3.5 text-gray-400" />
                      <span>{storageIcons[sample.storage] || '🌡️'} {sample.storage}</span>
                    </div>
                  )}
                  {sample.location && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{sample.location}</span>
                    </div>
                  )}
                  {sample.expiry_month && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Exp: {sample.expiry_month}</span>
                    </div>
                  )}

                  {/* PII fields with masking */}
                  {(sample.patient_id || sample.organization) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-50 pt-1.5 mt-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className={`font-medium ${piiVisible ? 'text-amber-700' : 'text-gray-400 italic'}`}>
                        {sample.patient_id && maskPatientId(sample.patient_id, piiVisible)}
                        {sample.patient_id && sample.organization && ' · '}
                        {sample.organization && maskOrganization(sample.organization, piiVisible)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stock Level */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Stock</span>
                    <span className="text-xs text-gray-600 font-medium">{sample.quantity}/{sample.max_quantity} units</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${stockPct}%`,
                        background: stockPct === 0 ? '#9ca3af' : stockPct < 25 ? '#ef4444' : stockPct < 50 ? '#f59e0b' : '#10b981',
                      }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">{sample.experiment_id ?? 'General'}</span>
                  <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    <QrCode className="w-3.5 h-3.5" />
                    Label
                  </button>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <TestTube className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No samples found.</p>
            </div>
          )}
        </div>
      )}

      {/* New Sample Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-gray-800">Register New Sample</h3>
              <p className="text-xs text-gray-500 mt-0.5">Add a new sample to the inventory</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Sample Name *</label>
                <input type="text" value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Enter sample name…"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Type</label>
                  <select value={newForm.type} onChange={(e) => setNewForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none">
                    {types.filter((t) => t !== 'All').map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Storage</label>
                  <select value={newForm.storage} onChange={(e) => setNewForm((f) => ({ ...f, storage: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none">
                    {['-80°C Freezer', '-20°C Freezer', '4°C Fridge', 'RT'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Volume</label>
                  <input type="text" value={newForm.volume} onChange={(e) => setNewForm((f) => ({ ...f, volume: e.target.value }))}
                    placeholder="e.g. 50 mL"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none transition" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Expiry Date</label>
                  <input type="date" value={newForm.expiry} onChange={(e) => setNewForm((f) => ({ ...f, expiry: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none transition" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Linked Experiment</label>
                <select value={newForm.experiment_id} onChange={(e) => setNewForm((f) => ({ ...f, experiment_id: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none">
                  <option value="">— None —</option>
                  {experiments.map((e) => <option key={e.id} value={e.id}>{e.id} – {e.name}</option>)}
                </select>
              </div>
              {/* PII fields — visible only to lab managers with PII toggle OFF */}
              {piiVisible && (
                <div className="border-t border-amber-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> PII Fields (Lab Manager only)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-700 block mb-1.5">Patient ID</label>
                      <input type="text" value={newForm.patient_id} onChange={(e) => setNewForm((f) => ({ ...f, patient_id: e.target.value }))}
                        placeholder="e.g. PAT-12345"
                        className="w-full px-4 py-2.5 text-sm bg-amber-50 border border-amber-200 rounded-xl focus:outline-none transition" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 block mb-1.5">Organization</label>
                      <input type="text" value={newForm.organization} onChange={(e) => setNewForm((f) => ({ ...f, organization: e.target.value }))}
                        placeholder="Institution name"
                        className="w-full px-4 py-2.5 text-sm bg-amber-50 border border-amber-200 rounded-xl focus:outline-none transition" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNew(false)}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={createSample} disabled={saving || !newForm.name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-medium transition disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
