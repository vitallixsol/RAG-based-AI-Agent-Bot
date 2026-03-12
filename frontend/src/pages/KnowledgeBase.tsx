import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, Download, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardHeader, Button, TypeBadge, EmptyState } from '../components/ui'
import KnowledgeModal from '../components/KnowledgeModal'
import { knowledgeApi } from '../lib/api'
import { KnowledgeEntry, KnowledgeType } from '../types'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function KnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<KnowledgeType | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await knowledgeApi.getAll()
      if (r.success && r.data) setEntries(r.data)
    } catch { toast.error('Failed to load knowledge base') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => entries.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q))
    const matchType = !filterType || e.type === filterType
    return matchSearch && matchType
  }), [entries, search, filterType])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge entry?')) return
    try {
      await knowledgeApi.delete(id)
      toast.success('Entry deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const handleExport = async () => {
    try {
      const blob = await knowledgeApi.export()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'neuralbase-export.json'; a.click()
      toast.success('Exported successfully')
    } catch { toast.error('Export failed') }
  }

  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
      const text = await file.text()
      try {
        const data = JSON.parse(text)
        const knowledge = data.knowledge || data
        if (Array.isArray(knowledge)) {
          await knowledgeApi.import(knowledge)
          toast.success(`Imported ${knowledge.length} entries`)
          load()
        } else toast.error('Invalid file format')
      } catch { toast.error('Failed to parse file') }
    }
    input.click()
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Knowledge Base</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 13 }}>{entries.length} entries · {new Set(entries.map(e => e.type)).size} categories</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm" icon={<Upload size={13} />} onClick={handleImport}>Import</Button>
          <Button variant="ghost" size="sm" icon={<Download size={13} />} onClick={handleExport}>Export</Button>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => { setEditEntry(null); setModalOpen(true) }}>Add Entry</Button>
        </div>
      </div>

      <Card>
        {/* Filters */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 13px',
          }}>
            <Search size={14} color="var(--muted)" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search knowledge base…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13 }}
            />
          </div>
          <select
            value={filterType} onChange={e => setFilterType(e.target.value as KnowledgeType | '')}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
          >
            <option value="">All Types</option>
            <option value="faq">FAQ</option>
            <option value="product">Product</option>
            <option value="policy">Policy</option>
            <option value="general">General</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📭" title="No entries found" description={search || filterType ? 'Try adjusting your search or filter' : 'Click "Add Entry" to start building your knowledge base'} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Question / Topic', 'Type', 'Tags', 'Priority', 'Added', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(28,36,56,0.6)' }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--card-hover)')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', maxWidth: 260 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.question}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{e.answer}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><TypeBadge type={e.type} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(e.tags || []).slice(0, 2).map(t => (
                          <span key={t} style={{ background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{t}</span>
                        ))}
                        {(e.tags || []).length > 2 && <span style={{ fontSize: 10, color: 'var(--muted)' }}>+{e.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)',
                        color: e.priority === 'high' ? 'var(--accent2)' : e.priority === 'low' ? 'var(--muted)' : 'var(--text-soft)',
                      }}>{e.priority}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{fmt(e.createdAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          onClick={() => { setEditEntry(e); setModalOpen(true) }}
                          style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition)' }}
                          onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (ev.currentTarget as HTMLButtonElement).style.color = 'var(--accent)' }}
                          onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (ev.currentTarget as HTMLButtonElement).style.color = 'var(--muted)' }}
                        ><Pencil size={11} /></button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition)' }}
                          onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent3)'; (ev.currentTarget as HTMLButtonElement).style.color = 'var(--accent3)' }}
                          onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (ev.currentTarget as HTMLButtonElement).style.color = 'var(--muted)' }}
                        ><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <KnowledgeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditEntry(null) }}
        onSaved={load}
        entry={editEntry}
      />
    </div>
  )
}
