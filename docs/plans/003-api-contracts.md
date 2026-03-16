# API контракты (admin + api)

## Статус выполнения

- Статус документа: `done`
- Последнее обновление: `2026-03-16`
- Задачи:
  - [x] Зафиксировать полный OpenAPI-контракт для `catalog`.
  - [x] Зафиксировать полный OpenAPI-контракт для `categories`.
  - [x] Зафиксировать полный OpenAPI-контракт для `orders`.
  - [x] Зафиксировать единый error response contract.
  - [x] Согласовать payload-формат пагинации/сортировки/фильтров.
  - [x] Зафиксировать контракт публикации товара (single + bulk).

## Статус реализации в коде

- `done`: `catalog` admin endpoints + storefront read endpoints.
- `done`: `categories` tree + CRUD с бизнес-ограничениями.
- `done`: `orders` endpoints + статусные переходы + валидация `trackNumber` + автоархив неоплаченных.

## Цель

Синхронизировать интерфейс между `apps/admin` и `apps/api` через однозначные HTTP-контракты.

## Scope

- REST endpoints для доменов `catalog`, `categories`, `orders`.
- Request/response DTO, HTTP-коды, ошибки, пагинация, фильтры, сортировки.

## Ключевые решения

- Базовый префикс API: `/api`.
- Ответы list endpoints включают пагинацию: `items`, `page`, `pageSize`, `total`.
- Для create/update используется schema validation на API стороне.
- Ошибки возвращаются в едином формате (см. `007-error-handling.md`).
- Товар создается с `isPublished=false` по умолчанию (ручное создание и импорт).
- В storefront API возвращаются только `isPublished=true`.
- Для `isPublished=false` endpoint карточки storefront возвращает `404`.

## Общие типы response

- `PaginatedResponse<T>`
  - `items: T[]`
  - `page: number`
  - `pageSize: number`
  - `total: number`
- `ApiErrorResponse` — см. `007-error-handling.md`

## Каталог

### Product DTO (admin)

- `id: string`
- `title: string`
- `itemNumber: string` (внутренний артикул, максимум 100 символов)
- `slug: string`
- `categoryId: string`
- `description: string`
- `price: number`
- `sale: number | null`
- `currency: 'RUB'`
- `sizes: string[]`
- `colors: string[]`
- `attributes: Record<string, unknown>`
- `isPublished: boolean` (default `false`)
- `publishedAt: string | null`
- `publishedBy: string | null`
- `createdAt: string`
- `updatedAt: string`

### Endpoints (admin)

- `GET /api/catalog`
  - Query:
    - `page`, `pageSize`
    - `categoryId`
    - `size`
    - `color`
    - `priceFrom`, `priceTo`
    - `isPublished`
    - `sortBy` (`price` | `createdAt` | `updatedAt`)
    - `sortOrder` (`asc` | `desc`)
  - Response: `PaginatedResponse<ProductDto>`
- `GET /api/catalog/:id`
  - Response: `ProductDto`
- `POST /api/catalog`
  - Body (минимум): `title`, `itemNumber`, `slug`, `categoryId`, `price`
  - Rule: `currency` всегда фиксируется как `RUB` на API стороне
  - Rule: `itemNumber` обязателен, длина `1..100`
  - Rule: `sale` опционален; если передан, то должен быть `>= 0` и `<= price`
  - Rule: `isPublished=false` если поле не передано
  - Response: `201 ProductDto`
- `PATCH /api/catalog/:id`
  - Body: частичное обновление полей `ProductDto`
  - Rule: если `sale` передан, он валидируется как `>= 0` и `<= актуального price`
  - Response: `ProductDto`
- `DELETE /api/catalog/:id`
  - Response: `204`
- `PATCH /api/catalog/:id/publish`
  - Body: `{ isPublished: boolean }`
  - Rule: при `true` заполняются `publishedAt`, `publishedBy`; при `false` обнуляются
  - Response: `ProductDto`
- `POST /api/catalog/bulk/publish`
  - Body: `{ ids: string[]; isPublished: boolean }`
  - Response: `{ updated: number }`

### Endpoints (storefront read model)

- `GET /api/storefront/catalog`
  - Возвращает только `isPublished=true`
- `GET /api/storefront/catalog/:slug`
  - Для непубликованных товаров: `404`

## Категории

### Category DTO

- `id: string`
- `name: string`
- `slug: string`
- `parentId: string | null`
- `sortOrder: number`
- `isActive: boolean`
- `createdAt: string`
- `updatedAt: string`

### Endpoints

- `GET /api/categories/tree`
  - Response: `CategoryTreeNode[]`
- `POST /api/categories`
  - Body: `name`, `slug`, `parentId?`, `sortOrder?`
  - Rule: глубина не более 2 уровней
- `PATCH /api/categories/:id`
  - Body: частичное обновление
- `DELETE /api/categories/:id`
  - Rule: запрет удаления при наличии активных товаров
  - Response: `204`

## Заказы

### Order DTO

- `id: string`
- `status: 'created' | 'paid' | 'archived' | 'shipped' | 'delivered'`
- `customer`
  - `name: string`
  - `phone: string`
  - `email: string`
- `delivery`
  - `method: 'cdek' | 'russian_post'`
  - `address: string`
  - `trackNumber: string | null`
- `payment`
  - `method: 'on_receipt' | 'online'`
  - `isPaid: boolean`
- `items: OrderItemDto[]`
- `amountTotal: number`
- `createdAt: string`
- `updatedAt: string`

### Endpoints

- `GET /api/orders`
  - Query:
    - `page`, `pageSize`
    - `status`
    - `createdFrom`, `createdTo`
    - `search` (email/phone/orderId)
  - Response: `PaginatedResponse<OrderDto>`
- `GET /api/orders/:id`
  - Response: `OrderDto`
- `POST /api/orders`
  - Body: checkout payload
  - Response: `201 OrderDto`
- `PATCH /api/orders/:id/status`
  - Body: `{ status: OrderStatus; trackNumber?: string }`
  - Rule: `trackNumber` обязателен для `status=shipped`
  - Response: `OrderDto`

## Коды ответа (базово)

- `200`, `201`, `204`
- `400`, `401`, `403`, `404`, `409`, `422`, `500`

## Out of scope

- Реализация transport-level versioning API.
- Публичный storefront API contract (если будет отличаться от admin contract).

## Связанные документы

- [Начальный технический план](001-initial-plan.md)
- [Спецификация характеристик товаров](002-product-attributes-schema.md)
- [Error handling](007-error-handling.md)
