import { apiClient } from './axios'

export async function listCourses(params = {}) {
  const { data } = await apiClient.get('/courses/', { params })
  return data
}

export async function getCourse(id) {
  const { data } = await apiClient.get(`/courses/${id}/`)
  return data
}

export async function createCourse(payload) {
  const { data } = await apiClient.post('/courses/', payload)
  return data
}

export async function updateCourse(id, payload) {
  const { data } = await apiClient.patch(`/courses/${id}/`, payload)
  return data
}

export async function deleteCourse(id) {
  await apiClient.delete(`/courses/${id}/`)
}
