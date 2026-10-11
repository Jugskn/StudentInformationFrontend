import { apiClient } from './axios'

export async function listStudents(params = {}) {
  const { data } = await apiClient.get('/students/', { params })
  return data
}

export async function getStudent(id) {
  const { data } = await apiClient.get(`/students/${id}/`)
  return data
}

export async function createStudent(payload) {
  const { data } = await apiClient.post('/students/', payload)
  return data
}

export async function updateStudent(id, payload) {
  const { data } = await apiClient.patch(`/students/${id}/`, payload)
  return data
}

export async function deleteStudent(id) {
  await apiClient.delete(`/students/${id}/`)
}

export async function getStudentAcademicRecord(id) {
  const { data } = await apiClient.get(`/students/${id}/academic-record/`)
  return data
}

export async function getStudentEnrollments(id, params = {}) {
  const { data } = await apiClient.get(`/students/${id}/enrollments/`, { params })
  return data
}

export async function getStudentGrades(id, params = {}) {
  const { data } = await apiClient.get(`/students/${id}/grades/`, { params })
  return data
}
