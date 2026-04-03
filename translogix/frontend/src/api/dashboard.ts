import apiClient from './client'
import type { ChartDataPoint, DashboardKPI, Order } from '../types'

export const getDashboardKPI = async (): Promise<DashboardKPI> => {
  const { data } = await apiClient.get<DashboardKPI>('/api/dashboard/kpi')
  return data
}

export const getRecentOrders = async (): Promise<Order[]> => {
  const { data } = await apiClient.get<Order[]>('/api/dashboard/recent-orders')
  return data
}

export const getChartData = async (): Promise<ChartDataPoint[]> => {
  const { data } = await apiClient.get<ChartDataPoint[]>('/api/dashboard/chart-data')
  return data
}
