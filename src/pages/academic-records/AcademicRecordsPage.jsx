import { useEffect, useState } from 'react'
import { getStudentAcademicRecord, listStudents } from '../../api/studentsApi'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { PageHeader } from '../../components/ui/PageHeader'
import { RemarksBadge, StatusBadge } from '../../components/ui/StatusBadge'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { StudentCell } from '../../components/ui/StudentCell'
import { useAuth } from '../../context/AuthContext'
import { parseApiError } from '../../utils/errors'
import { computeFinalRating, computeRemarks } from '../../utils/grading'
import { canManageStudents, isStaff } from '../../utils/roles'

export function AcademicRecordsPage() {
  const { roles, studentId } = useAuth()
  const [students, setStudents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState(null)

  const staffOrInstructor = isStaff(roles) || roles.includes('Instructor')

  useEffect(() => {
    if (roles.includes('Student') && studentId) {
      setSelectedId(String(studentId))
      return
    }

    if (!staffOrInstructor) return

    setListLoading(true)
    listStudents({ per_page: 100 })
      .then((res) => setStudents(res.results || []))
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setListLoading(false))
  }, [roles, studentId, staffOrInstructor])

  useEffect(() => {
    if (!selectedId) {
      setRecord(null)
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getStudentAcademicRecord(selectedId)
        if (!cancelled) setRecord(data)
      } catch (err) {
        if (!cancelled) {
          setRecord(null)
          setError(parseApiError(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const selectedStudent = students.find((s) => String(s.id) === String(selectedId))

  return (
    <div>
      <PageHeader
        title="Academic Records"
        description="Academic history compiled from enrollments and grades."
        breadcrumb="Records"
      />

      {staffOrInstructor && (
        <div className="mb-4 max-w-xl rounded-md border border-slate-200 bg-white p-4">
          <Select
            label="Select student"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            placeholder={listLoading ? 'Loading students…' : 'Choose a student'}
            options={students.map((s) => ({
              value: String(s.id),
              label: `${s.student_number} — ${s.last_name}, ${s.first_name}`,
            }))}
          />
        </div>
      )}

      {roles.includes('Student') && !studentId && (
        <Alert type="warning" title="No linked student profile">
          Your user account is not linked to a student record yet.
        </Alert>
      )}

      {error && (
        <div className="mb-4">
          <ErrorState
            message={error.userMessage || error.message}
            accessDenied={error.status === 403}
            onRetry={() => selectedId && setSelectedId(String(selectedId))}
          />
        </div>
      )}

      {loading && <Spinner label="Loading academic record…" />}

      {!loading && !error && selectedId && record && (
        <div className="space-y-6">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">Student</h2>
            <div className="mt-3">
              <StudentCell
                name={
                  record.student
                    ? `${record.student.first_name || ''} ${record.student.last_name || ''}`.trim()
                    : selectedStudent
                      ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                      : ''
                }
                studentNumber={
                  record.student?.student_number || selectedStudent?.student_number
                }
              />
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Program" value={record.student.program} />
              <Info label="Year level" value={record.student.year_level} />
              <Info label="Status" value={<StatusBadge status={record.student.status} />} />
              {(record.overall_gpa != null || record.total_units != null) && (
                <>
                  <Info label="Overall GPA" value={record.overall_gpa ?? '—'} />
                  <Info label="Total units" value={record.total_units ?? '—'} />
                </>
              )}
            </dl>
          </div>

          {!record.terms?.length && (
            <EmptyState
              title="No academic history yet"
              description="This student has no enrollments recorded yet."
            />
          )}

          {record.terms?.map((term) => (
            <div
              key={term.academic_term_id}
              className="overflow-hidden rounded-md border border-slate-200 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="font-semibold text-slate-900">
                  {term.academic_year} — {term.term_name}
                </h3>
                {(term.term_gpa != null || term.total_units != null) && (
                  <p className="text-xs text-slate-500">
                    Units: {term.total_units ?? '—'} · Term GPA: {term.term_gpa ?? '—'}
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Units</th>
                      <th className="px-4 py-3">Enrollment</th>
                      <th className="px-4 py-3">Midterm</th>
                      <th className="px-4 py-3">Final</th>
                      <th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {term.enrolled_courses.map((course) => {
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
                          <td className="px-4 py-3">{course.section}</td>
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
            </div>
          ))}
        </div>
      )}

      {!loading && !selectedId && staffOrInstructor && (
        <EmptyState
          title="Select a student"
          description="Choose a student to load their academic record."
        />
      )}

      {canManageStudents(roles) && selectedId && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedId(String(selectedId))}
          >
            Refresh record
          </Button>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-800">{value}</dd>
    </div>
  )
}
