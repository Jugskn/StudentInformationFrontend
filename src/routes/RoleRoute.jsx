import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AccessDeniedPage } from '../pages/system/AccessDeniedPage'

export function RoleRoute({ allow }) {
  const { roles } = useAuth()
  const allowed = typeof allow === 'function' ? allow(roles) : allow.some((r) => roles.includes(r))

  if (!allowed) {
    return <AccessDeniedPage />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
