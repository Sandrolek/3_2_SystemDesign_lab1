Теперь реализуй backend для TransLogix.

Нужен production-like учебный backend на FastAPI.

Требования:
1. Используй FastAPI, SQLAlchemy 2.x, Pydantic, PostgreSQL.
2. Структура должна быть модульной:
   - app/api
   - app/core
   - app/db
   - app/models
   - app/schemas
   - app/services
   - app/repositories
   - app/utils
3. Добавь Dockerfile и зависимости.
4. Добавь Alembic или, если хочешь упростить прототип, автоматическое создание таблиц при старте. Но если выбираешь упрощение — обоснуй.
5. Добавь seed script с демо-данными.
6. Добавь CORS для frontend.
7. Добавь health endpoint.
8. Добавь OpenAPI/Swagger.

Нужные модули backend:
- auth (упрощённый demo login по ролям)
- orders
- warehouses
- inventory
- couriers
- vehicles
- routes
- deliveries
- dashboard
- notifications

Обязательная бизнес-логика:
1. Orders:
   - создание заказа
   - просмотр списка заказов
   - фильтрация по статусу/приоритету/складу
   - назначение заказа на маршрут
2. Routes:
   - создание маршрута
   - добавление остановок
   - просмотр активных маршрутов
   - endpoint “generate recommended route” на mock-логике
3. Deliveries:
   - изменение статусов доставки
   - фиксация времени обновления
4. Inventory:
   - просмотр остатков
   - предупреждения low stock
   - mock forecast/restock recommendation
5. Dashboard:
   - агрегированные KPI
   - on-time delivery rate
   - average ETA
   - active routes count
   - delayed deliveries count
6. Notifications:
   - список системных уведомлений
   - генерация уведомлений по low stock и delayed deliveries

Технические требования:
- Используй enum для статусов:
  - OrderStatus
  - DeliveryStatus
  - RouteStatus
  - UserRole
- Добавь базовую валидацию входных данных.
- Добавь обработчики ошибок.
- Раздели схемы create/read/update.
- Пиши понятный код без лишних комментариев.
- Не используй заглушки “TODO” вместо работающего кода, если это можно реализовать сейчас.

Mock intelligence layer:
Реализуй сервисы:
- estimate_eta(...)
- calculate_order_priority(...)
- recommend_route(...)
- predict_low_stock(...)
Они могут быть эвристическими, но должны возвращать реалистичные результаты.

Данные:
- координаты складов, заказов и маршрутов можно хранить как latitude/longitude.
- для демонстрации сгенерируй данные в пределах одного города/региона.

Что хочу получить от тебя:
1. Полный код backend.
2. requirements / pyproject.
3. Dockerfile.
4. env.example.
5. seed script.
6. Инструкцию запуска.
7. Команды для локального тестирования API.

После генерации:
- проверь внутреннюю согласованность импортов,
- проверь, что дерево файлов полное,
- покажи список потенциальных слабых мест backend.

Перед тем как генерировать код:
- проверь согласованность имен сущностей и API;
- не создавай лишнюю сложность;
- ориентируйся на работающий MVP;
- если есть спор между “красиво архитектурно” и “реально запускается для лабораторной”, выбирай второе;
- в конце каждой генерации делай self-check:
  1. broken imports
  2. missing env variables
  3. mismatch between frontend and backend contracts
  4. incomplete mock data
  5. run instructions completeness