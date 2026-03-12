import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Modal, Button, Input, Textarea, Select, TagInput } from './ui'
import { knowledgeApi } from '../lib/api'
import { KnowledgeEntry, KnowledgeType, Priority } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  entry?: KnowledgeEntry | null
}

const emptyForm = { type: 'faq' as KnowledgeType, question: '', answer: '', tags: [] as string[], priority: 'normal' as Priority }

export default function KnowledgeModal({ open, onClose, onSaved, entry }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (entry) {
      setForm({ type: entry.type, question: entry.question, answer: entry.answer, tags: entry.tags, priority: entry.priority })
    } else {
      setForm(emptyForm)
    }
  }, [entry, open])

  const set = (key: keyof typeof form, val: unknown) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Question and answer are required')
      return
    }
    setSaving(true)
    try {
      if (entry) {
        await knowledgeApi.update(entry.id, form)
        toast.success('Entry updated')
      } else {
        await knowledgeApi.create(form)
        toast.success('Entry added to knowledge base')
      }
      onSaved()
      onClose()
    } catch {
      toast.error('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? '✏️ Edit Knowledge Entry' : '📝 Add Knowledge Entry'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {entry ? 'Update Entry' : 'Add Entry'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Select label="Category Type" value={form.type} onChange={e => set('type', e.target.value)}>
          <option value="faq">FAQ — Question & Answer</option>
          <option value="product">Product Information</option>
          <option value="policy">Company Policy</option>
          <option value="general">General Information</option>
        </Select>

        <Input
          label="Question / Topic Title"
          placeholder="e.g. What are your business hours?"
          value={form.question}
          onChange={e => set('question', e.target.value)}
        />

        <Textarea
          label="Detailed Answer / Content"
          placeholder="Write a comprehensive, accurate answer. The AI will use this to respond to user queries..."
          value={form.answer}
          onChange={e => set('answer', e.target.value)}
          style={{ minHeight: 140 }}
        />

        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>Keywords / Tags</div>
          <TagInput tags={form.tags} onChange={tags => set('tags', tags)} />
        </div>

        <Select label="Priority" value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
          <option value="high">High — Answers first</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </Select>
      </div>
    </Modal>
  )
}
