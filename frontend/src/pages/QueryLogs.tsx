import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardHeader, Button, EmptyState } from '../components/ui'
import { logsApi } from '../lib/api'
import { QueryLog } from '../types'

export default function QueryLogs() {
  const [logs, setLogs] = useState<QueryLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await logsApi.getAll()
      if (r.success && r.data) setLogs(r.data)
    } catch { toast.error('Failed to load logs') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const clearAll = async () => {
    if (!confirm('Clear all query logs?')) return
    try {
      await logsApi.clear()
      setLogs([])
      toast.success('Logs cleared')
    } catch { toast.error('Failed to clear') }
  }

  const todayCount = logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Query Logs</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 13 }}>{logs.length} total · {todayCount} today</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={load}>Refresh</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={clearAll}>Clear All</Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
        ) : logs.length === 0 ? (
          <EmptyState icon="💬" title="No queries yet" description="User queries from the chatbot will appear here" />
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {logs.map(log => (
              <div key={log.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px',
                animation: 'fadeIn 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={14} color="var(--accent)" />
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{log.query}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: 16 }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, paddingLeft: 22, borderLeft: '2px solid var(--border)' }}>
                  🤖 {log.response.slice(0, 300)}{log.response.length > 300 ? '…' : ''}
                </div>
                {log.matchedEntries.length > 0 && (
                  <div style={{ marginTop: 8, paddingLeft: 22, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    📚 Matched {log.matchedEntries.length} knowledge {log.matchedEntries.length === 1 ? 'entry' : 'entries'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
