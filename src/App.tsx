import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastContainer } from './components/ui/Toast'
import { BottomNav } from './components/layout/BottomNav'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Program from './pages/Program'
import Progress from './pages/Progress'
import Goals from './pages/Goals'
import Settings from './pages/Settings'
import Session from './pages/Session'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-accent text-4xl font-black animate-pulse">FORGE</div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/program" element={<Program />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/session/new" element={<Session />} />
        <Route path="/session/:id" element={<Session />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer />
      <AppRoutes />
    </AuthProvider>
  )
}
