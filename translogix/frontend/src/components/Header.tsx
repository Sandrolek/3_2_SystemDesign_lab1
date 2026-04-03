import React, { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import apiClient from '../api/client'
import type { Notification } from '../types'
import { useAuthStore } from '../store/authStore'

interface HeaderProps {
  title: string
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await apiClient.get<Notification[]>('/api/notifications', {
          params: { user_id: user?.id }
        })
        setNotifications(data.slice(0, 10))
      } catch {
        // ignore
      }
    }
    fetchNotifs()
  }, [user])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markRead = async (id: number) => {
    try {
      await apiClient.put(`/api/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch {
      // ignore
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-4 relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute top-10 right-0 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                Уведомления {unreadCount > 0 && `(${unreadCount} новых)`}
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">Нет уведомлений</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !n.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-gray-800">{n.title}</p>
                      {!n.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.full_name?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">
            {user?.full_name || user?.username}
          </span>
        </div>
      </div>
    </header>
  )
}
