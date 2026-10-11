import { describe, expect, it } from 'vitest'
import { parseApiError } from '../utils/errors'

describe('parseApiError', () => {
  it('maps network failures', () => {
    const result = parseApiError({ message: 'Network Error' })
    expect(result.status).toBe(0)
    expect(result.message).toMatch(/Unable to connect/i)
  })

  it('maps 401 session expiry', () => {
    const result = parseApiError({
      response: {
        status: 401,
        data: {
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication credentials were not provided or are invalid.',
            details: {},
          },
        },
      },
    })
    expect(result.userMessage).toMatch(/session has expired/i)
  })

  it('maps 403 access denied', () => {
    const result = parseApiError({
      response: {
        status: 403,
        data: {
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to perform this action.',
            details: {},
          },
        },
      },
    })
    expect(result.userMessage).toMatch(/do not have permission/i)
  })

  it('maps 404 not found', () => {
    const result = parseApiError({
      response: { status: 404, data: { error: { code: 'NOT_FOUND', message: 'Missing', details: {} } } },
    })
    expect(result.userMessage).toMatch(/could not be found/i)
  })

  it('maps 422 validation field errors', () => {
    const result = parseApiError({
      response: {
        status: 422,
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The request contains invalid data.',
            details: { email: ['Enter a valid email address.'] },
          },
        },
      },
    })
    expect(result.fieldErrors.email[0]).toMatch(/valid email/i)
    expect(result.userMessage).toMatch(/correct the highlighted/i)
  })

  it('maps 500 server errors', () => {
    const result = parseApiError({
      response: { status: 500, data: {} },
    })
    expect(result.userMessage).toMatch(/server encountered an error/i)
  })
})
