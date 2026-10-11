export function Alert({ type = 'info', title, children, className = '' }) {
  const styles = {
    info: 'border-brand-200 bg-brand-50 text-brand-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
  }

  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${styles[type]} ${className}`} role="alert">
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  )
}
