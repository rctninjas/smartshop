# Полноценная админ-панель интернет-магазина

## Статус выполнения

- Статус документа: `in_progress`
- Последнее обновление: `2026-03-16`
- Задачи:
  - [x] Foundation админ-панели: layout, маршруты, auth-guard, shared UI.
  - [ ] Модуль `catalog`: полный CRUD, фильтры, пагинация, bulk-операции.
  - [ ] Модуль `categories`: дерево 2 уровней и атрибутные схемы.
  - [ ] Модуль `orders`: список, карточка, переходы статусов, трекинг.
  - [ ] Модуль `customers`: API + UI + история заказов (выполнен базовый список и карточка; доработка in_progress).
  - [ ] Стабилизация: единые ошибки, smoke-тесты, loading/error states, документация.

## Статус реализации в коде

- `done`: Введен auth-guard для админ-маршрутов через `proxy.ts` + страница входа `login`.
- `done`: Добавлен dashboard shell (sidebar + навигация + logout) и route-based структура разделов.
- `done`: Добавлен API-модуль `customers` (`GET /api/customers`, `GET /api/customers/:email/orders`).
- `done`: Добавлен UI-модуль `customers` (список + страница клиента с историей заказов).
- `in_progress`: Для `catalog/categories/orders` начата CRUD-реализация (новые create/edit/detail страницы и server write handlers), требуется доведение до полного операционного объема.

## Цель релиза

Реализовать полноценную админ-панель для операционного управления интернет-магазином: `catalog`, `categories`, `orders`, `customers`, с production-ready API/UI и воспроизводимым Docker-запуском.

## Scope

- Полноценные экраны и бизнес-сценарии админки для модулей:
  - `catalog`
  - `categories`
  - `orders`
  - `customers`
- Расширение API-контрактов и моделей данных под эти сценарии.
- Доведение UX-состояний (`loading`, `empty`, `error`) и базовой надежности/тестируемости.

## Что переиспользуем из текущей реализации

- API bootstrap, middleware и текущие доменные модули:
  - [apps/api/src/app.ts](../../apps/api/src/app.ts)
  - [apps/api/src/modules/catalog/index.ts](../../apps/api/src/modules/catalog/index.ts)
  - [apps/api/src/modules/categories/index.ts](../../apps/api/src/modules/categories/index.ts)
  - [apps/api/src/modules/orders/index.ts](../../apps/api/src/modules/orders/index.ts)
- Shared DTO/типы:
  - [packages/types/src/index.ts](../../packages/types/src/index.ts)
- Базовые фичи админки:
  - [apps/admin/src/features/catalog](../../apps/admin/src/features/catalog)
  - [apps/admin/src/features/categories](../../apps/admin/src/features/categories)
  - [apps/admin/src/features/orders](../../apps/admin/src/features/orders)

## Ключевые решения

- Сохраняем feature-first архитектуру:
  - `apps/admin/src/features/*`
  - `apps/api/src/modules/*`
- UI остается презентационным; бизнес-логика уходит в `model/api/services`.
- Общие UI-паттерны выносятся в `packages/ui` (таблицы, фильтры, формы, пагинация, confirm dialogs).
- Контракты и ошибки унифицируются через `packages/types` и `007-error-handling.md`.
- Для SSR-запросов админки в Docker используется внутренний URL API (`API_INTERNAL_URL`).
- Все пользовательские тексты в UI админки — на русском языке.

## Этапы реализации

## 1) Foundation админки

- Собрать каркас маршрутизации админ-панели:
  - `apps/admin/app/(dashboard)/catalog/*`
  - `apps/admin/app/(dashboard)/categories/*`
  - `apps/admin/app/(dashboard)/orders/*`
  - `apps/admin/app/(dashboard)/customers/*`
- Добавить общие layout-компоненты (sidebar/topbar/breadcrumbs).
- Подключить middleware-проверку админ-сессии на защищенные страницы.

## 2) Catalog

- Реализовать полный CRUD товаров.
- Добавить таблицу каталога с серверными фильтрами, сортировкой, пагинацией.
- Добавить bulk-операции публикации/снятия с публикации.
- Реализовать форму товара: цена, SKU, размеры, цвета, атрибуты, публикация, изображения.
  - Обязательное поле товара: `itemNumber` (внутренний артикул, максимум 100 символов).
  - В форме товара обязательны `price` (текущая цена) и опциональный `sale` (цена со скидкой).
  - Правило цветов фиксируется как организационное: разные цвета ведутся отдельными товарами.
  - Ошибки валидации отображаются у конкретных полей, и введённые пользователем значения не сбрасываются при неуспешной отправке.
  - Для изображений поддерживается мультизагрузка, drag-and-drop зона, preview в форме, индикатор прогресса загрузки и автогенерация `sm`/`medium` + optimized original.

## 3) Categories

- Реализовать полнофункциональное дерево категорий (2 уровня).
- Добавить create/edit/delete с защитой инвариантов.
- Реализовать управление схемами характеристик по категориям (версионирование по согласованной схеме).

## 4) Orders

- Реализовать список заказов с фильтрами (`status/date/search`) и пагинацией.
- Добавить карточку заказа с полной детализацией (позиции, суммы, клиент, доставка, оплата).
- Реализовать операционный workflow статусов и обязательный `trackNumber` для `shipped`.

## 5) Customers

- Добавить API-модуль `customers`:
  - список клиентов,
  - карточка клиента,
  - агрегаты (`ordersCount`, `LTV`, `lastOrderAt`).
- Расширить `Prisma` модель клиента и связи с заказами.
- Реализовать UI списка и карточки клиента с историей заказов.

## 6) Stabilization

- Унифицировать обработку ошибок во всех admin/api модулях.
- Добавить интеграционные smoke-тесты API (`catalog/categories/orders/customers`).
- Добавить базовые e2e smoke для админки.
- Финализировать документацию и чеклисты запуска в Docker.

## Критерии готовности

- В админке доступны рабочие разделы `Catalog`, `Categories`, `Orders`, `Customers`.
- Ключевые CRUD и операционные сценарии выполняются через API без заглушек.
- Все write-операции защищены auth.
- Ошибки и UX-состояния отображаются консистентно.
- Запуск и проверка через Docker воспроизводимы по документации.

## Out of scope

- Полноценный RBAC и мультиаккаунтная админ-модель.
- Реальные интеграции платежных/логистических провайдеров.
- Продвинутая BI-аналитика и конструктор отчетов.

## Связанные документы

- [Оглавление документации](000-contents-read-first.md)
- [Технические требования](000-tech-requirements.md)
- [Начальный технический план](001-initial-plan.md)
- [Спецификация характеристик товаров](002-product-attributes-schema.md)
- [API контракты](003-api-contracts.md)
- [Аутентификация админки (MVP)](006-admin-auth-mvp.md)
- [Единый формат ошибок](007-error-handling.md)
