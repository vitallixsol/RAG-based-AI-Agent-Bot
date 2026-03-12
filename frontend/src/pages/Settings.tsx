import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardBody, Button, Input, Textarea } from '../components/ui'
import { configApi, knowledgeApi } from '../lib/api'
import { AppConfig } from '../types'

export default function Settings() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    configApi.get().then(r => { if (r.success && r.data) setConfig(r.data) }).catch(() => toast.error('Failed to load'))
  }, [])

  const save = async () => {
    if (!config) return
    setSaving(true)
    try {
      await configApi.update(config)
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const set = (key: keyof AppConfig, val: string) => setConfig(c => c ? { ...c, [key]: val } : c)

  const clearAll = async () => {
    if (!confirm('Delete ALL knowledge entries? This cannot be undone.')) return
    try {
      const r = await knowledgeApi.getAll()
      if (r.success && r.data) await Promise.all(r.data.map(e => knowledgeApi.delete(e.id)))
      toast.success('All knowledge data cleared')
    } catch { toast.error('Failed to clear data') }
  }

  if (!config) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--text-soft)', fontSize: 13 }}>Configure chatbot appearance and behavior</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card>
          <CardHeader>💬 Chatbot Settings</CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Chatbot Title" value={config.chatbotTitle} onChange={e => set('chatbotTitle', e.target.value)} placeholder="Company Assistant" />
              <Textarea label="Welcome Message" value={config.welcomeMsg} onChange={e => set('welcomeMsg', e.target.value)} style={{ minHeight: 80 }} />
              <Input label="Primary Color (hex)" value={config.primaryColor} onChange={e => set('primaryColor', e.target.value)} placeholder="#4f7cff" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: config.primaryColor, border: '1px solid var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>Color preview</span>
              </div>
              <Button variant="primary" loading={saving} icon={<Save size={13} />} style={{ justifyContent: 'center' }} onClick={save}>
                Save Settings
              </Button>
            </div>
          </CardBody>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <CardHeader>ℹ️ System Info</CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Backend', 'Node.js + Express'],
                  ['Frontend', 'React + TypeScript + Vite'],
                  ['AI Model', 'Claude Sonnet (Anthropic)'],
                  ['Storage', 'In-memory (upgrade to DB)'],
                  ['Context Matching', 'Keyword scoring (upgrade to embeddings)'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-soft)' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 12 }}>{v}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>⚠️ Danger Zone</CardHeader>
            <CardBody>
              <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 14, lineHeight: 1.6 }}>
                These actions are destructive and cannot be undone. Please proceed with caution.
              </p>
              <Button variant="danger" style={{ width: '100%', justifyContent: 'center' }} onClick={clearAll}>
                🗑️ Delete All Knowledge Data
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
