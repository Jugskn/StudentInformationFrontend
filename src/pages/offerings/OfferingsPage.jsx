import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { listCourses } from '../../api/coursesApi'
import {
  createOffering,
  deleteOffering,
  listOfferings,
  updateOffering,
} from '../../api/offeringsApi'
import { listTerms } from '../../api/termsApi'
import { listUsers } from '../../api/usersApi'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
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
import { Table } from '../../components/ui/Table'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { firstFieldError, parseApiError } from '../../utils/errors'
import { canManageOfferings, isStaff } from '../../utils/roles'
import { statusOptions } from '../../utils/statusLabels'

const empty = {
  course: '',
  academic_term: '',
  instructor: '',
  section: '',
  schedule: '',
  room: '',
  capacity: '30',
  status: 'OPEN',
}

export function OfferingsPage() {
  const { roles } = useAuth()
  const toast = useToast()
  const canManage = canManageOfferings(roles)
  const fetcher = useMemo(() => (params) => listOfferings(params), [])
  const { filters, updateFilters, data, loading, error, reload } = usePaginatedList(fetcher, {
    search: '',
    status: '',
    course: '',
    academic_term: '',
  })

  const [courses, setCourses] = useState([])
  const [terms, setTerms] = useState([])
  const [instructors, setInstructors] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState(empty)
  const [localErrors, setLocalErrors] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      listCourses({ per_page: 100 }),
      listTerms({ per_page: 100 }),
    ]).then(([c, t]) => {
      setCourses(c.results || [])
      setTerms(t.results || [])
    }).catch(() => {})

    if (isStaff(roles)) {
      listUsers({ per_page: 100, search: '' })
        .then((res) => {
          const users = (res.results || []).filter((u) =>
            (u.roles || []).includes('Instructor'),
          )
          setInstructors(users)
        })
        .catch(() => setInstructors([]))
    }
  }, [roles])

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
      course: String(row.course),
      academic_term: String(row.academic_term),
      instructor: String(row.instructor),
      section: row.section || '',
      schedule: row.schedule || '',
      room: row.room || '',
      capacity: String(row.capacity ?? 30),
      status: row.status || 'OPEN',
    })
    setLocalErrors({})
    setServerErrors({})
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!values.course) errors.course = 'Course is required.'
    if (!values.academic_term) errors.academic_term = 'Academic term is required.'
    if (!values.instructor) errors.instructor = 'Instructor is required.'
    if (!values.section.trim()) errors.section = 'Section is required.'
    if (Number(values.capacity) < 1) errors.capacity = 'Capacity must be at least 1.'
    setLocalErrors(errors)
    if (Object.keys(errors).length) return

    setSaving(true)
    setServerErrors({})
    try {
      const payload = {
        course: Number(values.course),
        academic_term: Number(values.academic_term),
        instructor: Number(values.instructor),
        section: values.section.trim(),
        schedule: values.schedule.trim(),
        room: values.room.trim(),
        capacity: Number(values.capacity),
        status: values.status,
      }
      if (editing) {
        await updateOffering(editing.id, payload)
        toast.success('Course offering updated.')
      } else {
        await createOffering(payload)
        toast.success('Course offering created.')
      }
      setModalOpen(false)
      reload()
    } catch (err) {
      const parsed = parseApiError(err)
      setServerErrors(parsed.fieldErrors)
      toast.error(parsed.userMessage || parsed.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setConfirmLoading(true)
    try {
      await deleteOffering(confirm.id)
      toast.success('Course offering deleted.')
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
    { key: 'course_code', header: 'Course' },
    { key: 'term_name', header: 'Term' },
    { key: 'section', header: 'Section' },
    { key: 'instructor_username', header: 'Instructor' },
    { key: 'schedule', header: 'Schedule', render: (row) => row.schedule || '—' },
    { key: 'room', header: 'Room', render: (row) => row.room || '—' },
    { key: 'capacity', header: 'Capacity' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
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
        title="Course Offerings"
        description="Sections offered per term with instructor and schedule."
        breadcrumb="Scheduling"
        actions={canManage ? <Button onClick={openCreate}>Add offering</Button> : null}
      />

      <div className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
        />
        <Select
          label="Course"
          value={filters.course}
          onChange={(e) => updateFilters({ course: e.target.value })}
          placeholder="All courses"
          options={courses.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.title}` }))}
        />
        <Select
          label="Term"
          value={filters.academic_term}
          onChange={(e) => updateFilters({ academic_term: e.target.value })}
          placeholder="All terms"
          options={terms.map((t) => ({
            value: String(t.id),
            label: `${t.school_year} — ${t.name}`,
          }))}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          placeholder="All"
          options={statusOptions(['OPEN', 'CLOSED', 'CANCELLED'])}
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
            <EmptyState title="No course offerings found" />
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
        title={editing ? 'Edit course offering' : 'Create course offering'}
        onClose={() => !saving && setModalOpen(false)}
        size="lg"
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
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Select
            label="Course"
            required
            value={values.course}
            onChange={(e) => setValues((v) => ({ ...v, course: e.target.value }))}
            error={err('course')}
            placeholder="Select course"
            options={courses.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.title}` }))}
          />
          <Select
            label="Academic term"
            required
            value={values.academic_term}
            onChange={(e) => setValues((v) => ({ ...v, academic_term: e.target.value }))}
            error={err('academic_term')}
            placeholder="Select term"
            options={terms.map((t) => ({
              value: String(t.id),
              label: `${t.school_year} — ${t.name}`,
            }))}
          />
          <Select
            label="Instructor"
            required
            value={values.instructor}
            onChange={(e) => setValues((v) => ({ ...v, instructor: e.target.value }))}
            error={err('instructor')}
            placeholder="Select instructor"
            options={
              instructors.length
                ? instructors.map((u) => ({
                    value: String(u.id),
                    label: `${u.username} (${u.first_name} ${u.last_name})`,
                  }))
                : editing
                  ? [{ value: String(values.instructor), label: `User #${values.instructor}` }]
                  : []
            }
          />
          <Input
            label="Section"
            required
            value={values.section}
            onChange={(e) => setValues((v) => ({ ...v, section: e.target.value }))}
            error={err('section')}
          />
          <Input
            label="Schedule"
            value={values.schedule}
            onChange={(e) => setValues((v) => ({ ...v, schedule: e.target.value }))}
          />
          <Input
            label="Room"
            value={values.room}
            onChange={(e) => setValues((v) => ({ ...v, room: e.target.value }))}
          />
          <Input
            label="Capacity"
            type="number"
            min="1"
            value={values.capacity}
            onChange={(e) => setValues((v) => ({ ...v, capacity: e.target.value }))}
            error={err('capacity')}
          />
          <Select
            label="Status"
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
            options={statusOptions(['OPEN', 'CLOSED', 'CANCELLED'])}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete course offering"
        message={`Delete offering ${confirm?.course_code} ${confirm?.section}?`}
        danger
        confirmLabel="Delete"
        loading={confirmLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
