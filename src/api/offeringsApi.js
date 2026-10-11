import { apiClient } from './axios'

export async function listOfferings(params = {}) {
  const { data } = await apiClient.get('/course-offerings/', { params })
  return data
}

export async function getOffering(id) {
  const { data } = await apiClient.get(`/course-offerings/${id}/`)
  return data
}

export async function createOffering(payload) {
  const { data } = await apiClient.post('/course-offerings/', payload)
  return data
}

export async function updateOffering(id, payload) {
  const { data } = await apiClient.patch(`/course-offerings/${id}/`, payload)
  return data
}

export async function deleteOffering(id) {
  await apiClient.delete(`/course-offerings/${id}/`)
}

export async function getOfferingStudents(id, params = {}) {
  const { data } = await apiClient.get(`/course-offerings/${id}/students/`, { params })
  return data
}
