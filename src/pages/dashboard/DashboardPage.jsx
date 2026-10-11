import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses } from '../../api/coursesApi'
import { listEnrollments } from '../../api/enrollmentApi'
import { listGrades } from '../../api/gradesApi'
import { listOfferings } from '../../api/offeringsApi'
import { listPrograms } from '../../api/programsApi'
import { getStudent, getStudentAcademicRecord, listStudents } from '../../api/studentsApi'
import { listTerms } from '../../api/termsApi'
import { Alert } from '../../components/ui/Alert'
import { PageHeader } from '../../components/ui/PageHeader'
import { RemarksBadge } from '../../components/ui/StatusBadge'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { getNavItems } from '../../components/layout/SidebarNav'
import {
  canManageStudents,
  canViewCatalog,
  canViewOfferings,
  primaryRoleLabel,
} from '../../utils/roles'
import { parseApiError } from '../../utils/errors'
import { computeFinalRating, computeRemarks } from '../../utils/grading'

export function DashboardPage() {
  const { user, roles, studentId } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isStudent = roles.includes('Student') && !roles.includes('Administrator') && !roles.includes('Registrar/Staff') && !roles.includes('Instructor')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const next = {}

        if (isStudent && studentId) {
          const [student, enrollments, grades, record] = await Promise.all([
            getStudent(studentId).catch(() => null),
            listEnrollments({ per_page: 100 }).catch(() => ({ results: [], count: 0 })),
            listGrades({ per_page: 10 }).catch(() => ({ results: [] })),
            getStudentAcademicRecord(studentId).catch(() => null),
          ])

          next.student = student
          next.enrollments = enrollments.results || []
          next.enrollmentCount = enrollments.count ?? next.enrollments.length
          next.currentEnrollments = next.enrollments.filter((e) => e.status === 'ENROLLED')
          next.currentUnits = next.currentEnrollments.reduce(
            (sum, e) => sum + (Number(e.units) || 0),
            0,
          )
          next.grades = grades.results || []
          next.record = record
          next.overallGpa = record?.overall_gpa ?? null

          const activeTerms = await listTerms({ per_page: 20, status: 'ACTIVE' }).catch(() => ({
            results: [],
          }))
          const fromEnrollment = next.currentEnrollments.find((e) => e.term_status === 'ACTIVE')
          next.currentTerm = activeTerms.results?.[0] || null
          if (!next.currentTerm && fromEnrollment) {
            next.currentTerm = {
              name: fromEnrollment.term_name,
              school_year: fromEnrollment.school_year,
            }
          }
        } else {
          if (canManageStudents(roles) || roles.includes('Instructor')) {
            const students = await listStudents({ page: 1, per_page: 1 })
            next.students = students.count
          }
          if (canViewCatalog(roles)) {
            const [programs, courses, terms] = await Promise.all([
              listPrograms({ page: 1, per_page: 1 }),
              listCourses({ page: 1, per_page: 1 }),
              listTerms({ page: 1, per_page: 1 }),
            ])
            next.programs = programs.count
            next.courses = courses.count
            next.terms = terms.count
          }
          if (canViewOfferings(roles)) {
            const offerings = await listOfferings({ page: 1, per_page: 1 })
            next.offerings = offerings.count
          }
          if (canManageStudents(roles) || roles.includes('Instructor')) {
            const enrollments = await listEnrollments({ page: 1, per_page: 1 })
            next.enrollments = enrollments.count
          }
        }

        if (!cancelled) setSummary(next)
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
  }, [roles, studentId, isStudent])

  const links = getNavItems(roles).filter((item) => item.to !== '/dashboard')

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.first_name || user?.username}`}
        description={`${primaryRoleLabel(roles)} · ${user?.email || 'No email on file'}`}
        breadcrumb="Dashboard"
      />

      {error && (
        <Alert type="error" title="Could not load dashboard summary" className="mb-4">
          {error.userMessage || error.message}
        </Alert>
      )}

      {loading ? (
        <Spinner />
      ) : isStudent ? (
        <StudentDashboard summary={summary} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary?.students != null && (
            <SummaryCard label="Students" value={summary.students} to="/students" />
          )}
          {summary?.programs != null && (
            <SummaryCard label="Programs" value={summary.programs} to="/programs" />
          )}
          {summary?.courses != null && (
            <SummaryCard label="Courses" value={summary.courses} to="/courses" />
          )}
          {summary?.terms != null && (
            <SummaryCard label="Academic Terms" value={summary.terms} to="/terms" />
          )}
          {summary?.offerings != null && (
            <SummaryCard label="Course Offerings" value={summary.offerings} to="/course-offerings" />
          )}
          {summary?.enrollments != null && (
            <SummaryCard label="Enrollments" value={summary.enrollments} to="/enrollment" />
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quick links
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-brand-300 hover:bg-brand-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StudentDashboard({ summary }) {
  const student = summary?.student
  const currentTerm = summary?.currentTerm
  const latestGrades = (summary?.grades || []).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Program"
          value={student?.program_name || student?.program || '—'}
          to="/my-profile"
          textValue
        />
        <SummaryCard
          label="Year level"
          value={student?.year_level ?? '—'}
          to="/my-profile"
        />
        <SummaryCard
          label="Current term"
          value={
            currentTerm
              ? `${currentTerm.name}${currentTerm.school_year ? ` · ${currentTerm.school_year}` : ''}`
              : '—'
          }
          to="/my-enrollments"
          textValue
        />
        <SummaryCard
          label="Current enrollments"
          value={summary?.currentEnrollments?.length ?? summary?.enrollmentCount ?? 0}
          to="/my-enrollments"
        />
        <SummaryCard
          label="Current units"
          value={summary?.currentUnits ?? 0}
          to="/my-enrollments"
        />
        <SummaryCard
          label="Overall GPA"
          value={summary?.overallGpa ?? summary?.record?.overall_gpa ?? '—'}
          to="/my-academic-record"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Latest grades</h2>
          <Link to="/my-grades" className="text-xs font-medium text-brand-800 hover:underline">
            View all
          </Link>
        </div>
        {latestGrades.length === 0 ? (
          <p className="text-sm text-slate-500">No grades recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {latestGrades.map((row) => {
              const rating =
                row.final_rating ??
                row.grade ??
                computeFinalRating(row.midterm_grade, row.final_grade)
              const remarks = row.remarks || computeRemarks(rating)
              return (
                <li key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium text-slate-800">{row.course_code || 'Course'}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-slate-600">{rating != null ? rating : '—'}</span>
                    <RemarksBadge remarks={remarks} finalRating={rating} />
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <QuickLink to="/my-enrollments" label="My Enrollments" />
        <QuickLink to="/my-grades" label="My Grades" />
        <QuickLink to="/my-academic-record" label="My Academic Record" />
      </div>
    </div>
  )
}

function SummaryCard({ label, value, to, textValue = false }) {
  return (
    <Link
      to={to}
      className="rounded-md border border-slate-200 bg-white px-4 py-5 transition hover:border-brand-300"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-2 font-semibold text-slate-900 ${
          textValue ? 'text-base leading-snug' : 'text-3xl'
        }`}
      >
        {value}
      </p>
    </Link>
  )
}

function QuickLink({ to, label }) {
  return (
    <Link
      to={to}
      className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
    >
      {label}
    </Link>
  )
}
