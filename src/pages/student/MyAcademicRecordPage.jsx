import { useEffect, useState } from 'react'
import { getStudentAcademicRecord } from '../../api/studentsApi'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingBlock } from '../../components/ui/LoadingBlock'
import { PageHeader } from '../../components/ui/PageHeader'
import { RemarksBadge, StatusBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { parseApiError } from '../../utils/errors'
import { computeFinalRating, computeRemarks, PASSING_THRESHOLD } from '../../utils/grading'

function toGpa(rating) {
  if (rating == null || rating === '') return null
  const num = Number(rating)
  if (Number.isNaN(num)) return null
  return Math.round((num / 25) * 100) / 100
}

function termStats(term) {
  const courses = term.enrolled_courses || []
  let units = 0
  let weighted = 0
  let gradedUnits = 0

  for (const course of courses) {
    const u = Number(course.units) || 0
    units += u
    const rating =
      course.final_rating ??
      course.grade ??
      computeFinalRating(course.midterm_grade, course.final_grade)
    if (rating != null && rating !== '') {
      const gpa = toGpa(rating)
      if (gpa != null && u > 0) {
        weighted += gpa * u
        gradedUnits += u
      }
    }
  }

  return {
    units,
    termGpa: gradedUnits > 0 ? Math.round((weighted / gradedUnits) * 100) / 100 : null,
  }
}

export function MyAcademicRecordPage() {
  const { studentId } = useAuth()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!studentId) {
      setLoading(false)
      setRecord(null)
      return undefined
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getStudentAcademicRecord(studentId)
        if (!cancelled) setRecord(data)
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

  const overall = (() => {
    if (!record?.terms?.length) return { units: 0, gpa: null }
    let units = 0
    let weighted = 0
    let gradedUnits = 0
    for (const term of record.terms) {
      const stats = termStats(term)
      units += stats.units
      if (stats.termGpa != null) {
        // Recompute from courses for accuracy
      }
      for (const course of term.enrolled_courses || []) {
        const u = Number(course.units) || 0
        const rating =
          course.final_rating ??
          course.grade ??
          computeFinalRating(course.midterm_grade, course.final_grade)
        const gpa = toGpa(rating)
        if (gpa != null && u > 0) {
          weighted += gpa * u
          gradedUnits += u
        }
      }
    }
    return {
      units,
      gpa: gradedUnits > 0 ? Math.round((weighted / gradedUnits) * 100) / 100 : null,
      overall_gpa: record.overall_gpa,
      total_units: record.total_units,
    }
  })()

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Academic Record"
        description="Your course history by term, with units and GPA summaries."
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

      {!loading && !error && record && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Program"
              value={record.student?.program || '—'}
            />
            <SummaryCard
              label="Total units"
              value={overall.total_units ?? overall.units ?? '—'}
            />
            <SummaryCard
              label="Overall GPA"
              value={overall.overall_gpa ?? overall.gpa ?? '—'}
            />
          </div>

          {!record.terms?.length && (
            <EmptyState
              title="No academic history yet"
              description="Enrollments and grades will show here once they are recorded."
            />
          )}

          {record.terms?.map((term) => {
            const stats = termStats(term)
            const termGpa = term.term_gpa ?? stats.termGpa
            return (
              <section
                key={term.academic_term_id || `${term.academic_year}-${term.term_name}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h2 className="font-semibold text-slate-900">
                    {term.academic_year} — {term.term_name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Units: {term.total_units ?? stats.units} · Term GPA:{' '}
                    {termGpa != null ? termGpa : '—'}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Course</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Units</th>
                        <th className="px-4 py-3">Enrollment</th>
                        <th className="px-4 py-3">Midterm</th>
                        <th className="px-4 py-3">Final</th>
                        <th className="px-4 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(term.enrolled_courses || []).map((course) => {
                        const rating =
                          course.final_rating ??
                          course.grade ??
                          computeFinalRating(course.midterm_grade, course.final_grade)
                        const remarks = course.remarks || computeRemarks(rating)
                        return (
                          <tr key={course.enrollment_id}>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {course.course_code}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{course.course_title}</td>
                            <td className="px-4 py-3">{course.units}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={course.enrollment_status} />
                            </td>
                            <td className="px-4 py-3">
                              {course.midterm_grade != null ? course.midterm_grade : '—'}
                            </td>
                            <td className="px-4 py-3">
                              {course.final_grade != null
                                ? course.final_grade
                                : course.grade != null
                                  ? course.grade
                                  : '—'}
                            </td>
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
            )
          })}

          <p className="text-xs text-slate-500">
            Passing threshold is {PASSING_THRESHOLD}. GPA uses a 4.0 scale mapped from the final
            rating.
          </p>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}
