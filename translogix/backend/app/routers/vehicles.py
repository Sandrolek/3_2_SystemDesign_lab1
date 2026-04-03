from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import VehicleOut
from app import crud

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get("", response_model=List[VehicleOut])
def list_vehicles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_vehicles(db)
