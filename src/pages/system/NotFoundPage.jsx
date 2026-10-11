import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
