"""
Seed script for TransLogix.
Run: cd backend && python seed.py
Drops and recreates all tables, then inserts demo data.
"""
import os
import sys
import random
from datetime import datetime, timedelta

# Make sure we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import (
    Courier, CourierStatus, Delivery, DeliveryStatus,
    InventoryItem, KPISnapshot, Notification, Order, OrderItem,
    OrderStatus, Route, RouteStatus, RouteStop, RouteStopStatus,
    User, UserRole, Vehicle, VehicleStatus, Warehouse
)
from app.security import get_password_hash

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Skip seeding if data already exists
_check_db = SessionLocal()
_already_seeded = _check_db.query(User).first() is not None
_check_db.close()
if _already_seeded:
    print("Database already contains data, skipping seed.")
    sys.exit(0)

db = SessionLocal()

print("Seeding users...")
users_data = [
    ("admin", "admin@translogix.ru", "admin123", "Администратор Системы", UserRole.admin),
    ("dispatcher1", "dispatcher1@translogix.ru", "pass123", "Диспетчер Иванов А.С.", UserRole.dispatcher),
    ("manager1", "manager1@translogix.ru", "pass123", "Менеджер Склада Петрова М.К.", UserRole.warehouse_manager),
    ("courier1", "courier1@translogix.ru", "pass123", "Курьер Сидоров П.В.", UserRole.courier),
]

users = []
for username, email, password, full_name, role in users_data:
    u = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        role=role,
        is_active=True,
        created_at=datetime.utcnow() - timedelta(days=30)
    )
    db.add(u)
    users.append(u)
db.commit()
for u in users:
    db.refresh(u)

print("Seeding warehouses...")
warehouses_data = [
    ("Склад Центральный", "г. Москва, ул. Складская, д. 1", 55.7558, 37.6173, 5000),
    ("Склад Северный", "г. Москва, Дмитровское шоссе, д. 107", 55.8823, 37.5641, 3000),
    ("Склад Южный", "г. Москва, Варшавское шоссе, д. 125", 55.6215, 37.6082, 2500),
]

warehouses = []
for name, address, lat, lon, capacity in warehouses_data:
    wh = Warehouse(name=name, address=address, lat=lat, lon=lon, capacity=capacity)
    db.add(wh)
    warehouses.append(wh)
db.commit()
for wh in warehouses:
    db.refresh(wh)

print("Seeding vehicles...")
vehicles_data = [
    ("А123БВ77", "van", 1500.0, VehicleStatus.available),
    ("В456ГД77", "van", 1500.0, VehicleStatus.in_use),
    ("Е789ЖЗ77", "truck", 5000.0, VehicleStatus.available),
    ("И012КЛ77", "truck", 5000.0, VehicleStatus.maintenance),
    ("М345НО77", "motorcycle", 50.0, VehicleStatus.available),
    ("П678РС77", "motorcycle", 50.0, VehicleStatus.in_use),
    ("Т901УФ77", "van", 2000.0, VehicleStatus.available),
    ("Х234ЦЧ77", "van", 2000.0, VehicleStatus.available),
]

vehicles = []
for plate, vtype, capacity, vstatus in vehicles_data:
    v = Vehicle(license_plate=plate, type=vtype, capacity=capacity, status=vstatus)
    db.add(v)
    vehicles.append(v)
db.commit()
for v in vehicles:
    db.refresh(v)

print("Seeding couriers...")
courier_names = [
    ("Сидоров Павел Викторович", "+7 (916) 123-45-67"),
    ("Козлов Дмитрий Андреевич", "+7 (916) 234-56-78"),
    ("Новиков Алексей Игоревич", "+7 (916) 345-67-89"),
    ("Морозов Сергей Николаевич", "+7 (916) 456-78-90"),
    ("Волков Максим Олегович", "+7 (916) 567-89-01"),
    ("Соколов Иван Петрович", "+7 (916) 678-90-12"),
    ("Лебедев Артём Константинович", "+7 (916) 789-01-23"),
    ("Орлов Виктор Юрьевич", "+7 (916) 890-12-34"),
]

couriers = []
courier_statuses = [
    CourierStatus.available,
    CourierStatus.on_route,
    CourierStatus.available,
    CourierStatus.on_route,
    CourierStatus.available,
    CourierStatus.off_duty,
    CourierStatus.available,
    CourierStatus.available,
]
for idx, ((name, phone), cstatus) in enumerate(zip(courier_names, courier_statuses)):
    user_id = users[3].id if idx == 0 else None  # courier1 user -> first courier
    vehicle_id = vehicles[idx % len(vehicles)].id
    c = Courier(
        user_id=user_id,
        vehicle_id=vehicle_id,
        name=name,
        phone=phone,
        status=cstatus
    )
    db.add(c)
    couriers.append(c)
db.commit()
for c in couriers:
    db.refresh(c)

print("Seeding inventory items...")
inventory_data = [
    # Warehouse 1 - Central
    (warehouses[0].id, "SKU-001", "Ноутбук Lenovo ThinkPad", 45, "шт", 10, "Электроника"),
    (warehouses[0].id, "SKU-002", "Смартфон Samsung Galaxy", 8, "шт", 15, "Электроника"),  # low stock
    (warehouses[0].id, "SKU-003", "Принтер HP LaserJet", 22, "шт", 5, "Оргтехника"),
    (warehouses[0].id, "SKU-004", "Бумага А4 (пачка)", 5, "пачка", 50, "Канцтовары"),  # low stock
    (warehouses[0].id, "SKU-005", "Монитор Dell 24\"", 18, "шт", 8, "Электроника"),
    (warehouses[0].id, "SKU-006", "Клавиатура беспроводная", 3, "шт", 20, "Периферия"),  # low stock
    (warehouses[0].id, "SKU-007", "Мышь оптическая", 67, "шт", 20, "Периферия"),
    (warehouses[0].id, "SKU-008", "USB-концентратор", 14, "шт", 10, "Периферия"),
    (warehouses[0].id, "SKU-009", "Наушники Sony", 31, "шт", 10, "Электроника"),
    # Warehouse 2 - North
    (warehouses[1].id, "SKU-010", "Шкаф офисный металлический", 12, "шт", 5, "Мебель"),
    (warehouses[1].id, "SKU-011", "Стол рабочий", 7, "шт", 10, "Мебель"),  # low stock
    (warehouses[1].id, "SKU-012", "Кресло офисное", 4, "шт", 10, "Мебель"),  # low stock
    (warehouses[1].id, "SKU-013", "Полка навесная", 28, "шт", 10, "Мебель"),
    (warehouses[1].id, "SKU-014", "Сейф офисный", 6, "шт", 3, "Оборудование"),
    (warehouses[1].id, "SKU-015", "Проектор Epson", 9, "шт", 5, "Оргтехника"),
    (warehouses[1].id, "SKU-016", "Телефон VoIP", 2, "шт", 10, "Связь"),  # low stock
    (warehouses[1].id, "SKU-017", "ИБП APC 1000VA", 19, "шт", 5, "Электрооборудование"),
    # Warehouse 3 - South
    (warehouses[2].id, "SKU-018", "Картридж для принтера", 42, "шт", 20, "Расходники"),
    (warehouses[2].id, "SKU-019", "Тонер-картридж Canon", 11, "шт", 15, "Расходники"),
    (warehouses[2].id, "SKU-020", "Флеш-накопитель 64GB", 85, "шт", 30, "Электроника"),
    (warehouses[2].id, "SKU-021", "Внешний жёсткий диск 1TB", 16, "шт", 10, "Электроника"),
    (warehouses[2].id, "SKU-022", "Сетевой коммутатор", 5, "шт", 8, "Сетевое оборудование"),  # low stock
    (warehouses[2].id, "SKU-023", "Маршрутизатор TP-Link", 23, "шт", 10, "Сетевое оборудование"),
    (warehouses[2].id, "SKU-024", "Кабель HDMI 2м", 7, "шт", 30, "Кабельная продукция"),  # low stock
    (warehouses[2].id, "SKU-025", "Удлинитель 5м на 4 розетки", 38, "шт", 15, "Электрооборудование"),
]

inventory_items = []
for wh_id, sku, name, qty, unit, min_stock, category in inventory_data:
    item = InventoryItem(
        warehouse_id=wh_id,
        sku=sku,
        name=name,
        quantity=qty,
        unit=unit,
        min_stock_level=min_stock,
        category=category
    )
    db.add(item)
    inventory_items.append(item)
db.commit()
for item in inventory_items:
    db.refresh(item)

print("Seeding orders...")
customer_data = [
    ("Иванов Александр Петрович", "г. Москва, ул. Ленина, д. 5, кв. 12", 55.7697, 37.6020),
    ("Петрова Мария Сергеевна", "г. Москва, Тверская ул., д. 18, кв. 34", 55.7639, 37.6080),
    ("Сидоренко Олег Николаевич", "г. Москва, Арбат ул., д. 22", 55.7520, 37.5929),
    ("Козлова Анна Игоревна", "г. Москва, Профсоюзная ул., д. 77", 55.6771, 37.5655),
    ("Новикова Елена Дмитриевна", "г. Москва, Ленинградский пр-т, д. 55", 55.8082, 37.5380),
    ("Морозов Виктор Андреевич", "г. Москва, Кутузовский пр-т, д. 32", 55.7440, 37.5346),
    ("Волков Сергей Михайлович", "г. Москва, Мичуринский пр-т, д. 14", 55.7059, 37.5028),
    ("Соколова Наталья Владимировна", "г. Москва, Нахимовский пр-т, д. 58", 55.6632, 37.5893),
    ("Лебедев Антон Юрьевич", "г. Москва, Можайское шоссе, д. 2", 55.7356, 37.4742),
    ("Орлова Светлана Константиновна", "г. Москва, Ярославское шоссе, д. 124", 55.8684, 37.6928),
    ("Фёдоров Павел Евгеньевич", "г. Москва, пр-т Мира, д. 101", 55.8064, 37.6329),
    ("Михайлова Юлия Алексеевна", "г. Москва, Дмитровское шоссе, д. 65", 55.8552, 37.5713),
    ("Смирнов Денис Романович", "г. Москва, Варшавское шоссе, д. 89", 55.6390, 37.6171),
    ("Андреева Ирина Борисовна", "г. Москва, Каширское шоссе, д. 48", 55.6271, 37.6605),
    ("Дмитриев Кирилл Семёнович", "г. Москва, Рязанский пр-т, д. 75", 55.7221, 37.7720),
]

now = datetime.utcnow()
order_statuses = [
    OrderStatus.pending, OrderStatus.pending, OrderStatus.pending,
    OrderStatus.assigned, OrderStatus.assigned,
    OrderStatus.in_transit, OrderStatus.in_transit, OrderStatus.in_transit,
    OrderStatus.delivered, OrderStatus.delivered, OrderStatus.delivered,
    OrderStatus.delivered, OrderStatus.delivered, OrderStatus.delivered,
    OrderStatus.delivered, OrderStatus.delivered, OrderStatus.delivered,
    OrderStatus.delivered, OrderStatus.delivered, OrderStatus.delivered,
    OrderStatus.failed, OrderStatus.failed,
    OrderStatus.cancelled,
    OrderStatus.pending,
    OrderStatus.assigned,
    OrderStatus.in_transit,
    OrderStatus.delivered,
    OrderStatus.delivered,
    OrderStatus.pending,
    OrderStatus.pending,
]

orders = []
for i in range(30):
    cust = customer_data[i % len(customer_data)]
    wh = warehouses[i % len(warehouses)]
    days_ago = random.randint(0, 14)
    created = now - timedelta(days=days_ago, hours=random.randint(0, 8))
    sched = created + timedelta(days=random.randint(1, 3))
    priority = random.randint(1, 5)
    status = order_statuses[i % len(order_statuses)]

    order = Order(
        order_number=f"ORD-{now.strftime('%Y%m')}-{i+1:04d}",
        status=status,
        priority=priority,
        customer_name=cust[0],
        customer_address=cust[1],
        customer_lat=cust[2] + random.uniform(-0.01, 0.01),
        customer_lon=cust[3] + random.uniform(-0.01, 0.01),
        warehouse_id=wh.id,
        created_at=created,
        scheduled_delivery=sched,
        notes=None
    )
    db.add(order)
    orders.append(order)
db.flush()

# Add order items
for order in orders:
    n_items = random.randint(1, 3)
    wh_items = [it for it in inventory_items if it.warehouse_id == order.warehouse_id]
    if not wh_items:
        wh_items = inventory_items[:3]
    chosen = random.sample(wh_items, min(n_items, len(wh_items)))
    for inv_item in chosen:
        oi = OrderItem(
            order_id=order.id,
            inventory_item_id=inv_item.id,
            quantity=random.randint(1, 3)
        )
        db.add(oi)

db.commit()
for o in orders:
    db.refresh(o)

print("Seeding routes...")
routes = []
route_data = [
    ("Маршрут Центральный 1", RouteStatus.completed, couriers[0].id, vehicles[0].id, 120,
     now - timedelta(days=7)),
    ("Маршрут Северный 1", RouteStatus.completed, couriers[1].id, vehicles[1].id, 90,
     now - timedelta(days=5)),
    ("Маршрут Южный 1", RouteStatus.completed, couriers[2].id, vehicles[2].id, 105,
     now - timedelta(days=4)),
    ("Маршрут Центральный 2", RouteStatus.active, couriers[3].id, vehicles[4].id, 80,
     now - timedelta(hours=3)),
    ("Маршрут Северный 2", RouteStatus.active, couriers[1].id, vehicles[1].id, 95,
     now - timedelta(hours=5)),
    ("Маршрут Южный 2", RouteStatus.draft, couriers[4].id, vehicles[6].id, 110,
     now - timedelta(hours=1)),
    ("Маршрут Экспресс 1", RouteStatus.draft, None, None, 60,
     now - timedelta(hours=2)),
    ("Маршрут Центральный 3", RouteStatus.completed, couriers[2].id, vehicles[2].id, 130,
     now - timedelta(days=2)),
    ("Маршрут Северный 3", RouteStatus.draft, couriers[5].id, vehicles[7].id, 85,
     now - timedelta(minutes=30)),
    ("Маршрут Южный 3", RouteStatus.cancelled, couriers[6].id, vehicles[5].id, 70,
     now - timedelta(days=1)),
]

route_objects = []
for idx, (name, rstatus, courier_id, vehicle_id, est_dur, created) in enumerate(route_data):
    started_at = None
    completed_at = None
    if rstatus == RouteStatus.active:
        started_at = created
    elif rstatus == RouteStatus.completed:
        started_at = created
        completed_at = created + timedelta(minutes=est_dur)

    r = Route(
        name=name,
        status=rstatus,
        courier_id=courier_id,
        vehicle_id=vehicle_id,
        estimated_duration=est_dur,
        created_at=created,
        started_at=started_at,
        completed_at=completed_at
    )
    db.add(r)
    route_objects.append(r)
db.flush()

# Add route stops - assign some orders to routes
order_chunks = [
    orders[0:3],    # route 0
    orders[3:6],    # route 1
    orders[6:9],    # route 2
    orders[9:12],   # route 3 (active)
    orders[12:15],  # route 4 (active)
    orders[15:18],  # route 5 (draft)
    orders[18:20],  # route 6 (draft)
    orders[20:23],  # route 7
    orders[23:26],  # route 8
    orders[26:28],  # route 9
]

for route, order_group in zip(route_objects, order_chunks):
    for seq, order in enumerate(order_group, 1):
        stop_status = RouteStopStatus.pending
        arr_time = None
        dep_time = None

        if route.status == RouteStatus.completed:
            stop_status = RouteStopStatus.completed
            arr_time = route.started_at + timedelta(minutes=seq * 25)
            dep_time = arr_time + timedelta(minutes=10)
        elif route.status == RouteStatus.active and seq == 1:
            stop_status = RouteStopStatus.completed
            arr_time = route.started_at + timedelta(minutes=20)
            dep_time = arr_time + timedelta(minutes=10)

        stop = RouteStop(
            route_id=route.id,
            order_id=order.id,
            sequence=seq,
            status=stop_status,
            arrival_time=arr_time,
            departure_time=dep_time
        )
        db.add(stop)

        # Update order status based on route
        if route.status == RouteStatus.completed:
            order.status = OrderStatus.delivered
        elif route.status == RouteStatus.active:
            order.status = OrderStatus.in_transit
        elif route.status in (RouteStatus.draft, RouteStatus.cancelled):
            pass  # keep as assigned/pending

db.commit()
for r in route_objects:
    db.refresh(r)

print("Seeding deliveries...")
delivery_orders = [o for o in orders if o.status in
                   (OrderStatus.assigned, OrderStatus.in_transit, OrderStatus.delivered, OrderStatus.failed)]

for order in delivery_orders[:20]:
    route_match = None
    for route, order_group in zip(route_objects, order_chunks):
        if order in order_group:
            route_match = route
            break

    courier_match = route_match.courier_id if route_match else None

    if order.status == OrderStatus.delivered:
        d_status = DeliveryStatus.delivered
        actual = order.created_at + timedelta(hours=random.randint(2, 6))
    elif order.status == OrderStatus.in_transit:
        d_status = DeliveryStatus.in_transit
        actual = None
    elif order.status == OrderStatus.failed:
        d_status = DeliveryStatus.failed
        actual = None
    else:
        d_status = DeliveryStatus.assigned
        actual = None

    eta = order.created_at + timedelta(hours=random.randint(1, 4))

    delivery = Delivery(
        order_id=order.id,
        route_id=route_match.id if route_match else None,
        courier_id=courier_match,
        status=d_status,
        eta=eta,
        actual_delivery_time=actual,
        notes=None,
        created_at=order.created_at + timedelta(minutes=30)
    )
    db.add(delivery)

db.commit()

print("Seeding KPI snapshots...")
for i in range(5, -1, -1):
    snap_date = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
    total = random.randint(5, 12)
    delivered = random.randint(3, total)
    failed = random.randint(0, total - delivered)
    on_time = round(random.uniform(0.75, 0.98) * 100, 1)
    avg_eta = round(random.uniform(35, 75), 1)
    low = random.randint(3, 8)

    snap = KPISnapshot(
        date=snap_date,
        orders_total=total,
        orders_delivered=delivered,
        orders_failed=failed,
        avg_eta_minutes=avg_eta,
        on_time_rate=on_time,
        low_stock_count=low
    )
    db.add(snap)

db.commit()

print("Seeding notifications...")
notif_data = [
    (None, "low_stock", "Критический запас: Бумага А4", "Остаток бумаги А4 на складе Центральный составляет 5 пачек (мин. 50). Требуется пополнение."),
    (None, "low_stock", "Критический запас: Клавиатура беспроводная", "Остаток клавиатур на складе Центральный составляет 3 шт (мин. 20). Требуется пополнение."),
    (None, "low_stock", "Низкий запас: Смартфон Samsung Galaxy", "Остаток смартфонов: 8 шт (мин. 15). Рекомендуется заказ."),
    (users[0].id, "delivery_update", "Маршрут завершён", "Маршрут 'Маршрут Центральный 1' успешно завершён. Доставлено 3 заказа."),
    (users[1].id, "delivery_update", "Новый маршрут назначен", "Маршрут 'Маршрут Северный 2' активирован. Курьер Козлов Д.А. начал выполнение."),
    (None, "low_stock", "Критический запас: Кресло офисное", "Остаток кресел на складе Северный: 4 шт (мин. 10). Требуется пополнение."),
    (users[3].id, "delivery_update", "Заказ доставлен", "Заказ ORD-202401-0001 успешно доставлен клиенту Иванов А.П."),
    (None, "system", "Плановое обслуживание", "Транспортное средство И012КЛ77 передано на техническое обслуживание."),
    (users[1].id, "new_order", "Новый приоритетный заказ", "Получен новый заказ с приоритетом 5 от клиента Петрова М.С. Требуется назначение маршрута."),
    (None, "low_stock", "Низкий запас: Телефон VoIP", "Остаток телефонов VoIP на складе Северный: 2 шт (мин. 10). Рекомендуется заказ."),
    (users[2].id, "inventory", "Инвентаризация завершена", "Плановая инвентаризация склада Южный завершена. Выявлено 3 позиции с расхождением."),
    (users[1].id, "delivery_update", "Задержка доставки", "Заказ ORD-202401-0021 помечен как неудачный. Клиент недоступен по указанному адресу."),
]

for user_id, ntype, title, message in notif_data:
    n = Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        message=message,
        is_read=random.choice([True, False, False]),
        created_at=now - timedelta(hours=random.randint(0, 48))
    )
    db.add(n)

db.commit()
db.close()

print("=" * 50)
print("Seed completed successfully!")
print("=" * 50)
print("Demo credentials:")
print("  admin / admin123       (admin)")
print("  dispatcher1 / pass123  (dispatcher)")
print("  manager1 / pass123     (warehouse_manager)")
print("  courier1 / pass123     (courier)")
print("=" * 50)
