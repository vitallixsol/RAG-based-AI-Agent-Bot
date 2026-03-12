import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatCard, Card, CardHeader, CardBody, Button, TypeBadge, EmptyState } from '../components/ui'
import KnowledgeModal from '../components/KnowledgeModal'
import { knowledgeApi } from '../lib/api'
import { Stats, KnowledgeEntry } from '../types'

function fmt(iso: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<KnowledgeEntry[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    try {
      const [statsRes, kbRes] = await Promise.all([knowledgeApi.getStats(), knowledgeApi.getAll()])
      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      if (kbRes.success && kbRes.data) setRecent(kbRes.data.slice(0, 6))
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--muted)' }}>
      <RefreshCw size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 13 }}>Overview of your AI knowledge platform</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={load}>Refresh</Button>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setModalOpen(true)}>Add Knowledge</Button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Entries" value={stats?.total ?? 0} sub="Knowledge items" />
        <StatCard label="Categories" value={stats?.categories ?? 0} sub="Active types" accent="var(--accent2)" />
        <StatCard label="Queries Today" value={stats?.todayQueries ?? 0} sub="User questions" accent="var(--amber)" />
        <StatCard label="Last Trained" value={stats?.lastTrained ? '✅ Trained' : '⚠️ Untrained'}
          sub={fmt(stats?.lastTrained ?? null)} accent="var(--accent3)" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Quick Add */}
        <Card>
          <CardHeader>⚡ Quick Add Entry</CardHeader>
          <CardBody>
            <QuickAddForm onAdded={load} />
          </CardBody>
        </Card>

        {/* Recent */}
        <Card>
          <CardHeader actions={<Button variant="ghost" size="sm" onClick={() => navigate('/admin/knowledge')}>View all →</Button>}>
            📝 Recent Entries
          </CardHeader>
          <div style={{ overflowX: 'auto' }}>
            {recent.length === 0
              ? <EmptyState icon="📭" title="No entries yet" description="Click Add Knowledge to start" />
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Topic', 'Type', 'Added'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 16px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid rgba(28,36,56,0.5)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.question}</td>
                        <td style={{ padding: '10px 16px' }}><TypeBadge type={e.type} /></td>
                        <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{fmt(e.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </Card>
      </div>

      {/* Training CTA */}
      <Card>
        <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🧠 Ready to train your AI?</div>
            <div style={{ color: 'var(--text-soft)', fontSize: 13 }}>
              {stats?.total ? `${stats.total} entries ready. Train to update the AI model with your latest knowledge.` : 'Add knowledge entries first, then train the AI model.'}
            </div>
          </div>
          <Button variant="success" icon={<Zap size={14} />} onClick={() => navigate('/admin/training')}>
            Go to Training
          </Button>
        </CardBody>
      </Card>

      <KnowledgeModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  )
}

// Quick Add inline form
function QuickAddForm({ onAdded }: { onAdded: () => void }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [type, setType] = useState('faq')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!question.trim() || !answer.trim()) { toast.error('Fill in question and answer'); return }
    setSaving(true)
    try {
      await knowledgeApi.create({ type: type as 'faq', question, answer, tags: [], priority: 'normal' })
      toast.success('Entry added!')
      setQuestion(''); setAnswer('')
      onAdded()
    } catch { toast.error('Failed to add entry') }
    finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        <option value="faq">FAQ</option>
        <option value="product">Product Info</option>
        <option value="policy">Policy</option>
        <option value="general">General</option>
      </select>
      <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question / Topic..." style={inputStyle} />
      <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Detailed answer..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.6 }} />
      <Button variant="primary" loading={saving} style={{ width: '100%', justifyContent: 'center' }} onClick={save}>
        Add to Knowledge Base
      </Button>
    </div>
  )
}
