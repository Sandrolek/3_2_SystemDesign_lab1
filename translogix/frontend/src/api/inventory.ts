import apiClient from './client'
import type { InventoryItem } from '../types'

export const getInventory = async (params?: {
  warehouse_id?: number
  low_stock?: boolean
}): Promise<InventoryItem[]> => {
  const { data } = await apiClient.get<InventoryItem[]>('/api/inventory', { params })
  return data
}

export const createInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  const { data } = await apiClient.post<InventoryItem>('/api/inventory', item)
  return data
}

export const updateInventoryItem = async (
  id: number,
  updates: Partial<InventoryItem>
): Promise<InventoryItem> => {
  const { data } = await apiClient.put<InventoryItem>(`/api/inventory/${id}`, updates)
  return data
}
