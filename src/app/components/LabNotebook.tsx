import { useState, useEffect } from 'react'
import {
  BookOpen, Plus, Search, ChevronRight, FlaskConical, Calendar,
  User, Tag, Edit3, Save, Paperclip, Image, Table, Bold,
  Italic, List, Hash, Loader2, X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { LabNote, Experiment } from '../../lib/database.types'
import { format, parseISO } from 'date-fns'

const defaultContent = `## Objective
Describe the purpose and goals of this experiment entry.

## Materials & Reagents
- Reagent A (Cat# 12345): 10 mM stock
- Buffer B: 50 mM PBS, pH 7.4
- Cell line: HeLa (ATCC CCL-2)

## Procedure
1. Prepare serial dilutions of test compound (0.1 – 100 μM)
2. Seed cells at 5 × 10⁴ cells/well in 96-well plate
3. Incubate for 24h at 37°C, 5% CO₂
4. Add compound and incubate for additional 48h

## Observations
Record all observations here, including unexpected findings.

## Results
| Concentration (μM) | Viability (%) |
|---|---|
| 0.1 | 98.2 |
| 1.0 | 87.4 |
| 10 | 42.1 |
| 100 | 5.3 |

## Conclusions
Summarize key findings and next steps.`

function fmtDate(d: string) {
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return d }
}

function nextNoteId(existing: LabNote[]) {
  const now = new Date()
  const year = now.getFullYear()
  const nums = existing
    .filter((n) => n.id.startsWith(`NB-${year}`))
    .map((n) => parseInt(n.id.split('-')[2]))
    .filter((n) => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `NB-${year}-${String(max + 1).padStart(3, '0')}`
}

export function LabNotebook() {
  const { profile } = useAuth()

  const [notes, setNotes] = useState<LabNote[]>([])
  const [experiments, setExperiments] = useState<Pick<Experiment, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState<LabNote | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(defaultContent)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ title: '', experiment_id: '', tags: '' })
  const [creatingNote, setCreatingNote] = useState(false)

  const canEdit = (note: LabNote) =>
    profile?.role === 'lab_manager' || note.researcher_id === profile?.id
  const canCreate = profile?.role !== 'reviewer'

  // ── load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [notesRes, expsRes] = await Promise.all([
        supabase.from('lab_notes').select('*').order('created_at', { ascending: false }),
        supabase.from('experiments').select('id, name').eq('status', 'In Progress'),
      ])
      const notesData = notesRes.data ?? []
      setNotes(notesData)
      setExperiments(expsRes.data ?? [])
      if (notesData.length) {
        setSelectedNote(notesData[0])
        setContent(notesData[0].content || defaultContent)
      }
      setLoading(false)
    }
    load()
  }, [])

  // ── save content ───────────────────────────────────────────────────────────
  async function saveContent() {
    if (!selectedNote) return
    setSaving(true)
    const { error } = await supabase
      .from('lab_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', selectedNote.id)
    setSaving(false)
    if (error) { alert('Save failed: ' + error.message); return }
    setNotes((prev) => prev.map((n) => n.id === selectedNote.id ? { ...n, content } : n))
    setIsEditing(false)
  }

  // ── create note ────────────────────────────────────────────────────────────
  async function createNote() {
    if (!newForm.title.trim() || !profile) return
    setCreatingNote(true)
    const id = nextNoteId(notes)
    const tags = newForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
    const { data, error } = await supabase
      .from('lab_notes')
      .insert({
        id,
        title: newForm.title,
        content: defaultContent,
        experiment_id: newForm.experiment_id || null,
        researcher_id: profile.id,
        tags,
        has_attachments: false,
        has_images: false,
      })
      .select()
      .single()
    setCreatingNote(false)
    if (error) { alert('Error: ' + error.message); return }
    if (data) {
      setNotes((prev) => [data, ...prev])
      setSelectedNote(data)
      setContent(defaultContent)
      setIsEditing(true)
    }
    setShowNew(false)
    setNewForm({ title: '', experiment_id: '', tags: '' })
  }

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.experiment_id?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Entry List Panel */}
      <div className="w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-800">Entries</h3>
            {canCreate && (
              <button onClick={() => setShowNew(true)}
                className="w-7 h-7 flex items-center justify-center bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] transition">
                <Plus className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-blue-300 animate-spin" /></div>}
          {!loading && filtered.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No entries found.</p>
          )}
          {filtered.map((note) => (
            <button key={note.id} onClick={() => { setSelectedNote(note); setContent(note.content || defaultContent); setIsEditing(false) }}
              className={`w-full text-left p-4 hover:bg-gray-50 transition ${selectedNote?.id === note.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs text-blue-600 font-semibold">{note.id}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              </div>
              <p className="text-sm text-gray-800 font-medium leading-snug mb-1">{note.title}</p>
              {note.experiment_id && (
                <div className="flex items-center gap-1.5 mb-2">
                  <FlaskConical className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{note.experiment_id}</span>
                </div>
              )}
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {(note.content || '').replace(/#+\s/g, '').slice(0, 100)}…
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{fmtDate(note.created_at)}</span>
                <div className="flex gap-1">
                  {note.has_attachments && <Paperclip className="w-3 h-3 text-gray-400" />}
                  {note.has_images && <Image className="w-3 h-3 text-gray-400" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Editor Panel */}
      {selectedNote ? (
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-blue-600 font-semibold">{selectedNote.id}</span>
                  {selectedNote.experiment_id && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <div className="flex items-center gap-1">
                        <FlaskConical className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{selectedNote.experiment_id}</span>
                      </div>
                    </>
                  )}
                </div>
                <h2 className="text-gray-800">{selectedNote.title}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {/* PII: researcher email masked */}
                      {selectedNote.researcher_id === profile?.id
                        ? (profile?.full_name ?? profile?.email ?? 'You')
                        : 'Researcher'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{fmtDate(selectedNote.created_at)}</span>
                  </div>
                  {selectedNote.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      <div className="flex gap-1">
                        {selectedNote.tags.map((t) => (
                          <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {canEdit(selectedNote) && (
                  isEditing ? (
                    <>
                      <button onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm transition">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={saveContent} disabled={saving}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Formatting Toolbar */}
          {isEditing && (
            <div className="px-6 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-1 flex-wrap">
              {[
                { icon: Bold, label: 'Bold', action: () => setContent((c) => c + '\n**bold text**') },
                { icon: Italic, label: 'Italic', action: () => setContent((c) => c + '\n*italic text*') },
                { icon: Hash, label: 'Heading', action: () => setContent((c) => c + '\n## Heading') },
                { icon: List, label: 'List', action: () => setContent((c) => c + '\n- Item') },
                { icon: Table, label: 'Table', action: () => setContent((c) => c + '\n| Col 1 | Col 2 |\n|---|---|\n| val | val |') },
                { icon: Image, label: 'Image', action: () => {} },
                { icon: Paperclip, label: 'Attach', action: () => {} },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} title={label} onClick={action}
                  className="w-8 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600 transition">
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isEditing ? (
              <textarea value={content} onChange={(e) => setContent(e.target.value)}
                className="w-full h-full min-h-[400px] text-sm text-gray-700 bg-transparent resize-none focus:outline-none font-mono leading-relaxed"
                placeholder="Start writing your lab notes…" />
            ) : (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {content.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} className="text-gray-800 mt-5 mb-2">{line.replace('## ', '')}</h3>
                  if (line.startsWith('| ')) return <div key={i} className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-3 py-0.5">{line}</div>
                  if (line.startsWith('- ') || /^\d+\./.test(line)) return <p key={i} className="text-sm text-gray-600 my-0.5 pl-4">{line}</p>
                  if (line.trim() === '') return <div key={i} className="h-2" />
                  return <p key={i} className="text-sm text-gray-700 my-0.5">{line}</p>
                })}
              </div>
            )}
          </div>

          {/* Attachments footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2 font-medium">Attachments</p>
            <div className="flex gap-2 flex-wrap">
              <button className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500 transition">
                <Plus className="w-3 h-3" /> Add file
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Select a notebook entry or create a new one.</p>
          </div>
        </div>
      )}

      {/* New Entry Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-800">New Notebook Entry</h3>
                  <p className="text-xs text-gray-500">Create a new lab notebook record</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Entry Title *</label>
                <input type="text" value={newForm.title} onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Day 1 – Initial Observations"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition" />
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Linked Experiment</label>
                <select value={newForm.experiment_id} onChange={(e) => setNewForm((f) => ({ ...f, experiment_id: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none">
                  <option value="">— None —</option>
                  {experiments.map((e) => (
                    <option key={e.id} value={e.id}>{e.id} – {e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Tags (comma-separated)</label>
                <input type="text" value={newForm.tags} onChange={(e) => setNewForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="e.g. cytotoxicity, day-1, compound-X"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNew(false)}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={createNote} disabled={creatingNote || !newForm.title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-medium transition disabled:opacity-60">
                {creatingNote && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
