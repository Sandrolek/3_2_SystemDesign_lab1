import apiClient from './client'
import type { Delivery, DeliveryStatus } from '../types'

export const getDeliveries = async (params?: {
  courier_id?: number
  status?: string
}): Promise<Delivery[]> => {
  const { data } = await apiClient.get<Delivery[]>('/api/deliveries', { params })
  return data
}

export const updateDeliveryStatus = async (
  id: number,
  status: DeliveryStatus,
  notes?: string
): Promise<Delivery> => {
  const { data } = await apiClient.put<Delivery>(`/api/deliveries/${id}/status`, { status, notes })
  return data
}
