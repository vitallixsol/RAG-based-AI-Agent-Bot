import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, BookOpen, Zap, MessageSquare,
  Settings, Bot, Circle, ChevronRight
} from 'lucide-react'
import { knowledgeApi } from '../lib/api'

const navItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'workspace' },
  { path: '/admin/knowledge', icon: BookOpen, label: 'Knowledge Base', section: 'workspace' },
  { path: '/admin/training', icon: Zap, label: 'AI Training', section: 'workspace' },
  { path: '/admin/logs', icon: MessageSquare, label: 'Query Logs', section: 'analytics' },
  { path: '/admin/settings', icon: Settings, label: 'Settings', section: 'analytics' },
]

const styles: Record<string, React.CSSProperties> = {
  layout: { display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' },
  sidebar: {
    width: 248, minHeight: '100vh', background: 'var(--surface)',
    borderRight: '1px solid var(--border)', display: 'flex',
    flexDirection: 'column', flexShrink: 0,
  },
  logo: {
    padding: '24px 20px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  logoIcon: {
    width: 38, height: 38,
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    borderRadius: 11, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 19, flexShrink: 0,
  },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, letterSpacing: -0.5 },
  logoSub: { fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: 2, marginTop: 1 },
  nav: { flex: 1, padding: '16px 12px', overflowY: 'auto' },
  navSection: { marginBottom: 24 },
  navLabel: {
    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const,
    color: 'var(--muted)', fontFamily: 'var(--font-mono)', padding: '0 10px', marginBottom: 6,
    display: 'block',
  },
  footer: { padding: 14, borderTop: '1px solid var(--border)' },
  statusPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--accent2-dim)', border: '1px solid rgba(0,217,163,0.2)',
    borderRadius: 8, padding: '9px 12px', fontSize: 12,
    color: 'var(--accent2)', fontFamily: 'var(--font-mono)',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: {
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    padding: '0 28px', height: 60, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexShrink: 0,
  },
  content: { flex: 1, overflowY: 'auto', padding: 28 },
}

export default function AdminLayout() {
  const location = useLocation()
  const [kbCount, setKbCount] = useState(0)

  useEffect(() => {
    knowledgeApi.getStats().then(r => { if (r.success && r.data) setKbCount(r.data.total) }).catch(() => {})
  }, [location.pathname])

  const currentPage = navItems.find(n => location.pathname === n.path)?.label || 'Admin'

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🧠</div>
          <div>
            <div style={styles.logoText}>NeuralBase</div>
            <div style={styles.logoSub}>Admin Panel</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {['workspace', 'analytics'].map(section => (
            <div key={section} style={styles.navSection}>
              <span style={styles.navLabel}>{section}</span>
              {navItems.filter(n => n.section === section).map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent)' : 'var(--text-soft)',
                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                    transition: 'all var(--transition)', marginBottom: 2,
                    textDecoration: 'none',
                  })}
                >
                  <item.icon size={15} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.label === 'Knowledge Base' && kbCount > 0 && (
                    <span style={{
                      background: 'var(--accent)', color: '#fff', fontSize: 10,
                      padding: '1px 7px', borderRadius: 20, fontFamily: 'var(--font-mono)',
                    }}>{kbCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={styles.statusPill}>
            <Circle size={7} fill="var(--accent2)" color="var(--accent2)"
              style={{ animation: 'pulse 2s infinite' }} />
            AI Model Active
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Admin</span>
            <ChevronRight size={13} color="var(--muted)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{currentPage}</span>
          </div>
          <a
            href="/chat"
            target="_blank"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px',
              background: 'var(--accent-dim)', border: '1px solid rgba(91,140,255,0.25)',
              borderRadius: 8, color: 'var(--accent)', fontSize: 13, fontWeight: 500,
              transition: 'all var(--transition)',
            }}
          >
            <Bot size={14} /> Launch Chatbot
          </a>
        </div>
        <div style={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
