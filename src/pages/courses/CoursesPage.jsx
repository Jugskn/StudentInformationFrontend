import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  createCourse,
  deleteCourse,
  listCourses,
  updateCourse,
} from '../../api/coursesApi'
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
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { firstFieldError, parseApiError } from '../../utils/errors'
import { canManageCatalog } from '../../utils/roles'
import { statusOptions } from '../../utils/statusLabels'

const empty = { code: '', title: '', description: '', units: '3', status: 'ACTIVE' }

export function CoursesPage() {
  const { roles } = useAuth()
  const toast = useToast()
  const canManage = canManageCatalog(roles)
  const fetcher = useMemo(() => (params) => listCourses(params), [])
  const { filters, updateFilters, data, loading, error, reload } = usePaginatedList(fetcher, {
    search: '',
    status: '',
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [values, setValues] = useState(empty)
  const [localErrors, setLocalErrors] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

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
      code: row.code,
      title: row.title,
      description: row.description || '',
      units: String(row.units),
      status: row.status,
    })
    setLocalErrors({})
    setServerErrors({})
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!values.code.trim()) errors.code = 'Code is required.'
    if (!values.title.trim()) errors.title = 'Title is required.'
    const units = Number(values.units)
    if (!units || units < 1 || units > 12) errors.units = 'Units must be between 1 and 12.'
    setLocalErrors(errors)
    if (Object.keys(errors).length) return

    setSaving(true)
    setServerErrors({})
    try {
      const payload = {
        code: values.code.trim(),
        title: values.title.trim(),
        description: values.description.trim(),
        units,
        status: values.status,
      }
      if (editing) {
        await updateCourse(editing.id, payload)
        toast.success('Course updated.')
      } else {
        await createCourse(payload)
        toast.success('Course created.')
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
      await deleteCourse(confirm.id)
      toast.success('Course deleted.')
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
    { key: 'code', header: 'Code' },
    { key: 'title', header: 'Title' },
    { key: 'units', header: 'Units' },
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
        title="Courses"
        description="Course catalog for academic programs."
        breadcrumb="Catalog"
        actions={canManage ? <Button onClick={openCreate}>Add course</Button> : null}
      />

      <div className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Input
          label="Search"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          placeholder="Code, title, description"
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          placeholder="All"
          options={statusOptions(['ACTIVE', 'INACTIVE'])}
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
            <EmptyState title="No courses found" />
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
        title={editing ? 'Edit course' : 'Create course'}
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
          <Input
            label="Code"
            required
            value={values.code}
            onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
            error={err('code')}
          />
          <Input
            label="Title"
            required
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            error={err('title')}
          />
          <Textarea
            label="Description"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
          <Input
            label="Units"
            type="number"
            min="1"
            max="12"
            required
            value={values.units}
            onChange={(e) => setValues((v) => ({ ...v, units: e.target.value }))}
            error={err('units')}
          />
          <Select
            label="Status"
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
            options={statusOptions(['ACTIVE', 'INACTIVE'])}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete course"
        message={`Delete course ${confirm?.code}?`}
        danger
        confirmLabel="Delete"
        loading={confirmLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
