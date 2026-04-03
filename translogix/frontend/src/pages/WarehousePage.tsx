import React, { useEffect, useState } from 'react'
import { AlertTriangle, Package, Warehouse as WarehouseIcon } from 'lucide-react'
import { Layout } from '../components/Layout'
import { getWarehouses } from '../api/warehouses'
import { getInventory } from '../api/inventory'
import type { InventoryItem, Warehouse } from '../types'

export const WarehousePage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const whs = await getWarehouses()
        setWarehouses(whs)
        if (whs.length > 0) {
          setSelectedWarehouse(whs[0].id)
          const inv = await getInventory({ warehouse_id: whs[0].id })
          setInventory(inv)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSelectWarehouse = async (whId: number) => {
    setSelectedWarehouse(whId)
    try {
      const inv = await getInventory({ warehouse_id: whId })
      setInventory(inv)
    } catch (err) {
      console.error(err)
    }
  }

  const lowStockItems = inventory.filter((i) => i.quantity <= i.min_stock_level)
  const warningItems = inventory.filter(
    (i) => i.quantity > i.min_stock_level && i.quantity <= i.min_stock_level * 1.2
  )

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.min_stock_level) return 'critical'
    if (item.quantity <= item.min_stock_level * 1.2) return 'warning'
    return 'ok'
  }

  const getStockBar = (item: InventoryItem) => {
    const pct = Math.min(100, (item.quantity / (item.min_stock_level * 2)) * 100)
    const status = getStockStatus(item)
    const color = status === 'critical' ? 'bg-red-400' : status === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
    return { pct, color }
  }

  const currentWarehouse = warehouses.find((w) => w.id === selectedWarehouse)

  if (loading) {
    return (
      <Layout title="Управление складом">
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Управление складом">
      <div className="space-y-5">
        {/* Warehouse selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <button
              key={wh.id}
              onClick={() => handleSelectWarehouse(wh.id)}
              className={`p-4 rounded-xl border text-left transition-all shadow-sm hover:shadow-md ${
                selectedWarehouse === wh.id
                  ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${selectedWarehouse === wh.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <WarehouseIcon className={`w-5 h-5 ${selectedWarehouse === wh.id ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800">{wh.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{wh.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Вместимость: {wh.capacity.toLocaleString()}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Alerts */}
        {(lowStockItems.length > 0 || warningItems.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lowStockItems.length > 0 && (
              <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Критически низкий запас: {lowStockItems.length} позиц.
                  </p>
                  <p className="text-xs text-red-500 mt-0.5">
                    {lowStockItems.slice(0, 2).map((i) => i.name).join(', ')}
                    {lowStockItems.length > 2 && ` и ещё ${lowStockItems.length - 2}`}
                  </p>
                </div>
              </div>
            )}
            {warningItems.length > 0 && (
              <div className="flex items-center gap-3 p-3.5 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-700">
                    Предупреждение о запасе: {warningItems.length} позиц.
                  </p>
                  <p className="text-xs text-yellow-600 mt-0.5">Запас ниже рекомендованного уровня (20% буфер)</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                {currentWarehouse?.name || 'Склад'} — Инвентарь
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{inventory.length} позиций</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                Критично ({lowStockItems.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                Предупреждение ({warningItems.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                Норма ({inventory.length - lowStockItems.length - warningItems.length})
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['SKU', 'Наименование', 'Категория', 'Остаток', 'Мин. уровень', 'Статус', 'Наличие'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inventory.map((item) => {
                  const status = getStockStatus(item)
                  const { pct, color } = getStockBar(item)
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${status === 'critical' ? 'bg-red-50/30' : status === 'warning' ? 'bg-yellow-50/30' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">{item.sku}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${
                          status === 'critical' ? 'text-red-600' :
                          status === 'warning' ? 'text-yellow-600' :
                          'text-gray-800'
                        }`}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.min_stock_level} {item.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          status === 'critical'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : status === 'warning'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}>
                          {status === 'critical' ? 'Критично' : status === 'warning' ? 'Внимание' : 'Норма'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {inventory.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">Нет данных инвентаря</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
