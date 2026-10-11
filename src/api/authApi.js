import { apiClient } from './axios'

export async function login(username, password) {
  const { data } = await apiClient.post('/auth/login/', { username, password })
  return data
}

export async function logout(refresh) {
  await apiClient.post('/auth/logout/', { refresh })
}

export async function getMe() {
  const { data } = await apiClient.get('/auth/me/')
  return data
}

export async function refreshToken(refresh) {
  const { data } = await apiClient.post('/token/refresh/', { refresh })
  return data
}

export async function changePassword({
  current_password,
  new_password,
  confirm_new_password,
}) {
  const { data } = await apiClient.post('/auth/change-password/', {
    current_password,
    new_password,
    confirm_new_password,
  })
  return data
}
