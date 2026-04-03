import React from 'react'
import type { CourierStatus, DeliveryStatus, OrderStatus, RouteStatus, VehicleStatus } from '../types'

type StatusType = OrderStatus | RouteStatus | DeliveryStatus | VehicleStatus | CourierStatus | string

const statusConfig: Record<string, { label: string; className: string }> = {
  // Order statuses
  pending: { label: 'Ожидает', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  assigned: { label: 'Назначен', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
  in_transit: { label: 'В пути', className: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
  delivered: { label: 'Доставлен', className: 'bg-green-100 text-green-800 border border-green-200' },
  failed: { label: 'Не удался', className: 'bg-red-100 text-red-800 border border-red-200' },
  cancelled: { label: 'Отменён', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  // Route statuses
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-700 border border-gray-200' },
  active: { label: 'Активный', className: 'bg-green-100 text-green-800 border border-green-200' },
  completed: { label: 'Завершён', className: 'bg-purple-100 text-purple-800 border border-purple-200' },
  // Vehicle statuses
  available: { label: 'Доступен', className: 'bg-green-100 text-green-800 border border-green-200' },
  in_use: { label: 'В работе', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
  maintenance: { label: 'Обслуживание', className: 'bg-orange-100 text-orange-800 border border-orange-200' },
  // Courier statuses
  on_route: { label: 'В маршруте', className: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
  off_duty: { label: 'Не в смене', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  // RouteStop statuses
  skipped: { label: 'Пропущен', className: 'bg-orange-100 text-orange-800 border border-orange-200' },
}

interface StatusBadgeProps {
  status: StatusType
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600 border border-gray-200'
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  )
}
