import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { listEnrollments } from '../../api/enrollmentApi'
import {
  createGrade,
  deleteGrade,
  listGrades,
  updateGrade,
} from '../../api/gradesApi'
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
import { RemarksBadge } from '../../components/ui/StatusBadge'
import { StudentCell } from '../../components/ui/StudentCell'
import { Table } from '../../components/ui/Table'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { firstFieldError, parseApiError } from '../../utils/errors'
import { computeFinalRating, computeRemarks } from '../../utils/grading'
import { canManageGrades } from '../../utils/roles'

const empty = { enrollment: '', midterm_grade: '', final_grade: '' }

function parseOptionalGrade(value, field, errors) {
  if (value === '' || value == null) return null
  const num = Number(value)
  if (Number.isNaN(num) || num < 0 || num > 100) {
    errors[field] = 'Grade must be between 0 and 100.'
    return undefined
  }
  return num
}

function studentNameFromRow(row) {
  return (
    row.student_name ||
    [row.student_first_name, row.student_last_name].filter(Boolean).join(' ') ||
    ''
  )
}

export function GradesPage() {
  const { roles } = useAuth()
  const toast = useToast()
  const canManage = canManageGrades(roles)
  const fetcher = useMemo(() => (params) => listGrades(params), [])
  const { filters, updateFilters, data, loading, error, reload } = usePaginatedList(fetcher, {
    search: '',
  })

  const [enrollments, setEnrollments] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState(empty)
  const [localErrors, setLocalErrors] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const previewRating = computeFinalRating(values.midterm_grade, values.final_grade)
  const previewRemarks = computeRemarks(previewRating)

  useEffect(() => {
    if (!canManage) return
    listEnrollments({ per_page: 100, status: 'ENROLLED' })
      .then((res) => setEnrollments(res.results || []))
      .catch(() => setEnrollments([]))
  }, [canManage])

  function openCreate() {
    setEditing(null)
    setValues(empty)
    setLocalErrors({})
    setServerErrors({})
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    setValues({
      enrollment: String(row.enrollment),
      midterm_grade:
        row.midterm_grade != null && row.midterm_grade !== ''
          ? String(row.midterm_grade)
          : '',
      final_grade:
        row.final_grade != null && row.final_grade !== ''
          ? String(row.final_grade)
          : row.grade != null && row.midterm_grade == null
            ? String(row.grade)
            : '',
    })
    setLocalErrors({})
    setServerErrors({})
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!editing && !values.enrollment) errors.enrollment = 'Enrollment is required.'

    const midterm = parseOptionalGrade(values.midterm_grade, 'midterm_grade', errors)
    const final = parseOptionalGrade(values.final_grade, 'final_grade', errors)

    setLocalErrors(errors)
    if (Object.keys(errors).length) return

    const payload = {
      midterm_grade: midterm,
      final_grade: final,
    }

    setSaving(true)
    setServerErrors({})
    try {
      if (editing) {
        await updateGrade(editing.id, payload)
        toast.success('Grade updated.')
      } else {
        await createGrade({
          enrollment: Number(values.enrollment),
          ...payload,
        })
        toast.success('Grade recorded.')
      }
      setModalOpen(false)
      reload()
    } catch (err) {
      const parsed = parseApiError(err)
      setServerErrors(parsed.fieldErrors)
      if (parsed.status === 403) {
        toast.error('Access Denied: you do not have permission to manage this grade.')
      } else {
        toast.error(parsed.userMessage || parsed.message)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setConfirmLoading(true)
    try {
      await deleteGrade(confirm.id)
      toast.success('Grade deleted.')
      setConfirm(null)
      reload()
    } catch (err) {
      const parsed = parseApiError(err)
      toast.error(
        parsed.status === 403
          ? 'Access Denied: you do not have permission to delete this grade.'
          : parsed.userMessage,
      )
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
          name={studentNameFromRow(row)}
          studentNumber={row.student_number}
        />
      ),
    },
    { key: 'course_code', header: 'Course' },
    {
      key: 'midterm_grade',
      header: 'Midterm Grade',
      render: (row) =>
        row.midterm_grade != null && row.midterm_grade !== '' ? row.midterm_grade : '—',
    },
    {
      key: 'final_grade',
      header: 'Final Grade',
      render: (row) =>
        row.final_grade != null && row.final_grade !== ''
          ? row.final_grade
          : row.grade != null && row.midterm_grade == null
            ? row.grade
            : '—',
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (row) => {
        const rating =
          row.final_rating ??
          row.grade ??
          computeFinalRating(row.midterm_grade, row.final_grade)
        const remarks = row.remarks || computeRemarks(rating)
        return <RemarksBadge remarks={remarks} finalRating={rating} />
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        canManage ? (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirm(row)}>
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
        title="Grades"
        description="Record midterm and final grades for enrollments you are authorized to manage."
        breadcrumb="Assessment"
        actions={canManage ? <Button onClick={openCreate}>Add grade</Button> : null}
      />

      {!canManage && (
        <Alert type="info" className="mb-4">
          Students can view their own grades. Instructors manage grades for assigned offerings only.
        </Alert>
      )}

      <div className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Input
          label="Search"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          placeholder="Student number, course, remarks"
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
            <EmptyState title="No grades found" />
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
        title={editing ? 'Edit grade' : 'Record grade'}
        onClose={() => !saving && setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!editing && (
            <Select
              label="Enrollment"
              required
              value={values.enrollment}
              onChange={(e) => setValues((v) => ({ ...v, enrollment: e.target.value }))}
              error={err('enrollment')}
              placeholder="Select enrollment"
              options={enrollments.map((e) => ({
                value: String(e.id),
                label: `#${e.id} · ${e.student_number || e.student_name || 'Student'} · ${e.course_code}`,
              }))}
            />
          )}
          <Input
            label="Midterm grade"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={values.midterm_grade}
            onChange={(e) => setValues((v) => ({ ...v, midterm_grade: e.target.value }))}
            error={err('midterm_grade')}
            hint="Optional. Leave blank if not yet recorded."
          />
          <Input
            label="Final grade"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={values.final_grade}
            onChange={(e) => setValues((v) => ({ ...v, final_grade: e.target.value }))}
            error={err('final_grade')}
            hint="Optional on its own; required for a final rating when midterm is blank."
          />
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Remarks preview
            </p>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="text-slate-600">
                Rating: {previewRating != null ? previewRating : '—'}
              </span>
              <RemarksBadge remarks={previewRemarks} finalRating={previewRating} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete grade"
        message="Delete this grade record?"
        danger
        confirmLabel="Delete"
        loading={confirmLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
