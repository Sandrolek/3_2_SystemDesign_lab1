import apiClient from './client'
import type { LoginResponse, User } from '../types'

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', { username, password })
  return data
}

export const getMe = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/api/auth/me')
  return data
}
