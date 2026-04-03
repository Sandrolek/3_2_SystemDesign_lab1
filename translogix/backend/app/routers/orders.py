from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import OrderAssign, OrderCreate, OrderOut, OrderUpdate
from app import crud

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=List[OrderOut])
def list_orders(
    status: Optional[str] = Query(None),
    warehouse_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_orders(db, status=status, warehouse_id=warehouse_id)


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.create_order(db, data)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/{order_id}", response_model=OrderOut)
def update_order(
    order_id: int,
    data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    order = crud.update_order(db, order_id, data)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/assign", response_model=OrderOut)
def assign_order(
    order_id: int,
    data: OrderAssign,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    order = crud.assign_order_to_route(db, order_id, data.route_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
