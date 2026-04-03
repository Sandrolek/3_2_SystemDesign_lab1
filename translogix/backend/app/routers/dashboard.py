from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import ChartDataPoint, DashboardKPI, OrderOut
from app.models import Delivery, DeliveryStatus, KPISnapshot, Order, OrderStatus
from app import crud, services

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpi", response_model=DashboardKPI)
def get_kpi(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    orders_total = db.query(Order).count()

    orders_delivered_today = db.query(Order).filter(
        Order.status == OrderStatus.delivered,
        Order.created_at >= today_start,
        Order.created_at < today_end
    ).count()

    orders_failed_today = db.query(Order).filter(
        Order.status == OrderStatus.failed,
        Order.created_at >= today_start,
        Order.created_at < today_end
    ).count()

    orders_in_transit = db.query(Order).filter(
        Order.status == OrderStatus.in_transit
    ).count()

    orders_pending = db.query(Order).filter(
        Order.status == OrderStatus.pending
    ).count()

    low_stock_count = services.count_low_stock(db)

    # Calculate average ETA from deliveries
    deliveries_with_eta = db.query(Delivery).filter(
        Delivery.eta.isnot(None),
        Delivery.actual_delivery_time.isnot(None)
    ).all()

    if deliveries_with_eta:
        total_diff = 0
        count = 0
        for d in deliveries_with_eta:
            diff = (d.actual_delivery_time - d.created_at).total_seconds() / 60
            if diff > 0:
                total_diff += diff
                count += 1
        avg_eta_minutes = total_diff / count if count > 0 else 45.0
    else:
        avg_eta_minutes = 45.0

    # On-time rate from KPI snapshots
    recent_kpi = crud.get_kpi_snapshots(db, limit=1)
    on_time_rate = recent_kpi[0].on_time_rate if recent_kpi else 87.5

    return DashboardKPI(
        orders_total=orders_total,
        orders_delivered_today=orders_delivered_today,
        avg_eta_minutes=round(avg_eta_minutes, 1),
        low_stock_count=low_stock_count,
        on_time_rate=on_time_rate,
        orders_in_transit=orders_in_transit,
        orders_pending=orders_pending,
        orders_failed_today=orders_failed_today
    )


@router.get("/recent-orders", response_model=List[OrderOut])
def get_recent_orders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Order).order_by(Order.created_at.desc()).limit(10).all()


@router.get("/chart-data", response_model=List[ChartDataPoint])
def get_chart_data(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = []
    now = datetime.utcnow()

    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        orders = db.query(Order).filter(
            Order.created_at >= day_start,
            Order.created_at < day_end
        ).count()

        delivered = db.query(Order).filter(
            Order.created_at >= day_start,
            Order.created_at < day_end,
            Order.status == OrderStatus.delivered
        ).count()

        failed = db.query(Order).filter(
            Order.created_at >= day_start,
            Order.created_at < day_end,
            Order.status == OrderStatus.failed
        ).count()

        result.append(ChartDataPoint(
            date=day_start.strftime("%d.%m"),
            orders=orders,
            delivered=delivered,
            failed=failed
        ))

    return result
