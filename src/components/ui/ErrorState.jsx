import { Alert } from './Alert'
import { Button } from './Button'

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  accessDenied = false,
}) {
  return (
    <Alert type={accessDenied ? 'warning' : 'error'} title={accessDenied ? 'Access Denied' : title}>
      <p>{message}</p>
      {onRetry && (
        <div className="mt-3">
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </Alert>
  )
}
