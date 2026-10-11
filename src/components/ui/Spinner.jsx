export function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-12 text-slate-600 ${className}`}>
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}
