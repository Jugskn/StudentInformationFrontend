import { getStatusLabel } from '../../utils/statusLabels'

const STYLE_MAP = {
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-700 border-slate-200',
  GRADUATED: 'bg-brand-50 text-brand-800 border-brand-200',
  COMPLETED: 'bg-brand-50 text-brand-800 border-brand-200',
  OPEN: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-800 border-red-200',
  ENROLLED: 'bg-brand-50 text-brand-800 border-brand-200',
  DROPPED: 'bg-amber-50 text-amber-900 border-amber-200',
  DRAFT: 'bg-amber-50 text-amber-900 border-amber-200',
  FINAL: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PASSED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  FAILED: 'bg-red-50 text-red-800 border-red-200',
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
}

function normalizeStatus(status) {
  if (status == null || status === '') return ''
  const raw = String(status).trim()
  if (/^passed$/i.test(raw)) return 'PASSED'
  if (/^failed$/i.test(raw)) return 'FAILED'
  if (/^pending$/i.test(raw)) return 'PENDING'
  return raw.toUpperCase()
}

export function StatusBadge({ status, label }) {
  if (!status && !label) {
    return <span className="text-slate-400">—</span>
  }

  const key = normalizeStatus(status)
  const display = label || getStatusLabel(status) || getStatusLabel(key)

  if (!display) {
    return <span className="text-slate-400">—</span>
  }

  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${
        STYLE_MAP[key] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {display}
    </span>
  )
}

/** Remarks cell: Passed / Failed badges, or muted Pending. */
export function RemarksBadge({ remarks, finalRating }) {
  const value = remarks || ''
  if (/^passed$/i.test(value)) {
    return <StatusBadge status="PASSED" />
  }
  if (/^failed$/i.test(value)) {
    return <StatusBadge status="FAILED" />
  }
  if (finalRating != null && finalRating !== '') {
    const rating = Number(finalRating)
    if (!Number.isNaN(rating)) {
      return <StatusBadge status={rating >= 75 ? 'PASSED' : 'FAILED'} />
    }
  }
  return <span className="text-sm text-slate-400">Pending</span>
}
