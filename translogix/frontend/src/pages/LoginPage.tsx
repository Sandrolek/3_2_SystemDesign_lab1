import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || 'Неверный логин или пароль'
      )
    } finally {
      setLoading(false)
    }
  }

  const demoCredentials = [
    { role: 'Администратор', username: 'admin', password: 'admin123' },
    { role: 'Диспетчер', username: 'dispatcher1', password: 'pass123' },
    { role: 'Менеджер склада', username: 'manager1', password: 'pass123' },
    { role: 'Курьер', username: 'courier1', password: 'pass123' },
  ]

  const fillCredentials = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">TransLogix</h1>
          <p className="text-gray-400 mt-1">Интеллектуальная логистическая система</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Вход в систему</h2>
            <p className="text-sm text-gray-500 mt-0.5">Введите ваши учётные данные</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя пользователя
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите логин"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
              Демо-доступы (нажмите для заполнения)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.username}
                  type="button"
                  onClick={() => fillCredentials(cred.username, cred.password)}
                  className="text-left p-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-700">{cred.role}</p>
                  <p className="text-xs text-gray-400">{cred.username} / {cred.password}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
