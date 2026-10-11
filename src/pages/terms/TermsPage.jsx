import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createTerm, deleteTerm, listTerms, updateTerm } from '../../api/termsApi'
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
import { canManageCatalog } from '../../utils/roles'
import { statusOptions } from '../../utils/statusLabels'

const empty = {
  name: '',
  school_year: '',
  start_date: '',
  end_date: '',
  status: 'ACTIVE',
}

export function TermsPage() {
  const { roles } = useAuth()
  const toast = useToast()
  const canManage = canManageCatalog(roles)
  const fetcher = useMemo(() => (params) => listTerms(params), [])
  const { filters, updateFilters, data, loading, error, reload } = usePaginatedList(fetcher, {
    search: '',
    status: '',
    school_year: '',
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
      name: row.name,
      school_year: row.school_year,
      start_date: row.start_date || '',
      end_date: row.end_date || '',
      status: row.status,
    })
    setLocalErrors({})
    setServerErrors({})
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!values.name.trim()) errors.name = 'Name is required.'
    if (!values.school_year.trim()) errors.school_year = 'School year is required.'
    setLocalErrors(errors)
    if (Object.keys(errors).length) return

    setSaving(true)
    setServerErrors({})
    try {
      const payload = {
        name: values.name.trim(),
        school_year: values.school_year.trim(),
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        status: values.status,
      }
      if (editing) {
        await updateTerm(editing.id, payload)
        toast.success('Academic term updated.')
      } else {
        await createTerm(payload)
        toast.success('Academic term created.')
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
      await deleteTerm(confirm.id)
      toast.success('Academic term deleted.')
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
    { key: 'name', header: 'Term' },
    { key: 'school_year', header: 'School year' },
    { key: 'start_date', header: 'Start', render: (row) => row.start_date || '—' },
    { key: 'end_date', header: 'End', render: (row) => row.end_date || '—' },
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
        title="Academic Terms"
        description="Academic terms and school years."
        breadcrumb="Catalog"
        actions={canManage ? <Button onClick={openCreate}>Add term</Button> : null}
      />

      <div className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Input
          label="Search"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
        />
        <Input
          label="School year"
          value={filters.school_year}
          onChange={(e) => updateFilters({ school_year: e.target.value })}
          placeholder="e.g. 2025-2026"
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          placeholder="All"
          options={statusOptions(['ACTIVE', 'INACTIVE', 'COMPLETED'])}
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
            <EmptyState title="No academic terms found" />
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
        title={editing ? 'Edit academic term' : 'Create academic term'}
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
            label="Name"
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            error={err('name')}
          />
          <Input
            label="School year"
            required
            value={values.school_year}
            onChange={(e) => setValues((v) => ({ ...v, school_year: e.target.value }))}
            error={err('school_year')}
          />
          <Input
            label="Start date"
            type="date"
            value={values.start_date}
            onChange={(e) => setValues((v) => ({ ...v, start_date: e.target.value }))}
            error={err('start_date')}
          />
          <Input
            label="End date"
            type="date"
            value={values.end_date}
            onChange={(e) => setValues((v) => ({ ...v, end_date: e.target.value }))}
            error={err('end_date')}
          />
          <Select
            label="Status"
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
            options={statusOptions(['ACTIVE', 'INACTIVE', 'COMPLETED'])}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete academic term"
        message={`Delete term ${confirm?.name}?`}
        danger
        confirmLabel="Delete"
        loading={confirmLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
