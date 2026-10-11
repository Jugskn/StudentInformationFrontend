import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../pages/auth/LoginPage'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import * as authApi from '../api/authApi'
import { clearTokens } from '../utils/storage'

vi.mock('../api/authApi', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  refreshToken: vi.fn(),
  changePassword: vi.fn(),
}))

function renderLogin() {
  return render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard OK</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    clearTokens()
    vi.clearAllMocks()
    authApi.getMe.mockRejectedValue({ response: { status: 401, data: {} } })
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
  })

  it('shows invalid login error', async () => {
    const user = userEvent.setup()
    authApi.login.mockRejectedValue({
      response: {
        status: 401,
        data: {
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication credentials were not provided or are invalid.',
            details: {},
          },
        },
      },
    })

    renderLogin()
    await user.type(screen.getByLabelText(/^email/i), 'bad@sim.edu.ph')
    await user.type(screen.getByLabelText(/^password/i), 'badpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })

  it('navigates to dashboard after successful login', async () => {
    const user = userEvent.setup()
    authApi.login.mockResolvedValue({ access: 'a', refresh: 'r' })
    authApi.getMe.mockResolvedValue({
      id: 1,
      username: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@sim.edu.ph',
      roles: ['Administrator'],
      student_id: null,
    })

    renderLogin()
    await user.type(screen.getByLabelText(/^email/i), 'admin@sim.edu.ph')
    await user.type(screen.getByLabelText(/^password/i), 'password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Dashboard OK')).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledWith('admin@sim.edu.ph', 'password')
  })

  it('fills demo account credentials on click', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /administrator/i }))
    expect(screen.getByLabelText(/^email/i)).toHaveValue('admin@sim.edu.ph')
    expect(screen.getByLabelText(/^password/i)).toHaveValue('password')
  })

  it('shows network error when server is unavailable', async () => {
    const user = userEvent.setup()
    authApi.login.mockRejectedValue({ message: 'Network Error' })

    renderLogin()
    await user.type(screen.getByLabelText(/^email/i), 'admin@sim.edu.ph')
    await user.type(screen.getByLabelText(/^password/i), 'password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/unable to connect to the server/i)).toBeInTheDocument()
  })
})

describe('ProtectedRoute behavior', () => {
  it('redirects unauthenticated users to login', async () => {
    clearTokens()
    authApi.getMe.mockRejectedValue({ response: { status: 401, data: {} } })

    const { ProtectedRoute } = await import('../routes/ProtectedRoute')

    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<div>Secret</div>} />
              </Route>
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })
})
