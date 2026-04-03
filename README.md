# TransLogix

Интеллектуальная логистическая информационная система с оптимизацией маршрутов и управлением складскими запасами.

## Стек

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Charts:** Recharts
- **Map:** react-leaflet
- **Auth:** JWT (demo)
- **Deploy:** Docker Compose

---

## Быстрый старт

### Требования

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/)

### Запуск

```bash
git clone <repo-url>
cd translogix
docker compose up --build
```

После старта:

| Сервис | URL |
|--------|-----|
| Веб-интерфейс | http://localhost:3000 |
| API (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

> При первом запуске база данных автоматически заполняется демо-данными.

### Остановка

```bash
docker compose down
```

Чтобы также удалить данные PostgreSQL:

```bash
docker compose down -v
```

---

## Демо-данные

### Учётные записи

| Роль | Логин | Пароль |
|------|-------|--------|
| Администратор | `admin` | `admin123` |
| Диспетчер | `dispatcher1` | `pass123` |
| Менеджер склада | `manager1` | `pass123` |
| Курьер | `courier1` | `pass123` |

### Объём данных

- 3 склада (Москва)
- 30 заказов (разные статусы, последние 14 дней)
- 8 курьеров + 8 транспортных средств
- 10 маршрутов с остановками
- 25 складских позиций (часть ниже минимального уровня)
- KPI-снимки за 5 дней + уведомления

---

## Сценарии демонстрации

**Диспетчер** (`dispatcher1 / pass123`)
1. Dashboard → смотрим KPI и график заказов
2. Заказы → фильтруем по статусу `pending`, назначаем заказ на маршрут
3. Маршруты → запускаем черновой маршрут, видим статус курьера

**Менеджер склада** (`manager1 / pass123`)
1. Склад → видим остатки по всем складам
2. Позиции, выделенные красным — ниже минимального уровня (low stock alert)

**Курьер** (`courier1 / pass123`)
1. Мой маршрут → видим список остановок текущего маршрута
2. Меняем статус доставки: `assigned → in_transit → delivered`

---

## Архитектура

```
translogix/
├── backend/
│   ├── app/
│   │   ├── main.py          # точка входа FastAPI
│   │   ├── models.py        # SQLAlchemy модели (12 сущностей)
│   │   ├── schemas.py       # Pydantic схемы
│   │   ├── crud.py          # операции с БД
│   │   ├── services.py      # AI-mock: ETA, приоритеты, рекомендации маршрутов
│   │   ├── security.py      # bcrypt + JWT
│   │   ├── database.py      # подключение к БД
│   │   ├── config.py        # настройки из env
│   │   └── routers/         # 10 роутеров
│   └── seed.py              # заполнение БД демо-данными
├── frontend/
│   ├── src/
│   │   ├── pages/           # Login, Dashboard, Orders, Routes, Warehouse, Courier
│   │   ├── api/             # типизированные API-модули
│   │   ├── store/           # Zustand (auth)
│   │   └── components/      # Layout, Sidebar, StatusBadge, StatCard
│   └── vite.config.ts       # proxy /api → backend:8000
└── docker-compose.yml
```

### ER-модель (основные связи)

```
User ──< Courier >── Vehicle
                │
               Route ──< RouteStop >── Order ──< OrderItem >── InventoryItem
                │                       │                            │
             Delivery              Warehouse ──────────────────────>─┘
                │
           Notification → User
```

---

## API

Документация доступна по адресу **http://localhost:8000/docs** (Swagger UI).

Основные группы эндпоинтов:

| Prefix | Описание |
|--------|----------|
| `/api/auth` | Авторизация, текущий пользователь |
| `/api/orders` | Заказы, назначение на маршрут |
| `/api/routes` | Маршруты, запуск, завершение, AI-рекомендация |
| `/api/deliveries` | Статус доставок |
| `/api/warehouses` | Склады |
| `/api/inventory` | Складские остатки, low-stock |
| `/api/couriers` | Курьеры |
| `/api/vehicles` | Транспорт |
| `/api/dashboard` | KPI, статистика, данные графиков |
| `/api/notifications` | Уведомления |

---

## Разработка без Docker

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL=postgresql://translogix:translogix123@localhost:5432/translogix
export SECRET_KEY=supersecretkey123
export ALGORITHM=HS256

python seed.py
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
