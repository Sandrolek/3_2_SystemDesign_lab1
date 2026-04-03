import React, { useEffect, useState } from 'react'
import { Plus, X, Search, Filter } from 'lucide-react'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { getOrders, createOrder, assignOrder } from '../api/orders'
import { getWarehouses } from '../api/warehouses'
import { getRoutes } from '../api/routes'
import { getInventory } from '../api/inventory'
import type { InventoryItem, Order, OrderCreate, Route, Warehouse } from '../types'

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Create order modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<OrderCreate>({
    customer_name: '',
    customer_address: '',
    warehouse_id: 0,
    priority: 3,
    items: [],
  })
  const [createLoading, setCreateLoading] = useState(false)

  // Assign modal
  const [assignOrder_, setAssignOrder] = useState<Order | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<number>(0)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [ordersData, whData, routesData] = await Promise.all([
        getOrders(),
        getWarehouses(),
        getRoutes(),
      ])
      setOrders(ordersData)
      setWarehouses(whData)
      setRoutes(routesData)
      if (whData.length > 0) {
        const inv = await getInventory({ warehouse_id: whData[0].id })
        setInventory(inv)
        setCreateForm((f) => ({ ...f, warehouse_id: whData[0].id }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleWarehouseChange = async (warehouseId: number) => {
    setCreateForm((f) => ({ ...f, warehouse_id: warehouseId, items: [] }))
    const inv = await getInventory({ warehouse_id: warehouseId })
    setInventory(inv)
  }

  const handleCreateOrder = async () => {
    if (!createForm.customer_name || !createForm.warehouse_id) return
    setCreateLoading(true)
    try {
      const newOrder = await createOrder(createForm)
      setOrders((prev) => [newOrder, ...prev])
      setShowCreate(false)
      setCreateForm({
        customer_name: '',
        customer_address: '',
        warehouse_id: warehouses[0]?.id || 0,
        priority: 3,
        items: [],
      })
    } catch (err) {
      console.error(err)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!assignOrder_ || !selectedRouteId) return
    try {
      const updated = await assignOrder(assignOrder_.id, selectedRouteId)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      setAssignOrder(null)
    } catch (err) {
      console.error(err)
    }
  }

  const filteredOrders = orders.filter((o) => {
    const matchStatus = !statusFilter || o.status === statusFilter
    const matchSearch =
      !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const priorityColors: Record<number, string> = {
    1: 'text-gray-500',
    2: 'text-blue-500',
    3: 'text-yellow-600',
    4: 'text-orange-500',
    5: 'text-red-600',
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <Layout title="Заказы">
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по номеру или клиенту..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">Все статусы</option>
                <option value="pending">Ожидает</option>
                <option value="assigned">Назначен</option>
                <option value="in_transit">В пути</option>
                <option value="delivered">Доставлен</option>
                <option value="failed">Не удался</option>
                <option value="cancelled">Отменён</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новый заказ
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Заказов: {filteredOrders.length}
            </span>
          </div>
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Загрузка...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Номер', 'Клиент', 'Адрес', 'Статус', 'Приоритет', 'Склад', 'Создан', 'Действия'].map(
                      (h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-700">{order.order_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{order.customer_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 max-w-[180px] block truncate">{order.customer_address}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${priorityColors[order.priority] || 'text-gray-600'}`}>
                          P{order.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {order.warehouse?.name || `#${order.warehouse_id}`}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {(order.status === 'pending' || order.status === 'assigned') && (
                          <button
                            onClick={() => {
                              setAssignOrder(order)
                              setSelectedRouteId(routes[0]?.id || 0)
                            }}
                            className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap"
                          >
                            Назначить
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">Заказов не найдено</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Создать заказ</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя клиента *</label>
                <input
                  type="text"
                  value={createForm.customer_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, customer_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Адрес доставки *</label>
                <input
                  type="text"
                  value={createForm.customer_address}
                  onChange={(e) => setCreateForm((f) => ({ ...f, customer_address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="г. Москва, ул. Ленина, д. 1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Склад *</label>
                  <select
                    value={createForm.warehouse_id}
                    onChange={(e) => handleWarehouseChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map((p) => (
                      <option key={p} value={p}>P{p} — {['', 'Низкий', 'Ниже ср.', 'Средний', 'Выше ср.', 'Высокий'][p]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Запланированная дата</label>
                <input
                  type="datetime-local"
                  onChange={(e) => setCreateForm((f) => ({ ...f, scheduled_delivery: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Позиции заказа</label>
                <div className="space-y-2">
                  {inventory.slice(0, 6).map((item) => {
                    const existing = createForm.items.find((i) => i.inventory_item_id === item.id)
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
                        <input
                          type="checkbox"
                          checked={!!existing}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm((f) => ({
                                ...f,
                                items: [...f.items, { inventory_item_id: item.id, quantity: 1 }],
                              }))
                            } else {
                              setCreateForm((f) => ({
                                ...f,
                                items: f.items.filter((i) => i.inventory_item_id !== item.id),
                              }))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                        {existing && (
                          <input
                            type="number"
                            min={1}
                            value={existing.quantity}
                            onChange={(e) =>
                              setCreateForm((f) => ({
                                ...f,
                                items: f.items.map((i) =>
                                  i.inventory_item_id === item.id
                                    ? { ...i, quantity: Number(e.target.value) }
                                    : i
                                ),
                              }))
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                          />
                        )}
                        <span className="text-xs text-gray-400">{item.unit}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
                <textarea
                  value={createForm.notes || ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value || undefined }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={createLoading || !createForm.customer_name || !createForm.warehouse_id}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {createLoading ? 'Создание...' : 'Создать заказ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignOrder_ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Назначить на маршрут</h2>
              <button onClick={() => setAssignOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                Заказ: <span className="font-semibold">{assignOrder_.order_number}</span> — {assignOrder_.customer_name}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Выберите маршрут</label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>— выберите маршрут —</option>
                  {routes
                    .filter((r) => r.status === 'draft' || r.status === 'active')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.status === 'active' ? 'Активный' : 'Черновик'})
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setAssignOrder(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedRouteId}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Назначить
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
