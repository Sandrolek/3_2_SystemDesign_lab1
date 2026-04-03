from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import DeliveryOut, DeliveryStatusUpdate
from app import crud

router = APIRouter(prefix="/api/deliveries", tags=["deliveries"])


@router.get("", response_model=List[DeliveryOut])
def list_deliveries(
    courier_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_deliveries(db, courier_id=courier_id, status=status)


@router.put("/{delivery_id}/status", response_model=DeliveryOut)
def update_delivery_status(
    delivery_id: int,
    data: DeliveryStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    delivery = crud.update_delivery_status(db, delivery_id, data.status, data.notes)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return delivery
