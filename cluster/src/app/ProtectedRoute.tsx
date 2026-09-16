import { Navigate } from 'react-router-dom'
import { authApi } from '@/features/auth/api/auth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = authApi.getToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = authApi.getToken()
  if (token) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
