import { apiClient } from './axios'

export async function listPrograms(params = {}) {
  const { data } = await apiClient.get('/programs/', { params })
  return data
}

export async function getProgram(id) {
  const { data } = await apiClient.get(`/programs/${id}/`)
  return data
}

export async function createProgram(payload) {
  const { data } = await apiClient.post('/programs/', payload)
  return data
}

export async function updateProgram(id, payload) {
  const { data } = await apiClient.patch(`/programs/${id}/`, payload)
  return data
}

export async function deleteProgram(id) {
  await apiClient.delete(`/programs/${id}/`)
}
