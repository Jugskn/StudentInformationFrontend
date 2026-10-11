import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentsPage } from './StudentsPage'
import { AuthProvider } from '../../context/AuthContext'
import { ToastProvider } from '../../context/ToastContext'
import * as authApi from '../../api/authApi'
import * as studentsApi from '../../api/studentsApi'
import * as programsApi from '../../api/programsApi'
import { setTokens } from '../../utils/storage'

vi.mock('../../api/authApi')
vi.mock('../../api/studentsApi')
vi.mock('../../api/programsApi')

function renderStudents() {
  return render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter>
          <StudentsPage />
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>,
  )
}

describe('StudentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setTokens({ access: 'access', refresh: 'refresh' })
    authApi.getMe.mockResolvedValue({
      id: 1,
      username: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@sim.edu.ph',
      roles: ['Administrator'],
      student_id: null,
    })
    programsApi.listPrograms.mockResolvedValue({
      count: 1,
      results: [{ id: 1, name: 'BSIT', code: 'BSIT', status: 'ACTIVE' }],
    })
  })

  it('loads students from the API', async () => {
    studentsApi.listStudents.mockResolvedValue({
      count: 1,
      results: [
        {
          id: 1,
          student_number: '2025-0001',
          first_name: 'Ada',
          last_name: 'Lovelace',
          email: 'ada@sim.edu.ph',
          program: 1,
          program_name: 'BSIT',
          year_level: 1,
          status: 'ACTIVE',
        },
      ],
    })

    renderStudents()
    expect(await screen.findByText('2025-0001')).toBeInTheDocument()
    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument()
  })

  it('sends search parameter to the API', async () => {
    const user = userEvent.setup()
    studentsApi.listStudents.mockResolvedValue({ count: 0, results: [] })

    renderStudents()
    await screen.findByLabelText(/search/i)
    await user.type(screen.getByLabelText(/search/i), 'King')

    await waitFor(
      () => {
        expect(studentsApi.listStudents).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'King' }),
        )
      },
      { timeout: 2000 },
    )
  })

  it('shows API 403 access denied state', async () => {
    studentsApi.listStudents.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to perform this action.',
            details: {},
          },
        },
      },
    })

    renderStudents()
    expect(await screen.findByText(/access denied/i)).toBeInTheDocument()
  })

  it('shows network unavailable state', async () => {
    studentsApi.listStudents.mockRejectedValue({ message: 'Network Error' })
    renderStudents()
    expect(await screen.findByText(/unable to connect to the server/i)).toBeInTheDocument()
  })

  it('opens create form and validates required fields', async () => {
    const user = userEvent.setup()
    studentsApi.listStudents.mockResolvedValue({ count: 0, results: [] })

    renderStudents()
    const addButtons = await screen.findAllByRole('button', { name: /add student/i })
    await user.click(addButtons[0])
    await user.click(screen.getByRole('button', { name: /create student/i }))

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument()
  })

  it('shows confirmation dialog before delete', async () => {
    const user = userEvent.setup()
    studentsApi.listStudents.mockResolvedValue({
      count: 1,
      results: [
        {
          id: 9,
          student_number: '2025-0009',
          first_name: 'Test',
          last_name: 'Student',
          email: 't@sim.edu.ph',
          program: 1,
          program_name: 'BSIT',
          year_level: 2,
          status: 'ACTIVE',
        },
      ],
    })

    renderStudents()
    await user.click(await screen.findByRole('button', { name: /^delete$/i }))
    expect(await screen.findByText(/permanently delete student/i)).toBeInTheDocument()
  })
})
