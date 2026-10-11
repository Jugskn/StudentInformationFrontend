/**
 * Map Axios errors to user-facing messages and field details.
 * Expected error shape: { error: { code, message, details } }
 */
export function parseApiError(error) {
  if (!error.response) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message:
        'Unable to connect to the server. Please try again later.',
      details: {},
      fieldErrors: {},
    }
  }

  const { status, data } = error.response
  const body = data?.error || {}
  const details = body.details || {}
  const fieldErrors = normalizeFieldErrors(details)

  const defaults = {
    400: 'Please correct the highlighted information.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested record could not be found.',
    409: body.message || 'This record conflicts with an existing entry.',
    422: 'Please correct the highlighted information.',
    500: 'The server encountered an error. Please try again later.',
  }

  return {
    status,
    code: body.code || `HTTP_${status}`,
    message: body.message || defaults[status] || 'The request could not be completed.',
    details,
    fieldErrors,
    userMessage: defaults[status] || body.message || 'The request could not be completed.',
  }
}

function normalizeFieldErrors(details) {
  const result = {}
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return result
  }
  for (const [key, value] of Object.entries(details)) {
    if (Array.isArray(value)) {
      result[key] = value.map(String)
    } else if (typeof value === 'string') {
      result[key] = [value]
    } else if (value && typeof value === 'object') {
      result[key] = [JSON.stringify(value)]
    }
  }
  return result
}

export function firstFieldError(fieldErrors, field) {
  const messages = fieldErrors?.[field]
  return Array.isArray(messages) && messages.length ? messages[0] : ''
}
