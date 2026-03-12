import React, { useState, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { KnowledgeType } from '../types'

// ── Button ─────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({ variant = 'ghost', size = 'md', loading, icon, children, style, ...props }: BtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)',
    fontWeight: 500, cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'all var(--transition)',
    padding: size === 'sm' ? '6px 12px' : '9px 18px',
    fontSize: size === 'sm' ? 12 : 13,
    opacity: props.disabled ? 0.5 : 1,
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#fff' },
    ghost: { background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' },
    danger: { background: 'rgba(255,107,107,0.1)', color: 'var(--accent3)', border: '1px solid rgba(255,107,107,0.2)' },
    success: { background: 'var(--accent2-dim)', color: 'var(--accent2)', border: '1px solid rgba(0,217,163,0.2)' },
    outline: { background: 'transparent', color: 'var(--text-soft)', border: '1px solid var(--border)' },
  }
  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...props} disabled={props.disabled || loading}>
      {loading ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : icon}
      {children}
    </button>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...style,
    }}>{children}</div>
  )
}

export function CardHeader({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{children}</div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  )
}

export function CardBody({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ padding: 20, ...style }}>{children}</div>
}

// ── Input ──────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <Label>{label}</Label>}
      <input
        style={{
          width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '9px 13px', color: 'var(--text)',
          fontSize: 13, outline: 'none', transition: 'border-color var(--transition)',
          ...style,
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        {...props}
      />
    </div>
  )
}

// ── Textarea ───────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, style, ...props }: TextareaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <Label>{label}</Label>}
      <textarea
        style={{
          width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '9px 13px', color: 'var(--text)',
          fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 90,
          lineHeight: 1.65, transition: 'border-color var(--transition)', ...style,
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        {...props}
      />
    </div>
  )
}

// ── Select ─────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, children, style, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <Label>{label}</Label>}
      <select
        style={{
          width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '9px 13px', color: 'var(--text)',
          fontSize: 13, outline: 'none', cursor: 'pointer', ...style,
        }}
        {...props}
      >{children}</select>
    </div>
  )
}

// ── Label ──────────────────────────────────────────────────────────────────
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-soft)',
      textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500,
    }}>{children}</label>
  )
}

// ── Tag Badge ──────────────────────────────────────────────────────────────
const typeBadgeColors: Record<KnowledgeType, { bg: string; color: string }> = {
  faq: { bg: 'var(--accent-dim)', color: 'var(--accent)' },
  product: { bg: 'rgba(245,158,11,0.12)', color: 'var(--amber)' },
  policy: { bg: 'var(--accent2-dim)', color: 'var(--accent2)' },
  general: { bg: 'rgba(86,96,112,0.2)', color: 'var(--muted)' },
}

export function TypeBadge({ type }: { type: KnowledgeType }) {
  const { bg, color } = typeBadgeColors[type]
  return (
    <span style={{
      background: bg, color, borderRadius: 20, padding: '3px 10px',
      fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500,
      display: 'inline-block',
    }}>{type}</span>
  )
}

// ── Tag Input ──────────────────────────────────────────────────────────────
export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (val: string) => {
    const trimmed = val.trim().replace(/,/g, '')
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed])
    setInputVal('')
  }

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag))

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '7px 10px', minHeight: 42, cursor: 'text',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <span key={tag} style={{
          background: 'var(--accent-dim)', color: 'var(--accent)',
          border: '1px solid rgba(91,140,255,0.2)', borderRadius: 5,
          padding: '2px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {tag}
          <X size={10} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => { e.stopPropagation(); removeTag(tag) }} />
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inputVal) }
          if (e.key === 'Backspace' && !inputVal && tags.length) removeTag(tags[tags.length - 1])
        }}
        onBlur={() => { if (inputVal.trim()) addTag(inputVal) }}
        placeholder={tags.length === 0 ? 'Add tags (press Enter)…' : ''}
        style={{ flex: 1, minWidth: 100, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13 }}
      />
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode
}) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(7,9,15,0.85)',
        backdropFilter: 'blur(5px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.22s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 7, background: 'var(--surface)',
              border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          ><X size={14} /></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            padding: '14px 22px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0,
          }}>{footer}</div>
        )}
      </div>
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
      <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{description}</div>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -16, right: -16, width: 64, height: 64,
        borderRadius: '50%', background: accent || 'var(--accent)', opacity: 0.07,
      }} />
      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-soft)' }}>{sub}</div>}
    </div>
  )
}
