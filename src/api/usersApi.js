import { apiClient } from './axios'

export async function listUsers(params = {}) {
  const { data } = await apiClient.get('/users/', { params })
  return data
}
