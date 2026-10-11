import { useEffect, useState } from 'react'
import { getStudent, listStudents } from '../../api/studentsApi'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingBlock } from '../../components/ui/LoadingBlock'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { parseApiError } from '../../utils/errors'

export function MyProfilePage() {
  const { user, studentId } = useAuth()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        let data = null
        if (studentId) {
          data = await getStudent(studentId)
        } else {
          const list = await listStudents({ per_page: 1 })
          data = list.results?.[0] || null
        }
        if (!cancelled) setStudent(data)
      } catch (err) {
        if (!cancelled) setError(parseApiError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [studentId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your personal and academic information on file."
        breadcrumb="My Records"
      />

      {loading && <LoadingBlock />}

      {!loading && error && (
        <ErrorState
          message={error.userMessage || error.message}
          accessDenied={error.status === 403}
        />
      )}

      {!loading && !error && !student && (
        <Alert type="warning" title="No student profile">
          Your account is not linked to a student record yet. Contact your registrar if this looks
          wrong.
        </Alert>
      )}

      {!loading && !error && student && (
        <>
          <Card title="Personal information">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                label="Full name"
                value={
                  `${student.first_name || user?.first_name || ''} ${
                    student.last_name || user?.last_name || ''
                  }`.trim() || '—'
                }
              />
              <Detail label="Email" value={student.email || user?.email || '—'} />
              <Detail label="Student number" value={student.student_number || '—'} />
              <Detail
                label="Status"
                value={<StatusBadge status={student.status} />}
              />
            </dl>
          </Card>

          <Card title="Academic information">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                label="Program"
                value={student.program_name || student.program || '—'}
              />
              <Detail label="Year level" value={student.year_level ?? '—'} />
              <Detail
                label="Guardian"
                value={student.guardian_name || student.guardian || '—'}
              />
              <Detail
                label="Address"
                value={student.address || '—'}
              />
            </dl>
          </Card>
        </>
      )}
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
