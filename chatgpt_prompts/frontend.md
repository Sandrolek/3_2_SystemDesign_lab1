Теперь реализуй frontend для TransLogix.

Нужен современный, чистый и полностью рабочий frontend на React + TypeScript + Vite.

Технологии:
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Recharts
- Leaflet или mock-карта
- Zustand или Context API для простой auth/session state

Требования к UI:
1. Чистый dashboard-style интерфейс.
2. Адаптивность для desktop и tablet.
3. Основной сценарий — веб-интерфейс для диспетчера и менеджера склада.
4. Также сделай упрощённый courier view.
5. Интерфейс должен выглядеть как реальный SaaS-продукт для логистики.

Также прикрепляю мой дизайн экранов из Stitch AI для проекта TransLogix.
Используй этот дизайн как UI-референс и реализуй frontend на React + TypeScript + Vite + Tailwind + shadcn/ui.

Важно:
- максимально повтори layout, композицию блоков и логику экранов;
- не делай пиксель-перфект копию, но соблюдай визуальную структуру;
- используй компоненты: sidebar, topbar, KPI cards, data tables, alerts, detail panels;
- frontend должен быть интегрирован с backend API;
- не делай статический макет, нужен рабочий интерфейс.

Обязательные страницы:
- Login / demo role selector
- Dashboard
- Orders
- Routes
- Warehouses / Inventory
- Couriers
- Notifications
- Courier Route View
- Not Found

Обязательные компоненты:
- sidebar navigation
- topbar
- KPI cards
- data tables
- status badges
- filters/search
- order details drawer or modal
- route details panel
- low stock alert widget
- charts for KPI
- map panel or route visualization block

Обязательные сценарии:
1. Логин через выбор роли:
   - Admin
   - Dispatcher
   - Warehouse Manager
   - Courier
2. Dashboard:
   - KPI cards
   - график заказов/доставок
   - active routes
   - low stock alerts
   - delayed deliveries
3. Orders:
   - список заказов
   - фильтрация по статусу и приоритету
   - просмотр деталей
   - назначение на маршрут
4. Routes:
   - список маршрутов
   - маршрут с остановками
   - recommended route preview
5. Inventory:
   - остатки
   - low stock alerts
   - restock recommendation
6. Courier View:
   - список назначенных доставок
   - кнопки смены статуса
7. Notifications:
   - системные уведомления

Технические требования:
- Вынеси API client в отдельный модуль.
- Используй TanStack Query для загрузки данных.
- Добавь мок-обработку ошибок и loading states.
- Добавь типы для сущностей.
- Используй компонентный подход.
- Не усложняй state management без необходимости.
- Ориентируйся на хорошо структурированный код, пригодный для анализа в лабораторной.

Что важно:
- Сделай frontend интегрированным с backend API.
- Если backend endpoint ещё не определён, предложи минимально необходимый контракт и сразу используй его.
- Не делай “красивый, но пустой” интерфейс — UI должен работать с реальными данными.

Что хочу получить:
1. Полный код frontend.
2. Структуру каталогов.
3. Настройки Tailwind.
4. env.example.
5. Инструкцию запуска.
6. Список улучшений для второй версии.
7. Краткий self-review: какие места в UI могут потребовать ручной доработки.

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