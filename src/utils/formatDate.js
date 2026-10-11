/**
 * Format an ISO date/datetime as "Oct 8, 2026, 8:00 AM".
 * Returns "—" for empty/invalid values.
 */
export function formatDate(value, { includeTime = true } = {}) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (!includeTime) return datePart

  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return `${datePart}, ${timePart}`
}
