import { BrowserRouter, Navigate, Route, Routes, useOutletContext } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import SignupPage from './pages/SignupPage'
import ResetPasswordPage from './pages/ResetPasswordPage.tsx'
import VerifyOtpPage from './pages/VerifyOtpPage'
import Dashboard from './pages/Dashboard'
import BookmarksPanel from './pages/dashboard/BookmarksPanel'
import OverviewPanel from './pages/dashboard/OverviewPanel'
import Vault from './pages/Vault'
import type { SessionUser } from './lib/auth'

type DashboardOutletContext = {
  firstName: string
  currentUser: SessionUser | null
}

function OverviewRoute() {
  const { firstName } = useOutletContext<DashboardOutletContext>()
  return <OverviewPanel firstName={firstName} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<OverviewRoute />} />
          <Route path="tasks" element={<OverviewRoute />} />
          <Route path="calendar" element={<OverviewRoute />} />
          <Route path="focus" element={<OverviewRoute />} />
          <Route path="inbox" element={<OverviewRoute />} />
          <Route path="bookmarks" element={<BookmarksPanel />} />
          <Route path="vault" element={<Vault />} />
          <Route path="notes" element={<Vault />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="/bookmarks" element={<Navigate to="/dashboard/bookmarks" replace />} />
        <Route path="/vault" element={<Navigate to="/dashboard/vault" replace />} />
        <Route path="/notes" element={<Navigate to="/dashboard/vault" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
