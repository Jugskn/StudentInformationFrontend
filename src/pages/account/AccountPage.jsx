import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { changePassword } from '../../api/authApi'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { firstFieldError, parseApiError } from '../../utils/errors'
import { formatDate } from '../../utils/formatDate'
import {
  canManageCatalog,
  canManageEnrollments,
  canManageGrades,
  canManageOfferings,
  canManageStudents,
  canViewAcademicRecords,
  canViewCatalog,
  canViewEnrollments,
  canViewGrades,
  canViewOfferings,
  isStaff,
  primaryRoleLabel,
} from '../../utils/roles'

function accessLevel(view, manage) {
  if (manage) return 'Manage'
  if (view) return 'View'
  return 'Not available'
}

function AccessCell({ level }) {
  const styles = {
    Manage: 'text-emerald-700',
    View: 'text-brand-800',
    'Not available': 'text-slate-400',
  }
  return <span className={`text-sm font-medium ${styles[level]}`}>{level}</span>
}

export function AccountPage() {
  const { user, roles } = useAuth()
  const toast = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [localErrors, setLocalErrors] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '—'
  const verifiedAt =
    user?.email_verified_at ||
    (user?.email_verified ? user?.date_joined : null) ||
    user?.date_joined ||
    user?.created_at
  const createdAt = user?.date_joined || user?.created_at
  const updatedAt = user?.date_updated || user?.updated_at || user?.last_login || createdAt

  const accessRows = [
    {
      area: 'Programs & courses',
      level: accessLevel(canViewCatalog(roles), canManageCatalog(roles)),
    },
    {
      area: 'Academic terms',
      level: accessLevel(canViewCatalog(roles), canManageCatalog(roles)),
    },
    {
      area: 'Course offerings',
      level: accessLevel(canViewOfferings(roles), canManageOfferings(roles)),
    },
    {
      area: 'Students directory',
      level: accessLevel(
        isStaff(roles) || roles.includes('Instructor'),
        canManageStudents(roles),
      ),
    },
    {
      area: 'Enrollment',
      level: accessLevel(canViewEnrollments(roles), canManageEnrollments(roles)),
    },
    {
      area: 'Grades',
      level: accessLevel(canViewGrades(roles), canManageGrades(roles)),
    },
    {
      area: 'Academic records',
      level: accessLevel(canViewAcademicRecords(roles), false),
    },
    {
      area: 'My profile & records',
      level: roles.includes('Student') ? 'View' : 'Not available',
    },
  ]

  function err(field) {
    return localErrors[field] || firstFieldError(serverErrors, field)
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setFormError('')
    const errors = {}
    if (!currentPassword) errors.current_password = 'Current password is required.'
    if (!newPassword) errors.new_password = 'New password is required.'
    else if (newPassword.length < 8) {
      errors.new_password = 'New password must be at least 8 characters.'
    }
    if (!confirmPassword) {
      errors.confirm_new_password = 'Please confirm your new password.'
    } else if (newPassword !== confirmPassword) {
      errors.confirm_new_password = 'New passwords do not match.'
    }
    setLocalErrors(errors)
    if (Object.keys(errors).length) return

    setSaving(true)
    setServerErrors({})
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      })
      toast.success('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setLocalErrors({})
    } catch (error) {
      const parsed = parseApiError(error)
      setServerErrors(parsed.fieldErrors)
      setFormError(parsed.userMessage || parsed.message)
      toast.error(parsed.userMessage || parsed.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Account"
        description="Review your account details, update your password, and see what you can access."
        breadcrumb="Account"
      />

      <Card title="Account details" description="Information associated with your sign-in.">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Name" value={fullName} />
          <Detail label="Email" value={user?.email || '—'} />
          <Detail label="Role" value={primaryRoleLabel(roles)} />
          <Detail label="Status" value={user?.is_active === false ? 'Inactive' : 'Active'} />
          <Detail label="Account ID" value={user?.id != null ? String(user.id) : '—'} />
          <Detail label="Email verified" value={formatDate(verifiedAt)} />
          <Detail label="Created" value={formatDate(createdAt)} />
          <Detail label="Last updated" value={formatDate(updatedAt)} />
        </dl>
      </Card>

      <Card title="Change password" description="Choose a strong password you do not reuse elsewhere.">
        <form className="mx-auto max-w-md space-y-4" onSubmit={handlePasswordSubmit} noValidate>
          {formError && (
            <Alert type="error" title="Could not update password">
              {formError}
            </Alert>
          )}

          <PasswordField
            label="Current password"
            name="current_password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            error={err('current_password')}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            name="new_password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            error={err('new_password')}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm new password"
            name="confirm_new_password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            error={err('confirm_new_password')}
            autoComplete="new-password"
          />

          <Button type="submit" disabled={saving}>
            {saving ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Card>

      <Card title="Your access" description="What you can view or manage with your current role.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-1 py-2 font-semibold">Area</th>
                <th className="px-1 py-2 font-semibold">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accessRows.map((row) => (
                <tr key={row.area}>
                  <td className="px-1 py-3 text-slate-800">{row.area}</td>
                  <td className="px-1 py-3">
                    <AccessCell level={row.level} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  )
}

function PasswordField({ label, name, value, onChange, show, onToggle, error, autoComplete }) {
  return (
    <div className="relative">
      <Input
        label={label}
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        autoComplete={autoComplete}
        required
        className="pr-2"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-8 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
