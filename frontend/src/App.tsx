import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import KnowledgeBase from './pages/KnowledgeBase'
import Training from './pages/Training'
import QueryLogs from './pages/QueryLogs'
import Settings from './pages/Settings'
import Chatbot from './pages/Chatbot'

export default function App() {
  return (
    <Routes>
      <Route path="/chat" element={<Chatbot />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="training" element={<Training />} />
        <Route path="logs" element={<QueryLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
