from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import (
    Courier, CourierStatus, Delivery, DeliveryStatus, InventoryItem,
    KPISnapshot, Notification, Order, OrderItem, OrderStatus,
    Route, RouteStatus, RouteStop, RouteStopStatus, User, Vehicle,
    VehicleStatus, Warehouse
)
from app.schemas import (
    CourierCreate, DeliveryCreate, InventoryItemCreate, InventoryItemUpdate,
    NotificationCreate, OrderCreate, OrderUpdate, RouteCreate, RouteUpdate,
    WarehouseCreate
)
from app.security import get_password_hash


# ===== User CRUD =====
def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, username: str, email: str, password: str,
                full_name: str, role) -> User:
    hashed_pw = get_password_hash(password)
    user = User(
        username=username, email=email, hashed_password=hashed_pw,
        full_name=full_name, role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ===== Warehouse CRUD =====
def get_warehouses(db: Session) -> List[Warehouse]:
    return db.query(Warehouse).all()


def get_warehouse(db: Session, warehouse_id: int) -> Optional[Warehouse]:
    return db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()


def create_warehouse(db: Session, data: WarehouseCreate) -> Warehouse:
    wh = Warehouse(**data.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


# ===== Inventory CRUD =====
def get_inventory(db: Session, warehouse_id: Optional[int] = None,
                  low_stock: bool = False) -> List[InventoryItem]:
    q = db.query(InventoryItem)
    if warehouse_id:
        q = q.filter(InventoryItem.warehouse_id == warehouse_id)
    items = q.all()
    if low_stock:
        items = [i for i in items if i.quantity <= i.min_stock_level]
    return items


def get_inventory_item(db: Session, item_id: int) -> Optional[InventoryItem]:
    return db.query(InventoryItem).filter(InventoryItem.id == item_id).first()


def create_inventory_item(db: Session, data: InventoryItemCreate) -> InventoryItem:
    item = InventoryItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_inventory_item(db: Session, item_id: int,
                          data: InventoryItemUpdate) -> Optional[InventoryItem]:
    item = get_inventory_item(db, item_id)
    if not item:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


# ===== Order CRUD =====
def _generate_order_number(db: Session) -> str:
    count = db.query(Order).count()
    return f"ORD-{datetime.utcnow().strftime('%Y%m')}-{count + 1:04d}"


def get_orders(db: Session, status: Optional[str] = None,
               warehouse_id: Optional[int] = None) -> List[Order]:
    q = db.query(Order)
    if status:
        q = q.filter(Order.status == status)
    if warehouse_id:
        q = q.filter(Order.warehouse_id == warehouse_id)
    return q.order_by(Order.created_at.desc()).all()


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def create_order(db: Session, data: OrderCreate) -> Order:
    order_data = data.model_dump(exclude={"items"})
    order_data["order_number"] = _generate_order_number(db)
    order = Order(**order_data)
    db.add(order)
    db.flush()
    for item_data in data.items:
        oi = OrderItem(order_id=order.id, **item_data.model_dump())
        db.add(oi)
    db.commit()
    db.refresh(order)
    return order


def update_order(db: Session, order_id: int, data: OrderUpdate) -> Optional[Order]:
    order = get_order(db, order_id)
    if not order:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(order, field, value)
    db.commit()
    db.refresh(order)
    return order


def assign_order_to_route(db: Session, order_id: int, route_id: int) -> Optional[Order]:
    order = get_order(db, order_id)
    if not order:
        return None
    order.status = OrderStatus.assigned
    # Add stop to route if not already there
    existing_stop = db.query(RouteStop).filter(
        RouteStop.route_id == route_id,
        RouteStop.order_id == order_id
    ).first()
    if not existing_stop:
        max_seq = db.query(RouteStop).filter(RouteStop.route_id == route_id).count()
        stop = RouteStop(route_id=route_id, order_id=order_id, sequence=max_seq + 1)
        db.add(stop)
    # Create delivery record if not already exists
    existing_delivery = db.query(Delivery).filter(Delivery.order_id == order_id).first()
    if not existing_delivery:
        route = get_route(db, route_id)
        delivery = Delivery(
            order_id=order_id,
            route_id=route_id,
            courier_id=route.courier_id if route else None,
            status=DeliveryStatus.assigned,
        )
        db.add(delivery)
    db.commit()
    db.refresh(order)
    return order


# ===== Vehicle CRUD =====
def get_vehicles(db: Session) -> List[Vehicle]:
    return db.query(Vehicle).all()


def get_vehicle(db: Session, vehicle_id: int) -> Optional[Vehicle]:
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


# ===== Courier CRUD =====
def get_couriers(db: Session) -> List[Courier]:
    return db.query(Courier).all()


def get_courier(db: Session, courier_id: int) -> Optional[Courier]:
    return db.query(Courier).filter(Courier.id == courier_id).first()


def get_available_couriers(db: Session) -> List[Courier]:
    return db.query(Courier).filter(Courier.status == CourierStatus.available).all()


def get_courier_by_user_id(db: Session, user_id: int) -> Optional[Courier]:
    return db.query(Courier).filter(Courier.user_id == user_id).first()


# ===== Route CRUD =====
def get_routes(db: Session) -> List[Route]:
    return db.query(Route).order_by(Route.created_at.desc()).all()


def get_route(db: Session, route_id: int) -> Optional[Route]:
    return db.query(Route).filter(Route.id == route_id).first()


def create_route(db: Session, data: RouteCreate) -> Route:
    route_data = data.model_dump(exclude={"stop_order_ids"})
    route = Route(**route_data)
    db.add(route)
    db.flush()
    for idx, order_id in enumerate(data.stop_order_ids, 1):
        stop = RouteStop(route_id=route.id, order_id=order_id, sequence=idx)
        db.add(stop)
        order = get_order(db, order_id)
        if order:
            order.status = OrderStatus.assigned
    db.commit()
    db.refresh(route)
    return route


def update_route(db: Session, route_id: int, data: RouteUpdate) -> Optional[Route]:
    route = get_route(db, route_id)
    if not route:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(route, field, value)
    db.commit()
    db.refresh(route)
    return route


def start_route(db: Session, route_id: int) -> Optional[Route]:
    route = get_route(db, route_id)
    if not route:
        return None
    route.status = RouteStatus.active
    route.started_at = datetime.utcnow()
    if route.courier_id:
        courier = get_courier(db, route.courier_id)
        if courier:
            courier.status = CourierStatus.on_route
    if route.vehicle_id:
        vehicle = get_vehicle(db, route.vehicle_id)
        if vehicle:
            vehicle.status = VehicleStatus.in_use
    # Update orders in route to in_transit
    for stop in route.stops:
        stop.order.status = OrderStatus.in_transit
    db.commit()
    db.refresh(route)
    return route


def complete_route(db: Session, route_id: int) -> Optional[Route]:
    route = get_route(db, route_id)
    if not route:
        return None
    route.status = RouteStatus.completed
    route.completed_at = datetime.utcnow()
    if route.courier_id:
        courier = get_courier(db, route.courier_id)
        if courier:
            courier.status = CourierStatus.available
    if route.vehicle_id:
        vehicle = get_vehicle(db, route.vehicle_id)
        if vehicle:
            vehicle.status = VehicleStatus.available
    now = datetime.utcnow()
    for delivery in route.deliveries:
        if delivery.status not in (DeliveryStatus.delivered, DeliveryStatus.failed):
            delivery.status = DeliveryStatus.delivered
            delivery.actual_delivery_time = now
    for stop in route.stops:
        if stop.order.status not in (OrderStatus.delivered, OrderStatus.failed, OrderStatus.cancelled):
            stop.order.status = OrderStatus.delivered
    db.commit()
    db.refresh(route)
    return route


# ===== Delivery CRUD =====
def get_deliveries(db: Session, courier_id: Optional[int] = None,
                   status: Optional[str] = None) -> List[Delivery]:
    q = db.query(Delivery)
    if courier_id:
        q = q.filter(Delivery.courier_id == courier_id)
    if status:
        q = q.filter(Delivery.status == status)
    return q.order_by(Delivery.created_at.desc()).all()


def get_delivery(db: Session, delivery_id: int) -> Optional[Delivery]:
    return db.query(Delivery).filter(Delivery.id == delivery_id).first()


def create_delivery(db: Session, data: DeliveryCreate) -> Delivery:
    delivery = Delivery(**data.model_dump())
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


def update_delivery_status(db: Session, delivery_id: int,
                           status: DeliveryStatus,
                           notes: Optional[str] = None) -> Optional[Delivery]:
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        return None
    delivery.status = status
    if notes:
        delivery.notes = notes
    if status == DeliveryStatus.delivered:
        delivery.actual_delivery_time = datetime.utcnow()
        delivery.order.status = OrderStatus.delivered
    elif status == DeliveryStatus.failed:
        delivery.order.status = OrderStatus.failed
    elif status == DeliveryStatus.in_transit:
        delivery.order.status = OrderStatus.in_transit
    db.commit()
    db.refresh(delivery)
    return delivery


# ===== Notification CRUD =====
def get_notifications(db: Session, user_id: Optional[int] = None) -> List[Notification]:
    q = db.query(Notification)
    if user_id:
        q = q.filter((Notification.user_id == user_id) | (Notification.user_id.is_(None)))
    return q.order_by(Notification.created_at.desc()).all()


def create_notification(db: Session, data: NotificationCreate) -> Notification:
    notif = Notification(**data.model_dump())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def mark_notification_read(db: Session, notification_id: int) -> Optional[Notification]:
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        return None
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


# ===== KPI CRUD =====
def get_kpi_snapshots(db: Session, limit: int = 7) -> List[KPISnapshot]:
    return db.query(KPISnapshot).order_by(KPISnapshot.date.desc()).limit(limit).all()
