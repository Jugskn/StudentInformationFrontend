export function StudentCell({
  name,
  studentNumber,
  student_name,
  student_number,
  first_name,
  last_name,
}) {
  const number = studentNumber || student_number || ''
  const resolvedName =
    name ||
    student_name ||
    [first_name, last_name].filter(Boolean).join(' ') ||
    (last_name && first_name ? `${last_name}, ${first_name}` : '') ||
    ''

  const displayName = resolvedName || number || '—'
  const showNumber = number && number !== displayName

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
      {showNumber ? (
        <p className="truncate text-xs text-slate-500">{number}</p>
      ) : null}
    </div>
  )
}
