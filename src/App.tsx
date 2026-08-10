import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AccentProvider } from './contexts/AccentContext'
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { Navbar } from './components/layout/Navbar'
import { DashboardPage } from './pages/DashboardPage'

// Admin panel a Profil sa načítajú (code-split) až keď ich používateľ naozaj
// otvorí - drvivá väčšina návštev appky sa odohráva na /dashboard.
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      {children}
    </div>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <Outlet />
    </div>
  )
}

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AccentProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<AuthLayout><LoginForm /></AuthLayout>} />
              <Route path="/register" element={<AuthLayout><RegisterForm /></AuthLayout>} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/profile"
                    element={
                      <Suspense fallback={<RouteFallback />}>
                        <ProfilePage />
                      </Suspense>
                    }
                  />
                  <Route element={<AdminRoute />}>
                    <Route
                      path="/admin"
                      element={
                        <Suspense fallback={<RouteFallback />}>
                          <AdminPage />
                        </Suspense>
                      }
                    />
                  </Route>
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </AccentProvider>
    </ThemeProvider>
  )
}

export default App
