import apiClient from './client'
import type { RecommendedRoute, Route, RouteCreate } from '../types'

export const getRoutes = async (): Promise<Route[]> => {
  const { data } = await apiClient.get<Route[]>('/api/routes')
  return data
}

export const getRoute = async (id: number): Promise<Route> => {
  const { data } = await apiClient.get<Route>(`/api/routes/${id}`)
  return data
}

export const createRoute = async (route: RouteCreate): Promise<Route> => {
  const { data } = await apiClient.post<Route>('/api/routes', route)
  return data
}

export const updateRoute = async (id: number, updates: Partial<Route>): Promise<Route> => {
  const { data } = await apiClient.put<Route>(`/api/routes/${id}`, updates)
  return data
}

export const startRoute = async (id: number): Promise<Route> => {
  const { data } = await apiClient.post<Route>(`/api/routes/${id}/start`)
  return data
}

export const completeRoute = async (id: number): Promise<Route> => {
  const { data } = await apiClient.post<Route>(`/api/routes/${id}/complete`)
  return data
}

export const recommendRoute = async (warehouse_id: number): Promise<RecommendedRoute> => {
  const { data } = await apiClient.get<RecommendedRoute>('/api/routes/recommend', {
    params: { warehouse_id }
  })
  return data
}
