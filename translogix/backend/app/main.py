from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, orders, warehouses, inventory, routes, deliveries, couriers, vehicles, dashboard, notifications

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TransLogix API",
    description="Intelligent Logistics Information System",
    version="1.0.0"
)

# CORS - allow all origins in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(warehouses.router)
app.include_router(inventory.router)
app.include_router(routes.router)
app.include_router(deliveries.router)
app.include_router(couriers.router)
app.include_router(vehicles.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {"message": "TransLogix API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
