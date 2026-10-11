const STATUS_LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  GRADUATED: 'Graduated',
  OPEN: 'Open',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
  ENROLLED: 'Enrolled',
  DROPPED: 'Dropped',
  COMPLETED: 'Completed',
  DRAFT: 'Draft',
  FINAL: 'Final',
  PASSED: 'Passed',
  FAILED: 'Failed',
  PENDING: 'Pending',
}

export function getStatusLabel(status) {
  if (status == null || status === '') return ''
  const key = String(status).toUpperCase()
  if (STATUS_LABELS[key]) return STATUS_LABELS[key]
  // Title-case fallback for values like "Passed"
  const raw = String(status)
  if (raw === 'Passed') return 'Passed'
  if (raw === 'Failed') return 'Failed'
  return raw
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function statusOptions(values) {
  return values.map((value) => ({
    value,
    label: getStatusLabel(value),
  }))
}

export { STATUS_LABELS }
