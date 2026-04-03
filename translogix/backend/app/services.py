import math
import random
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import InventoryItem, Order, OrderStatus, Route, Warehouse


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two geographic points."""
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def compute_priority_score(order: Order) -> float:
    """
    Priority scoring:
    score = (days_since_created * 2) + (5 - scheduled_slack_days) + random component
    """
    now = datetime.utcnow()
    days_since_created = max(0, (now - order.created_at).total_seconds() / 86400)

    if order.scheduled_delivery:
        slack_days = max(0, (order.scheduled_delivery - now).total_seconds() / 86400)
        slack_component = max(0, 5 - slack_days)
    else:
        slack_component = 2.5  # default neutral

    random_component = random.uniform(0, 1)
    priority_base = order.priority  # 1-5 scale

    score = (days_since_created * 2) + slack_component + random_component + priority_base
    return round(score, 2)


def estimate_eta_minutes(warehouse: Warehouse, order: Order) -> int:
    """
    ETA estimation: haversine distance from warehouse to customer
    * average_speed_kmh (30 km/h urban) + random traffic factor
    """
    if not order.customer_lat or not order.customer_lon:
        return random.randint(45, 120)

    distance_km = haversine_km(
        warehouse.lat, warehouse.lon,
        order.customer_lat, order.customer_lon
    )

    avg_speed_kmh = 30.0
    base_minutes = (distance_km / avg_speed_kmh) * 60

    # traffic factor: 0.8x to 1.8x
    traffic_factor = random.uniform(0.8, 1.8)
    eta_minutes = int(base_minutes * traffic_factor) + random.randint(5, 20)

    return max(10, eta_minutes)


def recommend_route(
    db: Session,
    warehouse_id: int,
    max_stops: int = 8
) -> dict:
    """
    Route recommendation:
    Take pending orders from warehouse, sort by priority score desc,
    return suggested route with estimated duration.
    """
    from app.crud import get_warehouse

    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse:
        return {"warehouse_id": warehouse_id, "order_ids": [], "estimated_duration_minutes": 0,
                "total_distance_km": 0.0, "priority_score": 0.0}

    pending_orders = db.query(Order).filter(
        Order.warehouse_id == warehouse_id,
        Order.status == OrderStatus.pending
    ).all()

    # Score each order
    scored = [(order, compute_priority_score(order)) for order in pending_orders]
    scored.sort(key=lambda x: x[1], reverse=True)

    selected = scored[:max_stops]
    selected_orders = [s[0] for s in selected]

    # Calculate total distance (simple sequential)
    total_distance = 0.0
    prev_lat, prev_lon = warehouse.lat, warehouse.lon
    for order in selected_orders:
        if order.customer_lat and order.customer_lon:
            d = haversine_km(prev_lat, prev_lon, order.customer_lat, order.customer_lon)
            total_distance += d
            prev_lat, prev_lon = order.customer_lat, order.customer_lon

    # Return to warehouse
    if selected_orders:
        last = selected_orders[-1]
        if last.customer_lat and last.customer_lon:
            total_distance += haversine_km(last.customer_lat, last.customer_lon,
                                           warehouse.lat, warehouse.lon)

    avg_speed = 30.0
    base_duration = (total_distance / avg_speed) * 60 if total_distance > 0 else 30
    stop_time = len(selected_orders) * 10  # 10 min per stop
    estimated_duration = int(base_duration + stop_time)

    avg_priority = sum(s[1] for s in selected) / len(selected) if selected else 0.0

    return {
        "warehouse_id": warehouse_id,
        "order_ids": [o.id for o in selected_orders],
        "estimated_duration_minutes": estimated_duration,
        "total_distance_km": round(total_distance, 2),
        "priority_score": round(avg_priority, 2)
    }


def flag_low_stock(db: Session, warehouse_id: Optional[int] = None) -> List[InventoryItem]:
    """
    Low stock prediction: flag items where quantity <= min_stock_level * 1.2 (20% buffer warning)
    """
    q = db.query(InventoryItem)
    if warehouse_id:
        q = q.filter(InventoryItem.warehouse_id == warehouse_id)

    all_items = q.all()
    return [item for item in all_items if item.quantity <= item.min_stock_level * 1.2]


def count_low_stock(db: Session) -> int:
    items = flag_low_stock(db)
    return len(items)
