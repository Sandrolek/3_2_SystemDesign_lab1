import { create } from 'zustand'
import { login as apiLogin } from '../api/auth'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  initFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    const response = await apiLogin(username, password)
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('user', JSON.stringify(response.user))
    set({
      user: response.user,
      token: response.access_token,
      isAuthenticated: true,
    })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  initFromStorage: () => {
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ user, token, isAuthenticated: true })
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
      }
    }
  },
}))
