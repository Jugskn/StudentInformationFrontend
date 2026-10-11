import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { parseApiError } from '../../utils/errors'

const DEMO_ACCOUNTS = [
  { role: 'Administrator', email: 'admin@sim.edu.ph' },
  { role: 'Registrar', email: 'registrar@sim.edu.ph' },
  { role: 'Instructor', email: 'instructor@sim.edu.ph' },
  { role: 'Student', email: 'student@sim.edu.ph' },
]

const DEMO_PASSWORD = 'password'

const HIGHLIGHTS = [
  { label: 'Students', value: '~30', detail: 'Active learner records' },
  { label: 'Programs', value: '4', detail: 'Degree pathways' },
  { label: 'Offerings', value: 'Live', detail: 'Terms & sections' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    const local = {}
    if (!email.trim()) local.email = 'Email is required.'
    if (!password) local.password = 'Password is required.'
    if (Object.keys(local).length) {
      setFieldErrors(local)
      return
    }

    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const parsed = parseApiError(err)
      if (parsed.status === 401 || parsed.code === 'AUTHENTICATION_ERROR') {
        setError('Invalid email or password.')
      } else {
        setError(parsed.userMessage || parsed.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemo(account) {
    setEmail(account.email)
    setPassword(DEMO_PASSWORD)
    setError('')
    setFieldErrors({})
  }

  const year = new Date().getFullYear()

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative bg-brand-950 text-white lg:w-[46%]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#962848_0%,_transparent_55%)] opacity-80" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(122,31,61,0.35)_0%,transparent_50%)]" />

        <div className="relative flex h-full flex-col justify-between gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:min-h-screen">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-sm font-bold tracking-wide shadow-sm ring-1 ring-white/10">
                SIM
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide">SIM</p>
                <p className="text-xs text-brand-200">Student Information Management</p>
              </div>
            </div>

            <h1 className="mt-8 max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
              Keep every student record in one clear place
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100 sm:text-base">
              Manage programs, courses, enrollments, and grades with a calm workspace built for
              registrars, instructors, and students.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-200">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-xs text-brand-200">{item.detail}</p>
              </div>
            ))}
          </div>

          <p className="hidden text-xs text-brand-300 lg:block">© {year} Student Information Management</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold text-white">
                SIM
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-900">SIM</p>
                <p className="text-xs text-slate-500">Student Information Management</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xl font-semibold text-slate-900">Sign in</p>
            <p className="mt-1 text-sm text-slate-500">
              Use the email and password provided by your school administrator. New accounts are
              created by the school — there is no self-registration.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              {error && (
                <Alert type="error" title="Sign in failed">
                  {error}
                </Alert>
              )}

              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
              />

              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-8 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Demo accounts
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Password for all demos: <span className="font-mono text-slate-700">{DEMO_PASSWORD}</span>
                . Click a row to fill the form.
              </p>
              <ul className="mt-3 space-y-1.5">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email}>
                    <button
                      type="button"
                      onClick={() => fillDemo(account)}
                      className="flex w-full items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-left text-xs transition hover:border-brand-200 hover:bg-brand-50"
                    >
                      <span className="font-medium text-slate-800">{account.role}</span>
                      <span className="font-mono text-slate-600">{account.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">© {year} Student Information Management</p>
        </div>
      </div>
    </div>
  )
}
