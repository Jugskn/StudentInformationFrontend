import { apiClient } from './axios'

export async function listEnrollments(params = {}) {
  const { data } = await apiClient.get('/enrollments/', { params })
  return data
}

export async function getEnrollment(id) {
  const { data } = await apiClient.get(`/enrollments/${id}/`)
  return data
}

export async function createEnrollment(payload) {
  const { data } = await apiClient.post('/enrollments/', payload)
  return data
}

export async function updateEnrollment(id, payload) {
  const { data } = await apiClient.patch(`/enrollments/${id}/`, payload)
  return data
}

export async function deleteEnrollment(id) {
  await apiClient.delete(`/enrollments/${id}/`)
}
