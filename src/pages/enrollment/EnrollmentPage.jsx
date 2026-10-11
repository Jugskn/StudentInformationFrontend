import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  createEnrollment,
  deleteEnrollment,
  listEnrollments,
  updateEnrollment,
} from '../../api/enrollmentApi'
import { listOfferings } from '../../api/offeringsApi'
import { listStudents } from '../../api/studentsApi'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Input } from '../../components/ui/Input'
import { LoadingBlock } from '../../components/ui/LoadingBlock'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { StudentCell } from '../../components/ui/StudentCell'
import { Table } from '../../components/ui/Table'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { firstFieldError, parseApiError } from '../../utils/errors'
import { formatDate } from '../../utils/formatDate'
import { canManageEnrollments } from '../../utils/roles'
import { statusOptions } from '../../utils/statusLabels'

export function EnrollmentPage() {
  const { roles } = useAuth()
  const toast = useToast()
  const canManage = canManageEnrollments(roles)
  const fetcher = useMemo(() => (params) => listEnrollments(params), [])
  const { filters, updateFilters, data, loading, error, reload } = usePaginatedList(fetcher, {
    search: '',
    status: '',
    student: '',
    course_offering: '',
  })

  const [students, setStudents] = useState([])
  const [offerings, setOfferings] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [offeringId, setOfferingId] = useState('')
  const [localErrors, setLocalErrors] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    if (!canManage) return
    Promise.all([
      listStudents({ per_page: 100, status: 'ACTIVE' }),
      listOfferings({ per_page: 100, status: 'OPEN' }),
    ])
      .then(([s, o]) => {
        setStudents(s.results || [])
        setOfferings(o.results || [])
      })
      .catch(() => {})
  }, [canManage])

  async function handleCreate(event) {
    event.preventDefault()
    const errors = {}
    if (!studentId) errors.student = 'Select a student.'
    if (!offeringId) errors.course_offering = 'Select a course offering.'
    setLocalErrors(errors)
    if (Object.keys(errors).length) return

    setSaving(true)
    setServerErrors({})
    try {
      await createEnrollment({
        student: Number(studentId),
        course_offering: Number(offeringId),
        status: 'ENROLLED',
      })
      toast.success('Enrollment created.')
      setModalOpen(false)
      setStudentId('')
      setOfferingId('')
      reload()
    } catch (err) {
      const parsed = parseApiError(err)
      setServerErrors(parsed.fieldErrors)
      toast.error(parsed.userMessage || parsed.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmAction() {
    if (!confirm) return
    setConfirmLoading(true)
    try {
      if (confirm.type === 'delete') {
        await deleteEnrollment(confirm.row.id)
        toast.success('Enrollment removed.')
      } else if (confirm.type === 'drop') {
        await updateEnrollment(confirm.row.id, { status: 'DROPPED' })
        toast.success('Enrollment marked Dropped.')
      } else if (confirm.type === 'complete') {
        await updateEnrollment(confirm.row.id, { status: 'COMPLETED' })
        toast.success('Enrollment marked Completed.')
      }
      setConfirm(null)
      reload()
    } catch (err) {
      toast.error(parseApiError(err).userMessage)
    } finally {
      setConfirmLoading(false)
    }
  }

  function err(field) {
    return localErrors[field] || firstFieldError(serverErrors, field)
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <StudentCell
          name={row.student_name}
          studentNumber={row.student_number}
          first_name={row.student_first_name}
          last_name={row.student_last_name}
        />
      ),
    },
    { key: 'course_code', header: 'Course' },
    {
      key: 'enrolled_at',
      header: 'Enrolled at',
      render: (row) => formatDate(row.enrolled_at),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                setConfirm({
                  type: 'drop',
                  row,
                  title: 'Drop enrollment',
                  message: 'Mark this enrollment as Dropped?',
                  confirmLabel: 'Drop',
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Drop
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setConfirm({
                  type: 'complete',
                  row,
                  title: 'Complete enrollment',
                  message: 'Mark this enrollment as Completed?',
                  confirmLabel: 'Complete',
                })
              }
            >
              Complete
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                setConfirm({
                  type: 'delete',
                  row,
                  title: 'Delete enrollment',
                  message: 'Remove this enrollment record permanently?',
                  confirmLabel: 'Delete',
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">View only</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Enrollment"
        description="Enroll students in open course offerings."
        breadcrumb="Registration"
        actions={
          canManage ? <Button onClick={() => setModalOpen(true)}>New enrollment</Button> : null
        }
      />

      {!canManage && (
        <Alert type="info" className="mb-4" title="Read-only access">
          You can view enrollments available to your role. Creating enrollments requires an
          Administrator or Registrar account.
        </Alert>
      )}

      <div className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Input
          label="Search"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          placeholder="Student number or course code"
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          placeholder="All"
          options={statusOptions(['ENROLLED', 'DROPPED', 'COMPLETED'])}
        />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {loading && <LoadingBlock />}
        {!loading && error && (
          <div className="p-4">
            <ErrorState
              message={error.userMessage}
              accessDenied={error.status === 403}
              onRetry={reload}
            />
          </div>
        )}
        {!loading && !error && data.results.length === 0 && (
          <div className="p-4">
            <EmptyState title="No enrollments found" />
          </div>
        )}
        {!loading && !error && data.results.length > 0 && (
          <>
            <Table columns={columns} rows={data.results} />
            <Pagination
              page={filters.page}
              pageSize={filters.per_page}
              total={data.count}
              onPageChange={(page) => updateFilters({ page })}
            />
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Create enrollment"
        onClose={() => !saving && setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Submitting…' : 'Enroll student'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <Select
            label="Student"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            error={err('student')}
            placeholder="Select student"
            options={students.map((s) => ({
              value: String(s.id),
              label: `${s.student_number} — ${s.last_name}, ${s.first_name}`,
            }))}
          />
          <Select
            label="Course offering"
            required
            value={offeringId}
            onChange={(e) => setOfferingId(e.target.value)}
            error={err('course_offering')}
            placeholder="Select open offering"
            options={offerings.map((o) => ({
              value: String(o.id),
              label: `${o.course_code} · ${o.section} · ${o.term_name}`,
            }))}
          />
          <p className="text-xs text-slate-500">
            Duplicate enrollments, closed offerings, and full sections cannot be enrolled.
          </p>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || 'Confirm action'}
        message={confirm?.message || ''}
        danger={confirm?.type === 'delete' || confirm?.type === 'drop'}
        confirmLabel={confirm?.confirmLabel || 'Confirm'}
        loading={confirmLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}
