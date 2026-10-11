import { useEffect, useState } from 'react'
import { listEnrollments } from '../../api/enrollmentApi'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingBlock } from '../../components/ui/LoadingBlock'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { parseApiError } from '../../utils/errors'
import { formatDate } from '../../utils/formatDate'

export function MyEnrollmentsPage() {
  const { studentId } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listEnrollments({ per_page: 100 })
        if (!cancelled) setRows(data.results || [])
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
  }, [])

  const current = rows.filter((r) => r.status === 'ENROLLED')
  const past = rows.filter((r) => r.status !== 'ENROLLED')

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Enrollments"
        description="Courses you are taking now and those you have completed or dropped."
        breadcrumb="My Records"
      />

      {!studentId && (
        <Alert type="warning" title="No linked student profile">
          Your account is not linked to a student record yet.
        </Alert>
      )}

      {loading && <LoadingBlock />}

      {!loading && error && (
        <ErrorState
          message={error.userMessage || error.message}
          accessDenied={error.status === 403}
        />
      )}

      {!loading && !error && rows.length === 0 && (
        <EmptyState
          title="No enrollments yet"
          description="When you are enrolled in a course offering, it will appear here."
        />
      )}

      {!loading && !error && current.length > 0 && (
        <EnrollmentSection title="Current enrollments" rows={current} />
      )}

      {!loading && !error && past.length > 0 && (
        <EnrollmentSection title="Past enrollments" rows={past} />
      )}
    </div>
  )
}

function EnrollmentSection({ title, rows }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Units</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Instructor</th>
              <th className="px-4 py-3">Term</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Enrolled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.course_code || '—'}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {row.course_title || row.title || '—'}
                </td>
                <td className="px-4 py-3">{row.units ?? '—'}</td>
                <td className="px-4 py-3">{row.schedule || '—'}</td>
                <td className="px-4 py-3">
                  {row.instructor_name || row.instructor_username || '—'}
                </td>
                <td className="px-4 py-3">
                  {row.term_name
                    ? `${row.term_name}${row.school_year ? ` · ${row.school_year}` : ''}`
                    : row.academic_term || '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(row.enrolled_at, { includeTime: false })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
