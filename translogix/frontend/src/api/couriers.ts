import apiClient from './client'
import type { Courier } from '../types'

export const getCouriers = async (): Promise<Courier[]> => {
  const { data } = await apiClient.get<Courier[]>('/api/couriers')
  return data
}

export const getAvailableCouriers = async (): Promise<Courier[]> => {
  const { data } = await apiClient.get<Courier[]>('/api/couriers/available')
  return data
}
