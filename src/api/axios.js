import axios from 'axios'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null
let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (!error.response || error.response.status !== 401 || original?._retry) {
      return Promise.reject(error)
    }

    // Do not attempt refresh on login/refresh endpoints.
    if (original.url?.includes('/auth/login/') || original.url?.includes('/token/')) {
      return Promise.reject(error)
    }

    const refresh = getRefreshToken()
    if (!refresh) {
      clearTokens()
      onUnauthorized?.()
      return Promise.reject(error)
    }

    original._retry = true

    try {
      refreshPromise =
        refreshPromise ||
        axios.post(`${API_BASE_URL}/api/v1/token/refresh/`, { refresh })

      const { data } = await refreshPromise
      refreshPromise = null
      setTokens({ access: data.access, refresh: data.refresh || refresh })
      original.headers.Authorization = `Bearer ${data.access}`
      return apiClient(original)
    } catch (refreshError) {
      refreshPromise = null
      clearTokens()
      onUnauthorized?.()
      return Promise.reject(refreshError)
    }
  },
)

export function getApiBaseUrl() {
  return API_BASE_URL
}
