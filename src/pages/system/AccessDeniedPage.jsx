import { Alert } from '../../components/ui/Alert'
import { PageHeader } from '../../components/ui/PageHeader'

export function AccessDeniedPage({
  message = 'You do not have permission to access this page or perform this action.',
}) {
  return (
    <div>
      <PageHeader title="Access Denied" breadcrumb="System" />
      <Alert type="warning" title="Permission required">
        {message}
      </Alert>
    </div>
  )
}
