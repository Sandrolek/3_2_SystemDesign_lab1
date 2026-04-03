export type UserRole = 'admin' | 'dispatcher' | 'warehouse_manager' | 'courier'

export type OrderStatus =
  | 'pending'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled'

export type RouteStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export type DeliveryStatus = 'assigned' | 'in_transit' | 'delivered' | 'failed'

export type VehicleStatus = 'available' | 'in_use' | 'maintenance'

export type CourierStatus = 'available' | 'on_route' | 'off_duty'

export type RouteStopStatus = 'pending' | 'completed' | 'skipped'

export interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Warehouse {
  id: number
  name: string
  address: string
  lat: number
  lon: number
  capacity: number
}

export interface InventoryItem {
  id: number
  warehouse_id: number
  sku: string
  name: string
  quantity: number
  unit: string
  min_stock_level: number
  category: string | null
}

export interface Vehicle {
  id: number
  license_plate: string
  type: string
  capacity: number
  status: VehicleStatus
}

export interface Courier {
  id: number
  user_id: number | null
  vehicle_id: number | null
  name: string
  phone: string
  status: CourierStatus
  vehicle: Vehicle | null
}

export interface OrderItem {
  id: number
  order_id?: number
  inventory_item_id: number
  quantity: number
  inventory_item: InventoryItem | null
}

export interface Order {
  id: number
  order_number: string
  status: OrderStatus
  priority: number
  customer_name: string
  customer_address: string
  customer_lat: number | null
  customer_lon: number | null
  warehouse_id: number
  created_at: string
  scheduled_delivery: string | null
  notes: string | null
  items: OrderItem[]
  warehouse: Warehouse | null
}

export interface RouteStop {
  id: number
  route_id: number
  order_id: number
  sequence: number
  status: RouteStopStatus
  arrival_time: string | null
  departure_time: string | null
  order: Order | null
}

export interface Route {
  id: number
  name: string
  status: RouteStatus
  courier_id: number | null
  vehicle_id: number | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  estimated_duration: number | null
  stops: RouteStop[]
  courier: Courier | null
  vehicle: Vehicle | null
}

export interface Delivery {
  id: number
  order_id: number
  route_id: number | null
  courier_id: number | null
  status: DeliveryStatus
  eta: string | null
  actual_delivery_time: string | null
  notes: string | null
  created_at: string
  order: Order | null
  courier: Courier | null
}

export interface Notification {
  id: number
  user_id: number | null
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface DashboardKPI {
  orders_total: number
  orders_delivered_today: number
  avg_eta_minutes: number
  low_stock_count: number
  on_time_rate: number
  orders_in_transit: number
  orders_pending: number
  orders_failed_today: number
}

export interface ChartDataPoint {
  date: string
  orders: number
  delivered: number
  failed: number
}

export interface RecommendedRoute {
  warehouse_id: number
  order_ids: number[]
  estimated_duration_minutes: number
  total_distance_km: number
  priority_score: number
}

export interface OrderCreate {
  customer_name: string
  customer_address: string
  customer_lat?: number
  customer_lon?: number
  warehouse_id: number
  priority: number
  scheduled_delivery?: string
  notes?: string
  items: { inventory_item_id: number; quantity: number }[]
}

export interface RouteCreate {
  name: string
  courier_id?: number
  vehicle_id?: number
  estimated_duration?: number
  stop_order_ids: number[]
}
