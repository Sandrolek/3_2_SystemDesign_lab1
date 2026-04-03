import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { ShoppingCart, CheckCircle, Clock, AlertTriangle, TrendingUp, Truck } from 'lucide-react'
import { Layout } from '../components/Layout'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { getDashboardKPI, getRecentOrders, getChartData } from '../api/dashboard'
import type { ChartDataPoint, DashboardKPI, Order } from '../types'

export const DashboardPage: React.FC = () => {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kpiData, ordersData, chart] = await Promise.all([
          getDashboardKPI(),
          getRecentOrders(),
          getChartData(),
        ])
        setKpi(kpiData)
        setRecentOrders(ordersData)
        setChartData(chart)
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const priorityLabel = (p: number) => {
    const labels = ['', 'Низкий', 'Ниже среднего', 'Средний', 'Выше среднего', 'Высокий']
    const colors = ['', 'text-gray-500', 'text-blue-500', 'text-yellow-600', 'text-orange-500', 'text-red-600']
    return <span className={`text-xs font-medium ${colors[p] || 'text-gray-500'}`}>{labels[p] || p}</span>
  }

  if (loading) {
    return (
      <Layout title="Главная панель">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Загрузка данных...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Главная панель">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Всего заказов"
            value={kpi?.orders_total ?? 0}
            subtitle={`${kpi?.orders_pending ?? 0} ожидают, ${kpi?.orders_in_transit ?? 0} в пути`}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Доставлено сегодня"
            value={kpi?.orders_delivered_today ?? 0}
            subtitle={`Не удалось: ${kpi?.orders_failed_today ?? 0}`}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Среднее время доставки"
            value={`${kpi?.avg_eta_minutes.toFixed(0) ?? 0} мин`}
            subtitle={`Вовремя: ${kpi?.on_time_rate.toFixed(1) ?? 0}%`}
            icon={Clock}
            color="indigo"
          />
          <StatCard
            title="Предупреждения о запасах"
            value={kpi?.low_stock_count ?? 0}
            subtitle="Позиций ниже минимума"
            icon={AlertTriangle}
            color="yellow"
          />
        </div>

        {/* Chart + table row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Активность за 7 дней</h2>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      orders: 'Заказы',
                      delivered: 'Доставлено',
                      failed: 'Не удалось',
                    }
                    return labels[value] || value
                  }}
                />
                <Bar dataKey="orders" fill="#3b82f6" name="orders" radius={[3, 3, 0, 0]} />
                <Bar dataKey="delivered" fill="#22c55e" name="delivered" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" fill="#ef4444" name="failed" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Статус заказов</h2>
            <div className="space-y-3">
              {[
                { label: 'В ожидании', value: kpi?.orders_pending ?? 0, color: 'bg-yellow-400' },
                { label: 'В пути', value: kpi?.orders_in_transit ?? 0, color: 'bg-indigo-400' },
                { label: 'Доставлено сегодня', value: kpi?.orders_delivered_today ?? 0, color: 'bg-green-400' },
                { label: 'Не удалось сегодня', value: kpi?.orders_failed_today ?? 0, color: 'bg-red-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                  <span className="text-sm font-bold text-gray-800">{item.value}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600 flex-1">Вовремя</span>
                  <span className="text-sm font-bold text-green-600">{kpi?.on_time_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent orders table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Последние заказы</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Номер
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Клиент
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Статус
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Приоритет
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Создан
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Склад
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-medium text-gray-700">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 truncate max-w-[160px]">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">
                        {order.customer_address}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3">
                      {priorityLabel(order.priority)}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      {order.warehouse?.name || `Склад #${order.warehouse_id}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-400">Нет заказов</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
