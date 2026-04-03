import apiClient from './client'
import type { Order, OrderCreate } from '../types'

export const getOrders = async (params?: { status?: string; warehouse_id?: number }): Promise<Order[]> => {
  const { data } = await apiClient.get<Order[]>('/api/orders', { params })
  return data
}

export const getOrder = async (id: number): Promise<Order> => {
  const { data } = await apiClient.get<Order>(`/api/orders/${id}`)
  return data
}

export const createOrder = async (order: OrderCreate): Promise<Order> => {
  const { data } = await apiClient.post<Order>('/api/orders', order)
  return data
}

export const updateOrder = async (id: number, updates: Partial<Order>): Promise<Order> => {
  const { data } = await apiClient.put<Order>(`/api/orders/${id}`, updates)
  return data
}

export const assignOrder = async (id: number, route_id: number): Promise<Order> => {
  const { data } = await apiClient.post<Order>(`/api/orders/${id}/assign`, { route_id })
  return data
}
