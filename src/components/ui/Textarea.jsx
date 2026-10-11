export function Textarea({
  label,
  id,
  error,
  required = false,
  className = '',
  rows = 3,
  ...props
}) {
  const areaId = id || props.name
  return (
    <div className={className}>
      {label && (
        <label htmlFor={areaId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
