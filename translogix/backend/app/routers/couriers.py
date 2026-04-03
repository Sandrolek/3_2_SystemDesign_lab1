from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import CourierOut
from app import crud

router = APIRouter(prefix="/api/couriers", tags=["couriers"])


@router.get("", response_model=List[CourierOut])
def list_couriers(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_couriers(db)


@router.get("/available", response_model=List[CourierOut])
def list_available_couriers(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_available_couriers(db)
