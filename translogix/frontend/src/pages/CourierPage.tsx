import React, { useEffect, useState } from 'react'
import { MapPin, Navigation, CheckCircle, XCircle, Clock, Package } from 'lucide-react'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { getDeliveries, updateDeliveryStatus } from '../api/deliveries'
import { getRoutes } from '../api/routes'
import { useAuthStore } from '../store/authStore'
import apiClient from '../api/client'
import type { Courier, Delivery, DeliveryStatus, Route } from '../types'

export const CourierPage: React.FC = () => {
  const { user } = useAuthStore()
  const [courier, setCourier] = useState<Courier | null>(null)
  const [activeRoute, setActiveRoute] = useState<Route | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    try {
      // Get courier profile via users endpoint
      const { data: couriersData } = await apiClient.get<Courier[]>('/api/couriers')
      const myCourier = couriersData.find((c) => c.user_id === user.id)
      setCourier(myCourier || null)

      if (myCourier) {
        // Get deliveries for this courier
        const myDeliveries = await getDeliveries({ courier_id: myCourier.id })
        setDeliveries(myDeliveries)

        // Find active route
        const routes = await getRoutes()
        const myRoute = routes.find(
          (r) => r.courier_id === myCourier.id && r.status === 'active'
        )
        setActiveRoute(myRoute || null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDelivery = async (deliveryId: number, status: DeliveryStatus) => {
    try {
      const updated = await updateDeliveryStatus(deliveryId, status)
      setDeliveries((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

  const pendingDeliveries = deliveries.filter((d) => d.status === 'assigned' || d.status === 'in_transit')
  const completedDeliveries = deliveries.filter((d) => d.status === 'delivered' || d.status === 'failed')

  if (loading) {
    return (
      <Layout title="Мой маршрут">
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Мой маршрут">
      <div className="space-y-5 max-w-2xl">
        {/* Courier Profile */}
        {courier ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  {courier.name[0]}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">{courier.name}</h2>
                <p className="text-sm text-gray-500">{courier.phone}</p>
                <div className="mt-1">
                  <StatusBadge status={courier.status} />
                </div>
              </div>
              {courier.vehicle && (
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium text-gray-700">{courier.vehicle.license_plate}</p>
                  <p className="text-xs text-gray-400">{courier.vehicle.type}</p>
                  <StatusBadge status={courier.vehicle.status} size="sm" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
            Профиль курьера не найден для текущего пользователя.
          </div>
        )}

        {/* Active Route */}
        {activeRoute ? (
          <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Активный маршрут: {activeRoute.name}</h3>
              <StatusBadge status={activeRoute.status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {activeRoute.stops.length} остановок
              </span>
              {activeRoute.estimated_duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{activeRoute.estimated_duration} мин
                </span>
              )}
              {activeRoute.started_at && (
                <span>Начат: {formatDate(activeRoute.started_at)}</span>
              )}
            </div>

            {/* Route stops */}
            <div className="space-y-3">
              {activeRoute.stops.map((stop) => (
                <div
                  key={stop.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    stop.status === 'completed' ? 'bg-green-50 border-green-200' :
                    stop.status === 'skipped' ? 'bg-gray-50 border-gray-200' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    stop.status === 'completed' ? 'bg-green-500 text-white' :
                    stop.status === 'skipped' ? 'bg-gray-300 text-gray-600' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {stop.sequence}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{stop.order?.customer_name}</p>
                    <p className="text-xs text-gray-500 truncate">{stop.order?.customer_address}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={stop.status} size="sm" />
                      {stop.order?.order_number && (
                        <span className="text-xs font-mono text-gray-400">{stop.order.order_number}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <Navigation className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Нет активного маршрута</p>
          </div>
        )}

        {/* Active Deliveries */}
        {pendingDeliveries.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">
                Текущие доставки ({pendingDeliveries.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-sm">
                          {delivery.order?.customer_name || `Заказ #${delivery.order_id}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{delivery.order?.customer_address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={delivery.status} size="sm" />
                          {delivery.eta && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ETA: {formatDate(delivery.eta)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {delivery.status === 'assigned' && (
                        <button
                          onClick={() => handleUpdateDelivery(delivery.id, 'in_transit')}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
                        >
                          <Navigation className="w-3 h-3" />
                          В путь
                        </button>
                      )}
                      {delivery.status === 'in_transit' && (
                        <>
                          <button
                            onClick={() => handleUpdateDelivery(delivery.id, 'delivered')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors whitespace-nowrap"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Доставлен
                          </button>
                          <button
                            onClick={() => handleUpdateDelivery(delivery.id, 'failed')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
                          >
                            <XCircle className="w-3 h-3" />
                            Не удалось
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Deliveries */}
        {completedDeliveries.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">
                История доставок ({completedDeliveries.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {completedDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${delivery.status === 'delivered' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {delivery.status === 'delivered' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700 text-sm">{delivery.order?.customer_name}</p>
                    <p className="text-xs text-gray-400 truncate">{delivery.order?.customer_address}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={delivery.status} size="sm" />
                    {delivery.actual_delivery_time && (
                      <p className="text-xs text-gray-400 mt-1">{formatDate(delivery.actual_delivery_time)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!courier && (
          <div className="text-center py-8 text-sm text-gray-400">
            Войдите как courier1 / pass123 для просмотра маршрута курьера
          </div>
        )}
      </div>
    </Layout>
  )
}
