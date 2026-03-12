import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, Settings, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { chatApi, configApi } from '../lib/api'
import { ChatMessage, AppConfig } from '../types'
import { v4 as uuid } from 'crypto'

// uuid shim for browser
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

const SUGGESTIONS = [
  { icon: '❓', text: 'What services do you offer?' },
  { icon: '💼', text: 'Tell me about your products' },
  { icon: '📞', text: 'How can I contact support?' },
  { icon: '🔄', text: 'What is your refund policy?' },
]

export default function Chatbot() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    configApi.get().then(r => { if (r.success && r.data) setConfig(r.data) }).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim()
    if (!query || loading) return

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: query, timestamp: new Date().toISOString() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const r = await chatApi.send(query, history)
      if (r.success && r.data) {
        const botMsg: ChatMessage = {
          id: uid(), role: 'assistant',
          content: r.data.reply,
          sources: r.data.sources,
          timestamp: new Date().toISOString(),
        }
        setMessages(m => [...m, botMsg])
      } else {
        throw new Error(r.message)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get response'
      toast.error(msg)
      setMessages(m => [...m, {
        id: uid(), role: 'assistant',
        content: config?.fallbackMsg ?? "I'm sorry, I encountered an issue. Please try again.",
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const primaryColor = config?.primaryColor || '#5b8cff'

  return (
    <div style={{
      background: '#f0f2f8',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0,
        background: `radial-gradient(ellipse at 25% 45%, ${primaryColor}10 0%, transparent 55%), radial-gradient(ellipse at 75% 25%, #00d9a310 0%, transparent 45%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 760,
        background: '#ffffff',
        borderRadius: 20,
        boxShadow: '0 20px 80px rgba(20,30,60,0.12)',
        display: 'flex', flexDirection: 'column',
        height: '87vh', maxHeight: 780,
        overflow: 'hidden',
        border: '1px solid #e4e8f0',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e4e8f0',
          padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40,
              background: `linear-gradient(135deg, ${primaryColor}, #00d9a3)`,
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>🤖</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: '#1a1f35' }}>
                {config?.chatbotTitle || 'Company Assistant'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#00d9a3' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d9a3', animation: 'pulse 2s infinite' }} />
                Online · AI Powered
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setMessages([])}
              style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f6fa', border: '1px solid #e4e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8892ab' }}
              title="Clear chat"
            ><Trash2 size={13} /></button>
            <a href="/admin/dashboard"
              style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f6fa', border: '1px solid #e4e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8892ab' }}
              title="Admin Panel"
            ><Settings size={13} /></a>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '20px 16px' }}>
              <div style={{
                width: 68, height: 68,
                background: `linear-gradient(135deg, ${primaryColor}, #00d9a3)`,
                borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34, marginBottom: 18,
                boxShadow: `0 12px 40px ${primaryColor}30`,
              }}>🧠</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: '#1a1f35', marginBottom: 8 }}>
                {config?.welcomeMsg || 'Hello! How can I help?'}
              </div>
              <div style={{ fontSize: 14, color: '#8892ab', marginBottom: 28, lineHeight: 1.6, maxWidth: 380 }}>
                I'm trained on company knowledge and ready to answer your questions accurately.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 460 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s.text} onClick={() => handleSend(s.text)}
                    style={{
                      background: '#f5f7fb', border: '1px solid #e4e8f0', borderRadius: 10,
                      padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.18s', fontSize: 13, color: '#1a1f35', fontFamily: "'Outfit', sans-serif",
                    }}
                    onMouseEnter={e => { (e.currentTarget).style.borderColor = primaryColor; (e.currentTarget).style.background = primaryColor + '08' }}
                    onMouseLeave={e => { (e.currentTarget).style.borderColor = '#e4e8f0'; (e.currentTarget).style.background = '#f5f7fb' }}
                  >
                    <span style={{ fontSize: 18, display: 'block', marginBottom: 5 }}>{s.icon}</span>
                    <span style={{ fontWeight: 500 }}>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                animation: 'fadeIn 0.25s ease',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0, marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                  background: msg.role === 'user'
                    ? '#f0f2f8' : `linear-gradient(135deg, ${primaryColor}, #00d9a3)`,
                  border: msg.role === 'user' ? '1px solid #e4e8f0' : 'none',
                }}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div style={{ maxWidth: '72%' }}>
                  <div style={{
                    padding: '11px 15px', borderRadius: 13, fontSize: 14, lineHeight: 1.65,
                    ...(msg.role === 'user'
                      ? { background: primaryColor, color: '#fff', borderTopRightRadius: 4 }
                      : { background: '#fff', color: '#1a1f35', border: '1px solid #e4e8f0', borderTopLeftRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
                    ),
                  }}>
                    {msg.content.split('\n').map((line, i) => <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>)}

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {[...new Set(msg.sources.map(s => s.type))].map(type => (
                          <span key={type} style={{
                            background: `${primaryColor}12`, color: primaryColor,
                            border: `1px solid ${primaryColor}25`, borderRadius: 20,
                            padding: '2px 9px', fontSize: 10, fontFamily: "'DM Mono', monospace",
                          }}>📚 {type}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#b0b8cc', marginTop: 4, paddingLeft: 4, fontFamily: "'DM Mono', monospace", textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${primaryColor}, #00d9a3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
              <div style={{ background: '#fff', border: '1px solid #e4e8f0', borderRadius: 13, borderTopLeftRadius: 4, padding: '13px 16px', display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#b0b8cc', animation: `typingBounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ background: '#fff', borderTop: '1px solid #e4e8f0', padding: '14px 20px' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 10,
            background: '#f5f7fb', border: '2px solid #e4e8f0',
            borderRadius: 13, padding: '9px 13px',
            transition: 'border-color 0.18s',
          }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = primaryColor)}
            onBlurCapture={e => (e.currentTarget.style.borderColor = '#e4e8f0')}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask anything…"
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#1a1f35', resize: 'none', lineHeight: 1.5, minHeight: 22, maxHeight: 110, fontFamily: "'Outfit', sans-serif" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              style={{
                width: 34, height: 34, borderRadius: 9, border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                background: input.trim() && !loading ? primaryColor : '#e4e8f0',
                color: input.trim() && !loading ? '#fff' : '#b0b8cc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s', flexShrink: 0,
              }}
            >
              <Send size={14} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#b0b8cc', textAlign: 'center', marginTop: 7, fontFamily: "'DM Mono', monospace" }}>
            Press Enter to send · Shift+Enter for new line · Powered by <a href="/admin/dashboard" style={{ color: primaryColor }}>NeuralBase</a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typingBounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-5px);opacity:1} }
      `}</style>
    </div>
  )
}
