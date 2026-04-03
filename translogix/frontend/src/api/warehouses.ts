import apiClient from './client'
import type { Warehouse } from '../types'

export const getWarehouses = async (): Promise<Warehouse[]> => {
  const { data } = await apiClient.get<Warehouse[]>('/api/warehouses')
  return data
}

export const getWarehouse = async (id: number): Promise<Warehouse> => {
  const { data } = await apiClient.get<Warehouse>(`/api/warehouses/${id}`)
  return data
}

export const createWarehouse = async (wh: Omit<Warehouse, 'id'>): Promise<Warehouse> => {
  const { data } = await apiClient.post<Warehouse>('/api/warehouses', wh)
  return data
}
