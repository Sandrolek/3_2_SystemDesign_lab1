import React, { useEffect, useState } from 'react'
import { Plus, X, Play, CheckSquare, MapPin, Clock } from 'lucide-react'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { getRoutes, createRoute, startRoute, completeRoute, recommendRoute } from '../api/routes'
import { getWarehouses } from '../api/warehouses'
import { getCouriers } from '../api/couriers'
import { getOrders } from '../api/orders'
import type { Courier, Order, Route, RouteCreate, Warehouse } from '../types'

export const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<RouteCreate>({
    name: '',
    courier_id: undefined,
    vehicle_id: undefined,
    estimated_duration: 60,
    stop_order_ids: [],
  })
  const [aiRecommendation, setAiRecommendation] = useState<number[]>([])
  const [recommendLoading, setRecommendLoading] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<number>(0)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [routesData, whData, couriersData, ordersData] = await Promise.all([
        getRoutes(),
        getWarehouses(),
        getCouriers(),
        getOrders({ status: 'pending' }),
      ])
      setRoutes(routesData)
      setWarehouses(whData)
      setCouriers(couriersData)
      setPendingOrders(ordersData)
      if (whData.length > 0) setSelectedWarehouse(whData[0].id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (routeId: number) => {
    try {
      const updated = await startRoute(routeId)
      setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      if (selectedRoute?.id === routeId) setSelectedRoute(updated)
    } catch (err) {
      console.error(err)
    }
  }

  const handleComplete = async (routeId: number) => {
    try {
      const updated = await completeRoute(routeId)
      setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      if (selectedRoute?.id === routeId) setSelectedRoute(updated)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRecommend = async () => {
    if (!selectedWarehouse) return
    setRecommendLoading(true)
    try {
      const rec = await recommendRoute(selectedWarehouse)
      setAiRecommendation(rec.order_ids)
      setCreateForm((f) => ({
        ...f,
        stop_order_ids: rec.order_ids,
        estimated_duration: rec.estimated_duration_minutes,
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setRecommendLoading(false)
    }
  }

  const handleCreateRoute = async () => {
    if (!createForm.name) return
    try {
      const newRoute = await createRoute(createForm)
      setRoutes((prev) => [newRoute, ...prev])
      setShowCreate(false)
      setCreateForm({ name: '', courier_id: undefined, vehicle_id: undefined, estimated_duration: 60, stop_order_ids: [] })
      setAiRecommendation([])
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

  if (loading) {
    return (
      <Layout title="Маршруты">
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Маршруты">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новый маршрут
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Route List */}
          <div className="lg:col-span-2 space-y-3">
            {routes.map((route) => (
              <div
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`bg-white rounded-xl border p-4 shadow-sm cursor-pointer hover:shadow-md transition-all ${
                  selectedRoute?.id === route.id ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 text-sm">{route.name}</h3>
                      <StatusBadge status={route.status} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {route.stops.length} остановок
                      </span>
                      {route.courier && (
                        <span>{route.courier.name}</span>
                      )}
                      {route.vehicle && (
                        <span>{route.vehicle.license_plate} ({route.vehicle.type})</span>
                      )}
                      {route.estimated_duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          ~{route.estimated_duration} мин
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Создан: {formatDate(route.created_at)}
                      {route.started_at && ` · Начат: ${formatDate(route.started_at)}`}
                      {route.completed_at && ` · Завершён: ${formatDate(route.completed_at)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {route.status === 'draft' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStart(route.id) }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Старт
                      </button>
                    )}
                    {route.status === 'active' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleComplete(route.id) }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors"
                      >
                        <CheckSquare className="w-3 h-3" />
                        Завершить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {routes.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                <p className="text-gray-400 text-sm">Маршруты не найдены</p>
              </div>
            )}
          </div>

          {/* Route Detail + Map Placeholder */}
          <div className="space-y-4">
            {selectedRoute ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">{selectedRoute.name}</h3>

                  {/* Map placeholder */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg h-48 flex flex-col items-center justify-center border border-blue-200 mb-3">
                    <MapPin className="w-8 h-8 text-blue-400 mb-2" />
                    <p className="text-sm font-medium text-blue-600">Карта маршрута</p>
                    <p className="text-xs text-blue-400 mt-1">{selectedRoute.stops.length} точек доставки</p>
                    {selectedRoute.estimated_duration && (
                      <p className="text-xs text-blue-400">~{selectedRoute.estimated_duration} мин</p>
                    )}
                  </div>

                  {/* Stops */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Остановки
                    </p>
                    {selectedRoute.stops.map((stop) => (
                      <div key={stop.id} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          stop.status === 'completed' ? 'bg-green-100 text-green-700' :
                          stop.status === 'skipped' ? 'bg-gray-200 text-gray-500' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {stop.sequence}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {stop.order?.customer_name || `Заказ #${stop.order_id}`}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {stop.order?.customer_address || ''}
                          </p>
                          <StatusBadge status={stop.status} size="sm" />
                        </div>
                      </div>
                    ))}
                    {selectedRoute.stops.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">Нет остановок</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Выберите маршрут для просмотра деталей</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Route Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Создать маршрут</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название маршрута *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Маршрут Центральный 4"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Курьер</label>
                  <select
                    value={createForm.courier_id || ''}
                    onChange={(e) => setCreateForm((f) => ({ ...f, courier_id: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— не выбран —</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
                  <input
                    type="number"
                    value={createForm.estimated_duration || ''}
                    onChange={(e) => setCreateForm((f) => ({ ...f, estimated_duration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-indigo-700">AI Рекомендация маршрута</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
                    className="flex-1 px-2 py-1.5 border border-indigo-200 rounded-lg text-xs focus:outline-none bg-white"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleRecommend}
                    disabled={recommendLoading}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {recommendLoading ? '...' : 'Получить'}
                  </button>
                </div>
                {aiRecommendation.length > 0 && (
                  <p className="mt-2 text-xs text-indigo-600">
                    Рекомендовано {aiRecommendation.length} заказов добавлено в маршрут
                  </p>
                )}
              </div>

              {/* Order selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заказы ({createForm.stop_order_ids.length} выбрано)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-200 rounded-lg p-2">
                  {pendingOrders.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">Нет ожидающих заказов</p>
                  ) : (
                    pendingOrders.map((order) => (
                      <label key={order.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createForm.stop_order_ids.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm((f) => ({ ...f, stop_order_ids: [...f.stop_order_ids, order.id] }))
                            } else {
                              setCreateForm((f) => ({ ...f, stop_order_ids: f.stop_order_ids.filter((id) => id !== order.id) }))
                            }
                          }}
                        />
                        <span className="text-xs text-gray-700">
                          {order.order_number} — {order.customer_name}
                        </span>
                        {aiRecommendation.includes(order.id) && (
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">AI</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateRoute}
                disabled={!createForm.name}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                Создать маршрут
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
