import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  createStudent,
  deleteStudent,
  listStudents,
  updateStudent,
} from '../../api/studentsApi'
import { listPrograms } from '../../api/programsApi'
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
import { StudentCell } from '../../components/ui/StudentCell'
import { Table } from '../../components/ui/Table'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { debounce } from '../../utils/debounce'
import { firstFieldError, parseApiError } from '../../utils/errors'
import { canManageStudents } from '../../utils/roles'
import { statusOptions } from '../../utils/statusLabels'
import { StudentForm } from './StudentForm'

export function StudentsPage() {
  const { roles } = useAuth()
  const toast = useToast()
  const canManage = canManageStudents(roles)

  const fetcher = useMemo(() => (params) => listStudents(params), [])
  const { filters, updateFilters, data, loading, error, reload } = usePaginatedList(fetcher, {
    search: '',
    program: '',
    year_level: '',
    status: '',
    ordering: 'last_name',
  })

  const [searchInput, setSearchInput] = useState('')
  const [programs, setPrograms] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [formMessage, setFormMessage] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    listPrograms({ per_page: 100 })
      .then((res) => setPrograms(res.results || []))
      .catch(() => setPrograms([]))
  }, [])

  useEffect(() => {
    const run = debounce((value) => {
      updateFilters({ search: value, page: 1 })
    }, 400)
    run(searchInput)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null)
    setFormErrors({})
    setFormMessage('')
    setModalOpen(true)
  }

  function openEdit(student) {
    setEditing(student)
    setFormErrors({})
    setFormMessage('')
    setModalOpen(true)
  }

  async function handleSubmit(payload) {
    setSaving(true)
    setFormErrors({})
    setFormMessage('')
    try {
      if (editing) {
        await updateStudent(editing.id, payload)
        toast.success('Student updated successfully.')
      } else {
        await createStudent(payload)
        toast.success('Student created successfully.')
      }
      setModalOpen(false)
      reload()
    } catch (err) {
      const parsed = parseApiError(err)
      setFormErrors(parsed.fieldErrors)
      setFormMessage(parsed.userMessage || parsed.message)
      if (parsed.status === 403) {
        toast.error(parsed.userMessage)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirm() {
    if (!confirm) return
    setConfirmLoading(true)
    try {
      if (confirm.type === 'deactivate') {
        await updateStudent(confirm.student.id, { status: 'INACTIVE' })
        toast.success('Student deactivated.')
      } else if (confirm.type === 'reactivate') {
        await updateStudent(confirm.student.id, { status: 'ACTIVE' })
        toast.success('Student reactivated.')
      } else if (confirm.type === 'delete') {
        await deleteStudent(confirm.student.id)
        toast.success('Student deleted.')
      }
      setConfirm(null)
      reload()
    } catch (err) {
      const parsed = parseApiError(err)
      toast.error(parsed.userMessage || parsed.message)
    } finally {
      setConfirmLoading(false)
    }
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <StudentCell
          name={`${row.first_name || ''} ${row.last_name || ''}`.trim()}
          studentNumber={row.student_number}
        />
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'program_name',
      header: 'Program',
      render: (row) => row.program_name || row.program,
    },
    { key: 'year_level', header: 'Year' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
              Edit
            </Button>
            {row.status === 'INACTIVE' ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirm({ type: 'reactivate', student: row })}
              >
                Reactivate
              </Button>
            ) : row.status === 'ACTIVE' ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirm({ type: 'deactivate', student: row })}
              >
                Deactivate
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="danger"
              onClick={() => setConfirm({ type: 'delete', student: row })}
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
        title="Students"
        description="Search, filter, and manage student records."
        breadcrumb="Academic"
        actions={
          canManage ? (
            <Button onClick={openCreate}>Add student</Button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          id="student-search"
          name="search"
          label="Search"
          placeholder="Name, number, or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          label="Program"
          value={filters.program}
          onChange={(e) => updateFilters({ program: e.target.value })}
          placeholder="All programs"
          options={programs.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` }))}
        />
        <Select
          label="Year level"
          value={filters.year_level}
          onChange={(e) => updateFilters({ year_level: e.target.value })}
          placeholder="All years"
          options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` }))}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          placeholder="All statuses"
          options={statusOptions(['ACTIVE', 'INACTIVE', 'GRADUATED'])}
        />
        <Select
          label="Sort"
          value={filters.ordering}
          onChange={(e) => updateFilters({ ordering: e.target.value, page: filters.page })}
          options={[
            { value: 'last_name', label: 'Last name' },
            { value: 'first_name', label: 'First name' },
            { value: 'student_number', label: 'Student number' },
            { value: 'year_level', label: 'Year level' },
            { value: '-id', label: 'Newest first' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {loading && <LoadingBlock />}
        {!loading && error && (
          <div className="p-4">
            <ErrorState
              message={error.userMessage || error.message}
              accessDenied={error.status === 403}
              onRetry={reload}
            />
          </div>
        )}
        {!loading && !error && data.results.length === 0 && (
          <div className="p-4">
            <EmptyState
              title="No students found"
              description="Try adjusting search or filters, or create a new student."
              actionLabel={canManage ? 'Add student' : undefined}
              onAction={canManage ? openCreate : undefined}
            />
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
        title={editing ? 'Edit student' : 'Create student'}
        onClose={() => !saving && setModalOpen(false)}
        size="lg"
        footer={null}
      >
        <StudentForm
          initial={editing}
          programs={programs}
          saving={saving}
          serverErrors={formErrors}
          serverMessage={formMessage}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
        {formMessage && !Object.keys(formErrors).length && (
          <p className="mt-3 text-sm text-red-600">{formMessage}</p>
        )}
        {firstFieldError(formErrors, 'non_field_errors') && (
          <p className="mt-3 text-sm text-red-600">
            {firstFieldError(formErrors, 'non_field_errors')}
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.type === 'delete'
            ? 'Delete student'
            : confirm?.type === 'reactivate'
              ? 'Reactivate student'
              : 'Deactivate student'
        }
        message={
          confirm?.type === 'delete'
            ? `Permanently delete student ${confirm?.student?.student_number}? Their enrollments and grades will also be removed. This cannot be undone.`
            : confirm?.type === 'reactivate'
              ? `Set student ${confirm?.student?.student_number} status back to Active?`
              : `Set student ${confirm?.student?.student_number} status to Inactive?`
        }
        confirmLabel={
          confirm?.type === 'delete'
            ? 'Delete'
            : confirm?.type === 'reactivate'
              ? 'Reactivate'
              : 'Deactivate'
        }
        danger={confirm?.type === 'delete'}
        loading={confirmLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
