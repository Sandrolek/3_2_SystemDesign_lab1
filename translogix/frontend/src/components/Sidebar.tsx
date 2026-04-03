import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Route,
  Warehouse,
  Truck,
  LogOut,
  Package,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Главная панель',
    icon: LayoutDashboard,
    roles: ['admin', 'dispatcher', 'warehouse_manager', 'courier'],
  },
  {
    path: '/orders',
    label: 'Заказы',
    icon: ShoppingCart,
    roles: ['admin', 'dispatcher'],
  },
  {
    path: '/routes',
    label: 'Маршруты',
    icon: Route,
    roles: ['admin', 'dispatcher'],
  },
  {
    path: '/warehouse',
    label: 'Склад',
    icon: Warehouse,
    roles: ['admin', 'warehouse_manager'],
  },
  {
    path: '/my-route',
    label: 'Мой маршрут',
    icon: Truck,
    roles: ['courier'],
  },
]

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore()

  const allowedItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  const roleLabels: Record<UserRole, string> = {
    admin: 'Администратор',
    dispatcher: 'Диспетчер',
    warehouse_manager: 'Менеджер склада',
    courier: 'Курьер',
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Package className="w-7 h-7 text-blue-400" />
          <span className="text-xl font-bold text-white">TransLogix</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">Логистическая система</p>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            {user?.full_name?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {user?.full_name || user?.username}
            </p>
            <p className="text-xs text-gray-400">{user ? roleLabels[user.role] : ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
