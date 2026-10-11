import { useEffect, useMemo, useState } from 'react'
import { listGrades } from '../../api/gradesApi'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingBlock } from '../../components/ui/LoadingBlock'
import { PageHeader } from '../../components/ui/PageHeader'
import { RemarksBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { parseApiError } from '../../utils/errors'
import { computeFinalRating, computeRemarks } from '../../utils/grading'

export function MyGradesPage() {
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
        const data = await listGrades({ per_page: 100 })
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

  const grouped = useMemo(() => {
    const map = new Map()
    for (const row of rows) {
      const key = row.term_name
        ? `${row.term_name}${row.school_year ? ` · ${row.school_year}` : ''}`
        : row.academic_term || row.academic_year || 'Grades'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(row)
    }
    return Array.from(map.entries())
  }, [rows])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Grades"
        description="Midterm and final grades for your enrolled courses."
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
          title="No grades yet"
          description="Grades will appear here once they are recorded for your courses."
        />
      )}

      {!loading &&
        !error &&
        grouped.map(([term, items]) => (
          <section
            key={term}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">{term}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Midterm</th>
                    <th className="px-4 py-3">Final</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => {
                    const rating =
                      row.final_rating ??
                      row.grade ??
                      computeFinalRating(row.midterm_grade, row.final_grade)
                    const remarks =
                      row.remarks || computeRemarks(rating)
                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {row.course_code || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {row.midterm_grade != null && row.midterm_grade !== ''
                            ? row.midterm_grade
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {row.final_grade != null && row.final_grade !== ''
                            ? row.final_grade
                            : '—'}
                        </td>
                        <td className="px-4 py-3">{rating != null ? rating : '—'}</td>
                        <td className="px-4 py-3">
                          <RemarksBadge remarks={remarks} finalRating={rating} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
    </div>
  )
}
