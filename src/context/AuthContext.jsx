import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/authApi'
import { setUnauthorizedHandler } from '../api/axios'
import { parseApiError } from '../utils/errors'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bootError, setBootError] = useState(null)

  const logoutLocal = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const loadUser = useCallback(async () => {
    const access = getAccessToken()
    if (!access) {
      setUser(null)
      setLoading(false)
      return null
    }
    try {
      const me = await authApi.getMe()
      setUser(me)
      setBootError(null)
      return me
    } catch (error) {
      const parsed = parseApiError(error)
      if (parsed.status === 0) {
        setBootError(parsed.message)
      }
      logoutLocal()
      return null
    } finally {
      setLoading(false)
    }
  }, [logoutLocal])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logoutLocal()
    })
    loadUser()
  }, [loadUser, logoutLocal])

  const login = useCallback(async (username, password) => {
    const tokens = await authApi.login(username, password)
    setTokens({ access: tokens.access, refresh: tokens.refresh })
    const me = await authApi.getMe()
    setUser(me)
    setBootError(null)
    return me
  }, [])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    try {
      if (refresh) {
        await authApi.logout(refresh)
      }
    } catch {
      // Local logout still proceeds if blacklist fails.
    } finally {
      logoutLocal()
    }
  }, [logoutLocal])

  const value = useMemo(
    () => ({
      user,
      roles: user?.roles || [],
      studentId: user?.student_id ?? null,
      isAuthenticated: Boolean(user),
      loading,
      bootError,
      login,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading, bootError, login, logout, loadUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
