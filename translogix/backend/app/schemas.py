from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models import (
    CourierStatus, DeliveryStatus, OrderStatus, RouteStatus,
    RouteStopStatus, UserRole, VehicleStatus
)


# ===== Token =====
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ===== User =====
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.courier
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ===== Warehouse =====
class WarehouseBase(BaseModel):
    name: str
    address: str
    lat: float
    lon: float
    capacity: int = 1000


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseOut(WarehouseBase):
    id: int

    class Config:
        from_attributes = True


# ===== Inventory =====
class InventoryItemBase(BaseModel):
    warehouse_id: int
    sku: str
    name: str
    quantity: int = 0
    unit: str = "шт"
    min_stock_level: int = 10
    category: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    category: Optional[str] = None
    name: Optional[str] = None


class InventoryItemOut(InventoryItemBase):
    id: int

    class Config:
        from_attributes = True


# ===== Vehicle =====
class VehicleBase(BaseModel):
    license_plate: str
    type: str
    capacity: float
    status: VehicleStatus = VehicleStatus.available


class VehicleCreate(VehicleBase):
    pass


class VehicleOut(VehicleBase):
    id: int

    class Config:
        from_attributes = True


# ===== Courier =====
class CourierBase(BaseModel):
    name: str
    phone: str
    status: CourierStatus = CourierStatus.available
    user_id: Optional[int] = None
    vehicle_id: Optional[int] = None


class CourierCreate(CourierBase):
    pass


class CourierOut(CourierBase):
    id: int
    vehicle: Optional[VehicleOut] = None

    class Config:
        from_attributes = True


# ===== Order =====
class OrderItemBase(BaseModel):
    inventory_item_id: int
    quantity: int = 1


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemOut(OrderItemBase):
    id: int
    inventory_item: Optional[InventoryItemOut] = None

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    customer_name: str
    customer_address: str
    customer_lat: Optional[float] = None
    customer_lon: Optional[float] = None
    warehouse_id: int
    priority: int = 3
    scheduled_delivery: Optional[datetime] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = []


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    priority: Optional[int] = None
    scheduled_delivery: Optional[datetime] = None
    notes: Optional[str] = None


class OrderOut(OrderBase):
    id: int
    order_number: str
    status: OrderStatus
    created_at: datetime
    items: List[OrderItemOut] = []
    warehouse: Optional[WarehouseOut] = None

    class Config:
        from_attributes = True


class OrderAssign(BaseModel):
    route_id: int


# ===== Route =====
class RouteStopBase(BaseModel):
    order_id: int
    sequence: int


class RouteStopCreate(RouteStopBase):
    pass


class RouteStopOut(RouteStopBase):
    id: int
    route_id: int
    status: RouteStopStatus
    arrival_time: Optional[datetime] = None
    departure_time: Optional[datetime] = None
    order: Optional[OrderOut] = None

    class Config:
        from_attributes = True


class RouteBase(BaseModel):
    name: str
    courier_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    estimated_duration: Optional[int] = None


class RouteCreate(RouteBase):
    stop_order_ids: List[int] = []


class RouteUpdate(BaseModel):
    name: Optional[str] = None
    courier_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    estimated_duration: Optional[int] = None
    status: Optional[RouteStatus] = None


class RouteOut(RouteBase):
    id: int
    status: RouteStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    stops: List[RouteStopOut] = []
    courier: Optional[CourierOut] = None
    vehicle: Optional[VehicleOut] = None

    class Config:
        from_attributes = True


# ===== Delivery =====
class DeliveryBase(BaseModel):
    order_id: int
    route_id: Optional[int] = None
    courier_id: Optional[int] = None
    status: DeliveryStatus = DeliveryStatus.assigned
    eta: Optional[datetime] = None
    notes: Optional[str] = None


class DeliveryCreate(DeliveryBase):
    pass


class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus
    notes: Optional[str] = None


class DeliveryOut(DeliveryBase):
    id: int
    actual_delivery_time: Optional[datetime] = None
    created_at: datetime
    order: Optional[OrderOut] = None
    courier: Optional[CourierOut] = None

    class Config:
        from_attributes = True


# ===== Notification =====
class NotificationBase(BaseModel):
    user_id: Optional[int] = None
    type: str
    title: str
    message: str


class NotificationCreate(NotificationBase):
    pass


class NotificationOut(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===== KPI =====
class KPISnapshotOut(BaseModel):
    id: int
    date: datetime
    orders_total: int
    orders_delivered: int
    orders_failed: int
    avg_eta_minutes: float
    on_time_rate: float
    low_stock_count: int

    class Config:
        from_attributes = True


class DashboardKPI(BaseModel):
    orders_total: int
    orders_delivered_today: int
    avg_eta_minutes: float
    low_stock_count: int
    on_time_rate: float
    orders_in_transit: int
    orders_pending: int
    orders_failed_today: int


class ChartDataPoint(BaseModel):
    date: str
    orders: int
    delivered: int
    failed: int


class RecommendedRoute(BaseModel):
    warehouse_id: int
    order_ids: List[int]
    estimated_duration_minutes: int
    total_distance_km: float
    priority_score: float
