import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import {
  ArrowLeft, FlaskConical, PlayCircle, CheckCircle2, Clock, AlertCircle,
  Plus, Upload, FileText, Download, Trash2, Edit, Save, X, Loader2,
  Flag, Database, Microscope, FileSearch, MessageSquare, GitBranch,
  Printer, Users, CalendarDays, Tag, TrendingUp,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Experiment, ExperimentTimelineEvent, ExperimentDataFile } from '../../lib/database.types'
import { format, parseISO } from 'date-fns'

// ─── helpers ──────────────────────────────────────────────────────────────────

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
const eventTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  milestone: { icon: <Flag className="w-3.5 h-3.5" />, color: 'bg-violet-100 text-violet-700 border-violet-200', label: 'Milestone' },
  data_collection: { icon: <Database className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Data Collection' },
  analysis: { icon: <Microscope className="w-3.5 h-3.5" />, color: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Analysis' },
  review: { icon: <FileSearch className="w-3.5 h-3.5" />, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Review' },
  note: { icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Note' },
  status_change: { icon: <GitBranch className="w-3.5 h-3.5" />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Status Change' },
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'MMM d, yyyy') } catch { return iso }
}
function fmtDateTime(iso: string) {
  try { return format(parseISO(iso), 'MMM d, yyyy · HH:mm') } catch { return iso }
}
function fmtBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── main component ────────────────────────────────────────────────────────────

export function ExperimentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [exp, setExp] = useState<Experiment | null>(null)
  const [events, setEvents] = useState<ExperimentTimelineEvent[]>([])
  const [files, setFiles] = useState<ExperimentDataFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit experiment state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Experiment>>({})
  const [saving, setSaving] = useState(false)

  // New timeline event
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState({ title: '', description: '', event_type: 'note' as const })
  const [savingEvent, setSavingEvent] = useState(false)

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const canEdit = profile?.role === 'lab_manager' || exp?.created_by === profile?.id
  const canModify = profile?.role !== 'reviewer'

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    loadAll()
  }, [id])

  async function loadAll() {
    setLoading(true)
    const [expRes, eventsRes, filesRes] = await Promise.all([
      supabase.from('experiments').select('*').eq('id', id!).single(),
      supabase.from('experiment_timeline_events').select('*').eq('experiment_id', id!).order('event_date', { ascending: true }),
      supabase.from('experiment_data_files').select('*').eq('experiment_id', id!).order('uploaded_at', { ascending: false }),
    ])
    if (expRes.error || !expRes.data) {
      setError('Experiment not found.')
    } else {
      setExp(expRes.data)
      setEditForm(expRes.data)
    }
    setEvents(eventsRes.data ?? [])
    setFiles(filesRes.data ?? [])
    setLoading(false)
  }

  // ── edit experiment ────────────────────────────────────────────────────────
  async function saveEdit() {
    if (!exp) return
    setSaving(true)
    const { error: err } = await supabase
      .from('experiments')
      .update({
        name: editForm.name,
        status: editForm.status,
        priority: editForm.priority,
        progress: editForm.progress,
        description: editForm.description,
        hypothesis: editForm.hypothesis,
        due_date: editForm.due_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exp.id)
    setSaving(false)
    if (err) {
      alert('Save failed: ' + err.message)
    } else {
      setExp({ ...exp, ...editForm })
      setEditing(false)
    }
  }

  // ── add timeline event ─────────────────────────────────────────────────────
  async function addEvent() {
    if (!eventForm.title.trim() || !id || !profile) return
    setSavingEvent(true)
    const { data, error: err } = await supabase
      .from('experiment_timeline_events')
      .insert({
        experiment_id: id,
        title: eventForm.title,
        description: eventForm.description || null,
        event_type: eventForm.event_type,
        event_date: new Date().toISOString(),
        created_by: profile.id,
      })
      .select()
      .single()
    setSavingEvent(false)
    if (err) { alert('Error: ' + err.message); return }
    if (data) setEvents((prev) => [...prev, data])
    setEventForm({ title: '', description: '', event_type: 'note' })
    setShowEventForm(false)
  }

  // ── file upload ────────────────────────────────────────────────────────────
  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id || !profile) return
    setUploading(true)
    const path = `${id}/${Date.now()}_${file.name}`
    const { error: uploadErr } = await supabase.storage
      .from('experiment-files')
      .upload(path, file)
    if (uploadErr) {
      alert('Upload failed: ' + uploadErr.message)
      setUploading(false)
      return
    }
    const { data: rec, error: recErr } = await supabase
      .from('experiment_data_files')
      .insert({
        experiment_id: id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: path,
        uploaded_by: profile.id,
      })
      .select()
      .single()
    setUploading(false)
    if (recErr) { alert('DB error: ' + recErr.message); return }
    if (rec) setFiles((prev) => [rec, ...prev])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── file download ──────────────────────────────────────────────────────────
  async function downloadFile(f: ExperimentDataFile) {
    const { data, error: err } = await supabase.storage
      .from('experiment-files')
      .createSignedUrl(f.storage_path, 3600)
    if (err || !data) { alert('Download failed'); return }
    window.open(data.signedUrl, '_blank')
  }

  // ── delete file ────────────────────────────────────────────────────────────
  async function deleteFile(f: ExperimentDataFile) {
    if (!confirm(`Delete "${f.file_name}"?`)) return
    await supabase.storage.from('experiment-files').remove([f.storage_path])
    await supabase.from('experiment_data_files').delete().eq('id', f.id)
    setFiles((prev) => prev.filter((x) => x.id !== f.id))
  }

  // ── PDF export ─────────────────────────────────────────────────────────────
  function exportPDF() {
    window.print()
  }

  // ── render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }
  if (error || !exp) {
    return (
      <div className="text-center py-24">
        <FlaskConical className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500">{error ?? 'Experiment not found.'}</p>
        <button onClick={() => navigate('/experiments')} className="mt-4 text-blue-600 hover:underline text-sm">
          ← Back to Experiments
        </button>
      </div>
    )
  }

  const status = statusConfig[exp.status] ?? statusConfig['In Progress']
  const progressColor = exp.progress === 100 ? '#10b981' : exp.status === 'On Hold' ? '#ef4444' : '#3b82f6'

  return (
    <>
      {/* ── Print-only header ──────────────────────────────────────────────── */}
      <div className="hidden print:flex items-center gap-3 mb-8 pb-4 border-b border-gray-200">
        <div className="w-9 h-9 rounded-xl bg-[#2563eb] flex items-center justify-center">
          <Microscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-[#0b1e3d]">PharmaLab R&D Platform</p>
          <p className="text-xs text-gray-500">Experiment Report · Printed {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="space-y-5 print:space-y-4">
        {/* ── Top bar ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => navigate('/experiments')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Experiments
          </button>
          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
            >
              <Printer className="w-4 h-4" />
              Export PDF
            </button>
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-medium transition"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {editing && (
              <>
                <button
                  onClick={() => { setEditing(false); setEditForm(exp) }}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Experiment header card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 print:shadow-none print:border print:border-gray-300">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <FlaskConical className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-600">{exp.id}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{exp.category}</span>
                {exp.phase && (
                  <>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exp.phase}</span>
                  </>
                )}
              </div>
              {editing ? (
                <input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full text-lg font-semibold text-gray-800 border-b border-blue-300 focus:outline-none bg-transparent py-0.5"
                />
              ) : (
                <h2 className="text-gray-800 text-xl font-semibold">{exp.name}</h2>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {exp.researcher_name && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{exp.researcher_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {fmtDate(exp.started_at)} → {editing ? (
                      <input
                        type="date"
                        value={editForm.due_date ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                        className="text-xs border-b border-blue-300 focus:outline-none"
                      />
                    ) : fmtDate(exp.due_date)}
                  </span>
                </div>
                {exp.tags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <div className="flex gap-1 flex-wrap">
                      {exp.tags.map((t) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {editing ? (
                <select
                  value={editForm.status ?? exp.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Experiment['status'] }))}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  {['In Progress', 'Completed', 'Pending Review', 'On Hold'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.icon}{exp.status}
                </span>
              )}
              {editing ? (
                <select
                  value={editForm.priority ?? exp.priority}
                  onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as Experiment['priority'] }))}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
                </select>
              ) : (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig[exp.priority]}`}>
                  {exp.priority}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 font-medium">Progress</span>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0} max={100} step={5}
                    value={editForm.progress ?? exp.progress}
                    onChange={(e) => setEditForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                    className="w-32"
                  />
                  <span className="text-xs font-semibold text-gray-700 w-8">{editForm.progress ?? exp.progress}%</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-gray-600">{exp.progress}%</span>
              )}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${editing ? (editForm.progress ?? exp.progress) : exp.progress}%`, background: progressColor }}
              />
            </div>
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── LEFT: description + timeline ───────────────────────────────── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Description / Hypothesis */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 print:shadow-none print:border print:border-gray-300">
              <h3 className="text-gray-800 font-semibold mb-4">Experiment Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                  {editing ? (
                    <textarea
                      rows={3}
                      value={editForm.description ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition resize-none"
                      placeholder="Describe the experiment objective…"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">{exp.description || <span className="text-gray-300 italic">No description</span>}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hypothesis</label>
                  {editing ? (
                    <textarea
                      rows={2}
                      value={editForm.hypothesis ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, hypothesis: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition resize-none"
                      placeholder="State the working hypothesis…"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">{exp.hypothesis || <span className="text-gray-300 italic">No hypothesis recorded</span>}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 print:shadow-none print:border print:border-gray-300">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-gray-800 font-semibold">Timeline</h3>
                {canModify && (
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-medium transition print:hidden"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Event
                  </button>
                )}
              </div>

              {/* Add event form */}
              {showEventForm && (
                <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input
                        value={eventForm.title}
                        onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Event title…"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition"
                      />
                    </div>
                    <div>
                      <select
                        value={eventForm.event_type}
                        onChange={(e) => setEventForm((f) => ({ ...f, event_type: e.target.value as typeof eventForm.event_type }))}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none appearance-none"
                      >
                        {Object.entries(eventTypeConfig).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <textarea
                        rows={2}
                        value={eventForm.description}
                        onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Details (optional)…"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowEventForm(false)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl text-gray-600 hover:bg-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addEvent}
                      disabled={savingEvent || !eventForm.title.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-medium transition disabled:opacity-60"
                    >
                      {savingEvent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save Event
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline list */}
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No timeline events yet.</p>
                </div>
              ) : (
                <ol className="relative border-l-2 border-gray-100 ml-3 space-y-0">
                  {events.map((ev, idx) => {
                    const type = eventTypeConfig[ev.event_type] ?? eventTypeConfig.note
                    return (
                      <li key={ev.id} className={`ml-6 ${idx < events.length - 1 ? 'pb-6' : ''}`}>
                        <span className={`absolute -left-[1.1rem] flex items-center justify-center w-8 h-8 rounded-full border-2 border-white ${type.color.split(' ')[0]}`}>
                          {type.icon}
                        </span>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{ev.title}</p>
                              {ev.description && (
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ev.description}</p>
                              )}
                            </div>
                            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${type.color}`}>
                              {type.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">{fmtDateTime(ev.event_date)}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>

          {/* ── RIGHT: files + metadata ─────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Metadata card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print:shadow-none print:border print:border-gray-300">
              <h3 className="text-gray-800 font-semibold mb-4">Info</h3>
              <dl className="space-y-3 text-sm">
                {[
                  { label: 'ID', value: exp.id },
                  { label: 'Category', value: exp.category },
                  { label: 'Phase', value: exp.phase },
                  { label: 'Researcher', value: exp.researcher_name },
                  { label: 'Started', value: fmtDate(exp.started_at) },
                  { label: 'Due', value: fmtDate(exp.due_date) },
                  { label: 'Created', value: fmtDate(exp.created_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <dt className="text-gray-400 text-xs shrink-0">{label}</dt>
                    <dd className="text-gray-700 text-xs font-medium text-right">{value ?? '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Data Files */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print:shadow-none print:border print:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-800 font-semibold">Data Files</h3>
                {canModify && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition disabled:opacity-60 print:hidden"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Upload
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.tif,.tiff,.doc,.docx,.txt"
              />

              {files.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center print:hidden">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No files uploaded yet</p>
                  {canModify && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                    >
                      Upload first file
                    </button>
                  )}
                </div>
              ) : (
                <ul className="space-y-2">
                  {files.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl group"
                    >
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{f.file_name}</p>
                        {f.file_size && <p className="text-xs text-gray-400">{fmtBytes(f.file_size)}</p>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition print:hidden">
                        <button onClick={() => downloadFile(f)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button onClick={() => deleteFile(f)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Related notebook entries link */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print:hidden">
              <h3 className="text-gray-800 font-semibold mb-3">Related</h3>
              <Link
                to="/lab-notebook"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition"
              >
                <FileText className="w-4 h-4" />
                View lab notebook entries for {exp.id}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles injected as a style tag */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:flex { display: flex !important; }
          .print\\:border { border-width: 1px !important; }
          .print\\:border-gray-300 { border-color: #d1d5db !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:space-y-4 > * + * { margin-top: 1rem !important; }
        }
      `}</style>
    </>
  )
}
