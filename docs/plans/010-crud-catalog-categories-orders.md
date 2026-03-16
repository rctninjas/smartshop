# План: Полноценные CRUD для Catalog/Categories/Orders

## Статус выполнения

- Статус документа: `in_progress`
- Последнее обновление: `2026-03-16`
- Задачи:
  - [ ] Реализовать полный CRUD Catalog в admin и расширить API-контракты (in_progress).
  - [ ] Реализовать CRUD Categories с управлением деревом и инвариантами (in_progress).
  - [ ] Реализовать операционный CRUD Orders (list/details/status transitions) (in_progress).
  - [ ] Вынести и переиспользовать общие CRUD-компоненты в `packages/ui`.
  - [ ] Покрыть smoke-тестами, унифицировать ошибки и обновить документацию.

## Статус реализации в коде

- `in_progress`: Для `catalog` добавлены страницы `new/edit`, серверные write handlers (`create/update/delete/publish`) и расширены DTO/API под variants/images.
- `done`: Поле `currency` убрано из UI-форм каталога; на API `create/update` валюта принудительно фиксируется в `RUB`.
- `in_progress`: Для `categories` добавлены страницы `new/edit`, endpoint `GET /api/categories/:id`, server handlers (`create/update/delete`) и UI-навигация по дереву.
- `in_progress`: Для `orders` добавлены фильтры списка, страница деталей заказа и server handler обновления статуса.

## Цель

Довести модули `catalog`, `categories`, `orders` до полноценного операционного уровня в админке: отдельные `list/create/edit/view` сценарии, серверные валидации, единые ошибки и защищенные write-операции.

## Что переиспользуем

- API-модули и текущие эндпоинты:
  - [apps/api/src/modules/catalog/index.ts](../../apps/api/src/modules/catalog/index.ts)
  - [apps/api/src/modules/categories/index.ts](../../apps/api/src/modules/categories/index.ts)
  - [apps/api/src/modules/orders/index.ts](../../apps/api/src/modules/orders/index.ts)
- Админ foundation и auth-guard:
  - [apps/admin/proxy.ts](../../apps/admin/proxy.ts)
  - [apps/admin/src/shared/ui/admin-shell.tsx](../../apps/admin/src/shared/ui/admin-shell.tsx)
- Shared contracts:
  - [packages/types/src/index.ts](../../packages/types/src/index.ts)

## Границы и архитектура

- Сохраняем feature-first: `apps/admin/src/features/<domain>/{api,model,ui,index.ts}`.
- UI-компоненты остаются презентационными; оркестрация API и состояний — в `model` и server route handlers.
- Избегаем cross-feature импортов; общие таблицы/формы/пагинация выносятся в `packages/ui`.

## Этап 1: Catalog full CRUD

- Добавить страницы:
  - `app/(dashboard)/catalog/page.tsx` (list)
  - `app/(dashboard)/catalog/new/page.tsx` (create)
  - `app/(dashboard)/catalog/[id]/page.tsx` (view/edit)
- Расширить API-клиент фичи `catalog`:
  - list с фильтрами/сортировкой/пагинацией,
  - create/update/delete,
  - publish/unpublish,
  - bulk publish.
- Добавить форму товара:
  - базовые поля, `itemNumber` (внутренний артикул, до 100 символов), `price` (текущая цена), `sale` (цена со скидкой, опционально), category, публикация,
  - variants (`size/color/stock`), images (мультизагрузка + drag-and-drop + preview + хранение original/sm/medium).
- На API: расширить DTO/валидацию payload для variants/images, унифицировать 4xx ответы.

## Этап 2: Categories full CRUD + tree operations

- Добавить страницы:
  - `app/(dashboard)/categories/page.tsx` (tree + list actions)
  - `app/(dashboard)/categories/new/page.tsx`
  - `app/(dashboard)/categories/[id]/page.tsx`
- Добавить create/edit/delete формы с проверкой инвариантов:
  - глубина <= 2,
  - запрет циклов,
  - запрет удаления при активных товарах/детях.
- Добавить операции reorder/sortOrder в UI (минимум: числовой порядок с сохранением).
- Привести ошибки `categories` к единому контракту и понятным admin-messages.

## Этап 3: Orders operational CRUD

- Добавить страницы:
  - `app/(dashboard)/orders/page.tsx` (list + filters)
  - `app/(dashboard)/orders/[id]/page.tsx` (details + actions)
- Реализовать в UI:
  - фильтры по статусу/дате/search,
  - карточку заказа с item-строками и customer/delivery/payment блоками,
  - изменение статуса через разрешенные переходы,
  - обязательный `trackNumber` при `shipped`.
- На API: усилить schema validation для status update/create, единая обработка конфликтов (409) и бизнес-ошибок (422).

## Этап 4: Shared UI и переиспользование

- Добавить/расширить в `packages/ui`:
  - data-table (`head/body/actions`),
  - pagination, filters-bar,
  - form-field wrappers, confirm dialog, status badge.
- Подключить эти компоненты во всех трех модулях вместо локальных дубликатов.

## Этап 5: Стабилизация и качество

- Добавить integration smoke API для `catalog/categories/orders`.
- Добавить admin smoke e2e:
  - login,
  - create/edit/delete item,
  - status transition in orders.
- Довести loading/empty/error состояния во всех CRUD-экранах.
- Обновить docs:
  - [docs/plans/009-full-admin-panel.md](009-full-admin-panel.md)
  - [docs/plans/003-api-contracts.md](003-api-contracts.md)

## Критерии готовности

- `Catalog`: create/edit/delete + publish/bulk publish работают из UI.
- `Categories`: полное управление деревом с соблюдением инвариантов.
- `Orders`: list/details/status actions работают, правила переходов соблюдаются.
- Все write-операции проходят через auth-guard, ошибки консистентны.
- `typecheck`, `lint`, Docker smoke — зеленые.
