import { apiClient } from './axios'

export async function listTerms(params = {}) {
  const { data } = await apiClient.get('/academic-terms/', { params })
  return data
}

export async function getTerm(id) {
  const { data } = await apiClient.get(`/academic-terms/${id}/`)
  return data
}

export async function createTerm(payload) {
  const { data } = await apiClient.post('/academic-terms/', payload)
  return data
}

export async function updateTerm(id, payload) {
  const { data } = await apiClient.patch(`/academic-terms/${id}/`, payload)
  return data
}

export async function deleteTerm(id) {
  await apiClient.delete(`/academic-terms/${id}/`)
}
