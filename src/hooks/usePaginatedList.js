import { useCallback, useEffect, useState } from 'react'
import { parseApiError } from '../utils/errors'

/**
 * Generic paginated list loader for DRF page-number responses.
 */
export function usePaginatedList(fetcher, initialFilters = {}) {
  const [filters, setFilters] = useState({ page: 1, per_page: 10, ...initialFilters })
  const [data, setData] = useState({ count: 0, results: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== '' && value !== null && value !== undefined,
        ),
      )
      const response = await fetcher(params)
      setData({
        count: response.count ?? response.results?.length ?? 0,
        results: response.results ?? (Array.isArray(response) ? response : []),
        next: response.next,
        previous: response.previous,
      })
    } catch (err) {
      setError(parseApiError(err))
      setData({ count: 0, results: [] })
    } finally {
      setLoading(false)
    }
  }, [fetcher, filters])

  useEffect(() => {
    load()
  }, [load])

  function updateFilters(patch) {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      page: Object.prototype.hasOwnProperty.call(patch, 'page') ? patch.page : 1,
    }))
  }

  return {
    filters,
    setFilters,
    updateFilters,
    data,
    loading,
    error,
    reload: load,
  }
}
