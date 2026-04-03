import enum
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    dispatcher = "dispatcher"
    warehouse_manager = "warehouse_manager"
    courier = "courier"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    in_transit = "in_transit"
    delivered = "delivered"
    failed = "failed"
    cancelled = "cancelled"


class RouteStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class DeliveryStatus(str, enum.Enum):
    assigned = "assigned"
    in_transit = "in_transit"
    delivered = "delivered"
    failed = "failed"


class VehicleStatus(str, enum.Enum):
    available = "available"
    in_use = "in_use"
    maintenance = "maintenance"


class CourierStatus(str, enum.Enum):
    available = "available"
    on_route = "on_route"
    off_duty = "off_duty"


class RouteStopStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    skipped = "skipped"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.courier)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    courier = relationship("Courier", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False, default=1000)

    inventory_items = relationship("InventoryItem", back_populates="warehouse")
    orders = relationship("Order", back_populates="warehouse")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    sku = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    unit = Column(String(20), nullable=False, default="шт")
    min_stock_level = Column(Integer, nullable=False, default=10)
    category = Column(String(50))

    warehouse = relationship("Warehouse", back_populates="inventory_items")
    order_items = relationship("OrderItem", back_populates="inventory_item")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), unique=True, nullable=False, index=True)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.pending)
    priority = Column(Integer, nullable=False, default=3)
    customer_name = Column(String(100), nullable=False)
    customer_address = Column(String(255), nullable=False)
    customer_lat = Column(Float)
    customer_lon = Column(Float)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    scheduled_delivery = Column(DateTime)
    notes = Column(Text)

    warehouse = relationship("Warehouse", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    route_stops = relationship("RouteStop", back_populates="order")
    delivery = relationship("Delivery", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    order = relationship("Order", back_populates="items")
    inventory_item = relationship("InventoryItem", back_populates="order_items")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String(20), unique=True, nullable=False)
    type = Column(String(30), nullable=False)
    capacity = Column(Float, nullable=False)
    status = Column(Enum(VehicleStatus), nullable=False, default=VehicleStatus.available)

    couriers = relationship("Courier", back_populates="vehicle")
    routes = relationship("Route", back_populates="vehicle")


class Courier(Base):
    __tablename__ = "couriers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    status = Column(Enum(CourierStatus), nullable=False, default=CourierStatus.available)

    user = relationship("User", back_populates="courier")
    vehicle = relationship("Vehicle", back_populates="couriers")
    routes = relationship("Route", back_populates="courier")
    deliveries = relationship("Delivery", back_populates="courier")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    status = Column(Enum(RouteStatus), nullable=False, default=RouteStatus.draft)
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    estimated_duration = Column(Integer, nullable=True)  # minutes

    courier = relationship("Courier", back_populates="routes")
    vehicle = relationship("Vehicle", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", order_by="RouteStop.sequence")
    deliveries = relationship("Delivery", back_populates="route")


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    status = Column(Enum(RouteStopStatus), nullable=False, default=RouteStopStatus.pending)
    arrival_time = Column(DateTime, nullable=True)
    departure_time = Column(DateTime, nullable=True)

    route = relationship("Route", back_populates="stops")
    order = relationship("Order", back_populates="route_stops")


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    courier_id = Column(Integer, ForeignKey("couriers.id"), nullable=True)
    status = Column(Enum(DeliveryStatus), nullable=False, default=DeliveryStatus.assigned)
    eta = Column(DateTime, nullable=True)
    actual_delivery_time = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="delivery")
    route = relationship("Route", back_populates="deliveries")
    courier = relationship("Courier", back_populates="deliveries")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    type = Column(String(50), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class KPISnapshot(Base):
    __tablename__ = "kpi_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, unique=True)
    orders_total = Column(Integer, default=0)
    orders_delivered = Column(Integer, default=0)
    orders_failed = Column(Integer, default=0)
    avg_eta_minutes = Column(Float, default=0.0)
    on_time_rate = Column(Float, default=0.0)
    low_stock_count = Column(Integer, default=0)
