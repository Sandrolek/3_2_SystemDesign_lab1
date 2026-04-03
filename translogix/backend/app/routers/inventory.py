from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import InventoryItemCreate, InventoryItemOut, InventoryItemUpdate
from app import crud

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("", response_model=List[InventoryItemOut])
def list_inventory(
    warehouse_id: Optional[int] = Query(None),
    low_stock: bool = Query(False),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_inventory(db, warehouse_id=warehouse_id, low_stock=low_stock)


@router.post("", response_model=InventoryItemOut, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    data: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.create_inventory_item(db, data)


@router.put("/{item_id}", response_model=InventoryItemOut)
def update_inventory_item(
    item_id: int,
    data: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    item = crud.update_inventory_item(db, item_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item
