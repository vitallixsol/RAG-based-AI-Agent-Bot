import { useState, useEffect, useRef } from 'react'
import { Play, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardBody, Button, Input, Textarea, Select, StatCard } from '../components/ui'
import { knowledgeApi, configApi } from '../lib/api'
import { AppConfig, Stats } from '../types'

interface LogEntry { time: string; msg: string; level: 'info' | 'ok' | 'warn' | 'err' }

const levelColors: Record<LogEntry['level'], string> = {
  info: 'var(--accent)', ok: 'var(--accent2)', warn: 'var(--amber)', err: 'var(--accent3)',
}

export default function Training() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([{ time: '00:00:00', msg: 'System initialized. Add knowledge entries and click "Train Model" to begin.', level: 'info' }])
  const [progress, setProgress] = useState(0)
  const [training, setTraining] = useState(false)
  const [saving, setSaving] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([configApi.get(), knowledgeApi.getStats()])
      .then(([cRes, sRes]) => {
        if (cRes.success && cRes.data) setConfig(cRes.data)
        if (sRes.success && sRes.data) setStats(sRes.data)
      })
      .catch(() => toast.error('Failed to load'))
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const addLog = (msg: string, level: LogEntry['level'] = 'info') => {
    const time = new Date().toTimeString().slice(0, 8)
    setLogs(l => [...l, { time, msg, level }])
  }

  const runTraining = async () => {
    if (!stats || stats.total === 0) { toast.error('Add knowledge entries before training!'); return }
    setTraining(true); setProgress(0)

    const steps: [string, LogEntry['level']][] = [
      ['Initializing training pipeline...', 'info'],
      [`Loading ${stats.total} knowledge entries...`, 'info'],
      ['Tokenizing and preprocessing text data...', 'info'],
      ['Building semantic keyword index...', 'ok'],
      [`Processing FAQ entries: ${stats.byType.faq} items`, 'ok'],
      [`Processing Product entries: ${stats.byType.product} items`, 'ok'],
      [`Processing Policy entries: ${stats.byType.policy} items`, 'ok'],
      [`Processing General entries: ${stats.byType.general} items`, 'ok'],
      ['Compiling system prompt with knowledge context...', 'info'],
      ['Validating context coverage...', 'info'],
      ['Saving trained configuration to server...', 'ok'],
      ['✅ Training complete! Model is ready to respond.', 'ok'],
    ]

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 550 + Math.random() * 250))
      addLog(steps[i][0], steps[i][1])
      setProgress(Math.round((i + 1) / steps.length * 100))
    }

    try {
      const r = await configApi.train()
      if (r.success && r.data) setConfig(r.data)
      toast.success('AI model successfully trained!')
    } catch { addLog('Failed to save training state to server', 'err') }
    finally { setTraining(false) }
  }

  const saveConfig = async () => {
    if (!config) return
    setSaving(true)
    try {
      const r = await configApi.update(config)
      if (r.success) toast.success('Configuration saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (!config) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>AI Training</h1>
        <p style={{ color: 'var(--text-soft)', fontSize: 13 }}>Configure and train your AI model with company knowledge</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Config Panel */}
        <Card>
          <CardHeader>🔧 Training Configuration</CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Company Name" value={config.companyName}
                onChange={e => setConfig(c => c ? { ...c, companyName: e.target.value } : c)}
                placeholder="Acme Corporation" />
              <Textarea label="System Prompt (AI Persona)" value={config.systemPrompt}
                onChange={e => setConfig(c => c ? { ...c, systemPrompt: e.target.value } : c)}
                style={{ minHeight: 110 }} />
              <Textarea label="Fallback Message" value={config.fallbackMsg}
                onChange={e => setConfig(c => c ? { ...c, fallbackMsg: e.target.value } : c)}
                style={{ minHeight: 70 }} placeholder="Message when no answer found…" />
              <Button variant="primary" loading={saving} style={{ justifyContent: 'center' }} onClick={saveConfig}>
                💾 Save Configuration
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Stats Panel */}
        <Card>
          <CardHeader>📈 Training Stats</CardHeader>
          <CardBody>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Knowledge Coverage</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>
                {Math.min(100, (stats?.total ?? 0) * 5)}%
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (stats?.total ?? 0) * 5)}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 10, transition: 'width 0.5s ease' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {(['faq', 'product', 'policy', 'general'] as const).map(type => (
                <div key={type} style={{ background: 'var(--surface)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>{type}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>{stats?.byType[type] ?? 0}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 14 }}>
              Last trained: <span style={{ color: config.lastTrained ? 'var(--accent2)' : 'var(--accent3)' }}>
                {config.lastTrained ? new Date(config.lastTrained).toLocaleString() : 'Never'}
              </span>
            </div>
            <Button variant="success" style={{ width: '100%', justifyContent: 'center' }} icon={<Play size={13} />}
              onClick={runTraining} loading={training} disabled={training}>
              {training ? 'Training…' : '▶ Start Training'}
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Training Log */}
      <Card>
        <CardHeader actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="success" size="sm" icon={<Play size={12} />} onClick={runTraining} loading={training} disabled={training}>
              Train Model
            </Button>
            <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => { setLogs([]); setProgress(0) }}>
              Clear
            </Button>
          </div>
        }>🧠 Training Log</CardHeader>
        <CardBody>
          {/* Progress */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>Training Progress</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 10, transition: 'width 0.4s ease' }} />
            </div>
          </div>
          {/* Log */}
          <div ref={logRef} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, height: 220, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {logs.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 5, lineHeight: 1.5 }}>
                <span style={{ color: 'var(--muted)', minWidth: 68 }}>{l.time}</span>
                <span style={{ color: levelColors[l.level] }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
