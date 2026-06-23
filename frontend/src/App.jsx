import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { ChatProvider } from './context/ChatContext'
import { ToastProvider } from './context/ToastContext'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import VerifyPage from './pages/VerifyPage'
import ChatPage from './pages/ChatPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import OtpPage from './pages/OtpPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import TwoFactorChallengePage from './pages/TwoFactorChallengePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import PublicProfilePage from './pages/PublicProfilePage'
import SocialConnectErrorPage from './pages/SocialConnectErrorPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentCancelPage from './pages/PaymentCancelPage'
import SigningInPage from './pages/SigningInPage'
import { AdminAuthProvider, useAdminAuth } from './admin/context/AdminAuthContext'
import AdminLoginPage from './admin/pages/AdminLoginPage'
import AdminDashboardPage from './admin/pages/AdminDashboardPage'
import AdminUsersPage from './admin/pages/AdminUsersPage'
import AdminGroupsPage from './admin/pages/AdminGroupsPage'
import AdminChatPage from './admin/pages/AdminChatPage'
import AdminCallsPage from './admin/pages/AdminCallsPage'
import AdminSettingsPage from './admin/pages/AdminSettingsPage'
import AdminLayout from './admin/components/AdminLayout'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-lavender">
    <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
  </div>
)

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (user) return <Navigate to="/chat" replace />
  return children
}

function ChatApp() {
  return (
    <ToastProvider>
      <SocketProvider>
        <ChatProvider>
          <ChatPage />
        </ChatProvider>
      </SocketProvider>
    </ToastProvider>
  )
}

function AdminProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth()
  if (loading) return <Spinner />
  if (!admin) return <Navigate to="/admin/login" replace />
  return <AdminLayout>{children}</AdminLayout>
}

function AdminGuestRoute({ children }) {
  const { admin, loading } = useAdminAuth()
  if (loading) return <Spinner />
  if (admin) return <Navigate to="/admin/dashboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth — guest only */}
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/otp" element={<GuestRoute><OtpPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          <Route path="/2fa" element={<GuestRoute><TwoFactorChallengePage /></GuestRoute>} />

          {/* Verification — requires login */}
          <Route path="/verify" element={<ProtectedRoute><VerifyPage /></ProtectedRoute>} />

          {/* Main app — requires full verification */}
          <Route path="/chat" element={<ProtectedRoute><ChatApp /></ProtectedRoute>} />

          {/* Public pages (no auth) */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/u/:username" element={<PublicProfilePage />} />
          <Route path="/social-error" element={<SocialConnectErrorPage />} />

          {/* Payment popup pages */}
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />

          {/* Signing in loading page */}
          <Route path="/signing-in" element={<SigningInPage />} />

          {/* Redirects */}
          <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
          <Route path="/status" element={<Navigate to="/chat" replace />} />
          <Route path="/my-status" element={<Navigate to="/chat" replace />} />
          <Route path="/user-status" element={<Navigate to="/chat" replace />} />
          <Route path="/all-calls" element={<Navigate to="/chat" replace />} />

          {/* Admin panel — separate auth context */}
          <Route path="/admin/*" element={
            <AdminAuthProvider>
              <Routes>
                <Route path="login" element={<AdminGuestRoute><AdminLoginPage /></AdminGuestRoute>} />
                <Route path="dashboard" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
                <Route path="users" element={<AdminProtectedRoute><AdminUsersPage /></AdminProtectedRoute>} />
                <Route path="groups" element={<AdminProtectedRoute><AdminGroupsPage /></AdminProtectedRoute>} />
                <Route path="chat" element={<AdminProtectedRoute><AdminChatPage /></AdminProtectedRoute>} />
                <Route path="calls" element={<AdminProtectedRoute><AdminCallsPage /></AdminProtectedRoute>} />
                <Route path="settings" element={<AdminProtectedRoute><AdminSettingsPage /></AdminProtectedRoute>} />
                <Route path="*" element={<Navigate to="/admin/login" replace />} />
              </Routes>
            </AdminAuthProvider>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
