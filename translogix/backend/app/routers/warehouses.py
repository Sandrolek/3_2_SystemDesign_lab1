from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import WarehouseCreate, WarehouseOut
from app import crud

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])


@router.get("", response_model=List[WarehouseOut])
def list_warehouses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_warehouses(db)


@router.post("", response_model=WarehouseOut, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    data: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.create_warehouse(db, data)


@router.get("/{warehouse_id}", response_model=WarehouseOut)
def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    wh = crud.get_warehouse(db, warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return wh
