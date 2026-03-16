---
name: shadcn-admin-patterns
description: Используй для создания и рефакторинга админских интерфейсов на базе shadcn/ui с едиными паттернами таблиц, форм, фильтров, drawer/modal и разделением presentation и business logic.
---

# Shadcn Admin Patterns

## Проектный контекст (Smartshop)
- Админка реализуется на `Next.js 16`.
- Базовая UI-библиотека: `shadcn/ui`.
- Основные домены админки: `catalog`, `categories`, `orders`.
- Использовать паттерны из документов:
  - `docs/plans/000-tech-requirements.md`
  - `docs/plans/001-initial-plan.md`
  - `docs/plans/002-product-attributes-schema.md`

## Когда использовать
Используй этот skill, когда нужно:
- создавать или рефакторить админские страницы;
- строить таблицы, формы, фильтры, модалки, drawer, toolbar и bulk actions;
- приводить UI к единым соглашениям проекта;
- выносить переиспользуемые паттерны в shared UI-слой.

## Основные правила

### 1. Базовый UI только через shared слой
- Все базовые primitives и UI-обертки должны использоваться через `packages/ui`.
- Не создавать локальные дубликаты `button`, `input`, `dialog`, `table`, `select`, `sheet`, `tabs`, `badge` и т.д.
- Если нужного shared-компонента не хватает, сначала предложить добавить его в `packages/ui`.

### 2. UI без бизнес-логики
- UI-компоненты отвечают только за presentation.
- Не размещать внутри UI-компонентов:
  - API-вызовы;
  - data fetching;
  - преобразование доменных моделей;
  - permissions logic;
  - side effects;
  - routing orchestration;
  - mutation handling.
- Всё это выносить в container-компоненты, hooks, server actions, services или feature-слой.

### 3. Сначала переиспользование, потом новый паттерн
Перед созданием нового паттерна всегда проверять:
1. можно ли использовать существующий shared-компонент;
2. можно ли собрать решение композицией;
3. можно ли расширить существующий API без дублирования.

### 4. Единые паттерны для админки
Предпочитай следующие шаблоны:

#### Таблицы
- Отдельно выделять:
  - `PageHeader`
  - `FiltersBar`
  - `DataTable`
  - `BulkActionsBar`
  - `Pagination`
- Колонки описывать декларативно.
- Состояния `loading`, `empty`, `error` и `success` должны быть явными.
- Действия строки (`edit`, `delete`, `open`, `duplicate`) должны быть стандартизированы.

#### Формы
- Использовать единый подход к form state и validation.
- Поля формы должны быть composable и переиспользуемыми.
- Ошибки, help text, label, required state и disabled state должны отображаться единообразно.
- Сабмит и cancel actions должны иметь предсказуемое расположение.

#### Модалки и drawer
- Для коротких подтверждений использовать `Dialog`.
- Для длинных форм и сложного редактирования предпочитать `Sheet`/drawer, если это соответствует текущему UX проекта.
- У всех modal/drawer паттернов должны быть единые секции:
  - title
  - description
  - content
  - footer actions

### 5. Naming conventions
Предпочитать понятные и предсказуемые имена:
- `UsersTable`
- `UserFilters`
- `UserForm`
- `CreateUserDialog`
- `EditUserSheet`
- `DeleteUserDialog`
- `UserStatusBadge`

Для текущих доменов Smartshop предпочитать:
- `ProductsTable`
- `ProductFilters`
- `ProductForm`
- `CategoryTree`
- `CategoryForm`
- `OrdersTable`
- `OrderStatusBadge`
- `OrderDetailsSheet`

Избегать слишком общих имен:
- `TableThing`
- `ModalWrapper`
- `CustomInput2`

### 6. Структура кода
Если делаешь новую feature, предпочитай структуру вида:

- `features/users/components/users-table.tsx`
- `features/users/components/user-filters.tsx`
- `features/users/components/user-form.tsx`
- `features/users/components/create-user-dialog.tsx`
- `features/users/hooks/use-users-table.ts`
- `features/users/lib/user-table-columns.ts`
- `features/users/actions/create-user.ts`

Если компонент становится общим, переноси его в `packages/ui` или в shared feature-layer.

Для Smartshop можно использовать те же паттерны:
- `features/catalog/components/products-table.tsx`
- `features/catalog/components/product-form.tsx`
- `features/categories/components/category-tree.tsx`
- `features/orders/components/orders-table.tsx`
- `features/orders/components/order-details-sheet.tsx`
- `features/orders/lib/order-table-columns.ts`

## Как отвечать
Когда пользователь просит создать UI:
1. Сначала проверь, можно ли переиспользовать существующие primitives и паттерны.
2. Предложи структуру из небольших composable-компонентов.
3. Держи business logic вне presentation components.
4. Следуй стилю `shadcn/ui`.
5. Не дублируй уже существующие patterns.
6. Если создаешь новый shared-паттерн, делай его достаточно универсальным.

## Что генерировать по умолчанию
Для типовой admin page предлагай состав:
- page shell
- header
- filters bar
- data table
- pagination
- empty state
- loading state
- create/edit dialog or sheet

## Антипаттерны
Избегай:
- огромных компонентов на 300+ строк, смешивающих UI и логику;
- локальных копий shared UI primitives;
- inline domain logic в JSX;
- несогласованных variants и spacing;
- дублирования form/table/modal шаблонов между фичами.

## Предпочтительный стиль
- Composition-first
- Small reusable components
- Predictable props API
- Consistent admin UX
- Shared UI before local one