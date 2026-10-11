import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { primaryRoleLabel } from '../utils/roles'
import { Button } from '../components/ui/Button'
import { SidebarNav, getPageTitle } from '../components/layout/SidebarNav'

export function AppLayout() {
  const { user, roles, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pageTitle = getPageTitle(location.pathname)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="border-b border-slate-200 px-4 py-5">
            <Link to="/dashboard" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold tracking-wide text-white">
                SIM
              </span>
              <span>
                <span className="block text-sm font-semibold text-brand-900">SIM</span>
                <span className="block text-xs leading-snug text-slate-500">
                  Student Information Management
                </span>
              </span>
            </Link>
          </div>
          <SidebarNav roles={roles} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative z-10 h-full w-72 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-800 text-[10px] font-bold text-white">
                    SIM
                  </span>
                  <p className="font-semibold text-slate-900">Menu</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                  Close
                </Button>
              </div>
              <SidebarNav roles={roles} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation"
                >
                  Menu
                </Button>
                <div>
                  <p className="text-sm font-semibold text-slate-900 sm:text-base">{pageTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.email || user?.username} · {primaryRoleLabel(roles)}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
