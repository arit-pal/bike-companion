import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader } from '@/components/feedback/Loader'
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute'
import { ScrollToTop } from './ScrollToTop'

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const DashboardPlaceholder = lazy(() =>
  import('@/pages/DashboardPlaceholder').then((m) => ({ default: m.DashboardPlaceholder })),
)
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public — marketing */}
          <Route path="/" element={<DashboardPlaceholder />} />

          {/* Public-only — redirect to /dashboard if already authed */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected — require JWT */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy */}
          <Route path="/signin" element={<Navigate to="/login" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
