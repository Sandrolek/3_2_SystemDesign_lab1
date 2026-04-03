from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import RecommendedRoute, RouteCreate, RouteOut, RouteUpdate
from app import crud
from app import services

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.get("/recommend", response_model=RecommendedRoute)
def recommend_route(
    warehouse_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = services.recommend_route(db, warehouse_id)
    return result


@router.get("", response_model=List[RouteOut])
def list_routes(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.get_routes(db)


@router.post("", response_model=RouteOut, status_code=status.HTTP_201_CREATED)
def create_route(
    data: RouteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return crud.create_route(db, data)


@router.get("/{route_id}", response_model=RouteOut)
def get_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    route = crud.get_route(db, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route


@router.put("/{route_id}", response_model=RouteOut)
def update_route(
    route_id: int,
    data: RouteUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    route = crud.update_route(db, route_id, data)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route


@router.post("/{route_id}/start", response_model=RouteOut)
def start_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    route = crud.start_route(db, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route


@router.post("/{route_id}/complete", response_model=RouteOut)
def complete_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    route = crud.complete_route(db, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route
