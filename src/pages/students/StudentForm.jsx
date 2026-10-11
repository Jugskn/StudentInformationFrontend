import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { firstFieldError } from '../../utils/errors'
import { statusOptions } from '../../utils/statusLabels'

const emptyCreate = {
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  password: '',
  student_number: '',
  program: '',
  year_level: '1',
  status: 'ACTIVE',
  contact_number: '',
}

export function StudentForm({
  initial,
  programs,
  saving,
  serverErrors = {},
  serverMessage,
  onSubmit,
  onCancel,
}) {
  const isEdit = Boolean(initial)
  const [values, setValues] = useState(emptyCreate)
  const [localErrors, setLocalErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setValues({
        first_name: initial.first_name || '',
        last_name: initial.last_name || '',
        email: initial.email || '',
        username: '',
        password: '',
        student_number: initial.student_number || '',
        program: String(initial.program || ''),
        year_level: String(initial.year_level || '1'),
        status: initial.status || 'ACTIVE',
        contact_number: initial.contact_number || '',
      })
    } else {
      setValues(emptyCreate)
    }
    setLocalErrors({})
  }, [initial])

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const errors = {}
    if (!values.first_name.trim()) errors.first_name = 'First name is required.'
    if (!values.last_name.trim()) errors.last_name = 'Last name is required.'
    if (!values.email.trim()) errors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Enter a valid email address.'
    }
    if (!values.student_number.trim()) errors.student_number = 'Student number is required.'
    if (!values.program) errors.program = 'Program is required.'
    const year = Number(values.year_level)
    if (!year || year < 1 || year > 6) errors.year_level = 'Year level must be between 1 and 6.'
    if (!isEdit) {
      if (!values.username.trim()) errors.username = 'Username is required.'
      if (!values.password) errors.password = 'Password is required.'
      else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.'
    }
    setLocalErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    const payload = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      student_number: values.student_number.trim(),
      program: Number(values.program),
      year_level: Number(values.year_level),
      status: values.status,
      contact_number: values.contact_number.trim(),
    }

    if (!isEdit) {
      payload.username = values.username.trim()
      payload.password = values.password
    }

    onSubmit(payload)
  }

  function err(field) {
    return localErrors[field] || firstFieldError(serverErrors, field)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {(serverMessage || Object.keys(serverErrors).length > 0) && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverMessage || 'Please correct the highlighted information.'}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          required
          value={values.first_name}
          onChange={(e) => setField('first_name', e.target.value)}
          error={err('first_name')}
        />
        <Input
          label="Last name"
          required
          value={values.last_name}
          onChange={(e) => setField('last_name', e.target.value)}
          error={err('last_name')}
        />
        <Input
          label="Email"
          type="email"
          required
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          error={err('email')}
        />
        <Input
          label="Student number"
          required
          value={values.student_number}
          onChange={(e) => setField('student_number', e.target.value)}
          error={err('student_number')}
        />
        {!isEdit && (
          <>
            <Input
              label="Username"
              required
              value={values.username}
              onChange={(e) => setField('username', e.target.value)}
              error={err('username')}
            />
            <Input
              label="Password"
              type="password"
              required
              value={values.password}
              onChange={(e) => setField('password', e.target.value)}
              error={err('password')}
              hint="Minimum 8 characters"
            />
          </>
        )}
        <Select
          label="Program"
          required
          value={values.program}
          onChange={(e) => setField('program', e.target.value)}
          error={err('program')}
          placeholder="Select program"
          options={programs.map((p) => ({
            value: String(p.id),
            label: `${p.code} — ${p.name}`,
          }))}
        />
        <Select
          label="Year level"
          required
          value={values.year_level}
          onChange={(e) => setField('year_level', e.target.value)}
          error={err('year_level')}
          options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: String(y) }))}
        />
        <Select
          label="Status"
          value={values.status}
          onChange={(e) => setField('status', e.target.value)}
          error={err('status')}
          options={statusOptions(['ACTIVE', 'INACTIVE', 'GRADUATED'])}
        />
        <Input
          label="Contact number"
          value={values.contact_number}
          onChange={(e) => setField('contact_number', e.target.value)}
          error={err('contact_number')}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create student'}
        </Button>
      </div>
    </form>
  )
}
