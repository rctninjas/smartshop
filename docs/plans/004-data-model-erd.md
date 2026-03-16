# Модель данных и ERD (catalog/categories/orders)

## Статус выполнения

- Статус документа: `done`
- Последнее обновление: `2026-03-16`
- Задачи:
  - [x] Зафиксировать итоговый список таблиц/коллекций.
  - [x] Зафиксировать связи и ключи.
  - [x] Зафиксировать индексы и уникальные ограничения.
  - [x] Зафиксировать стратегию soft delete.
  - [x] Зафиксировать audit поля во всех доменных сущностях.
  - [x] Зафиксировать поля и индексы для управления публикацией товара.

## Статус реализации в коде

- `done`: Prisma schema содержит ключевые сущности `categories`, `products`, `orders`.
- `done`: Поля публикации товара (`isPublished`, `publishedAt`, `publishedBy`) реализованы.
- `in_progress`: части модели для advanced stock/attributes/order history будут уточняться по мере реализации доменов.

## Цель

Определить устойчивую модель хранения данных для модулей `catalog`, `categories`, `orders`.

## Scope

- Концептуальная ERD.
- Обязательные поля сущностей.
- Ограничения целостности.
- Базовые требования для реализации через `PostgreSQL + Prisma`.

## Ключевые сущности

- `categories`
- `products`
- `product_images`
  - `url` (основной URL для отображения)
  - `originalUrl` (оптимизированный original WebP)
  - `smUrl` (превью 320)
  - `mediumUrl` (превью 768)
- `product_variants`
- `stock_items`
- `category_attribute_schemas`
- `category_attribute_fields`
- `orders`
- `order_items`
- `order_status_history`

## Концептуальные связи

- `categories` (parent) 1:N `categories` (children, max depth 2)
- `categories` 1:N `products`
- `products` 1:N `product_images`
- `products` 1:N `product_variants`
- `product_variants` 1:1 `stock_items`
- `categories` 1:N `category_attribute_schemas`
- `category_attribute_schemas` 1:N `category_attribute_fields`
- `orders` 1:N `order_items`
- `orders` 1:N `order_status_history`

## Обязательные технические поля

- `id`
- `createdAt`
- `updatedAt`
- `deletedAt` (для soft delete, где применимо)
- `createdBy` / `updatedBy` (для админских изменений, где применимо)

### Дополнительно для `products`

- `isPublished` (boolean, default `false`, indexed)
- `publishedAt` (nullable datetime)
- `publishedBy` (nullable)

## Ключевые поля и ограничения (Prisma-level intent)

- `categories`
  - `id` PK, `slug` UNIQUE
  - `parentId` FK nullable
  - CHECK: глубина не более 2 уровней (контролируется бизнес-логикой)
- `products`
  - `id` PK, `slug` UNIQUE
  - `itemNumber` VARCHAR(100) (внутренний артикул)
  - `categoryId` FK (category)
  - `sale` nullable (цена со скидкой)
  - `isPublished` DEFAULT `false`
  - INDEX: `(isPublished)`, `(categoryId)`, `(price)`
- `product_variants`
  - `productId` FK
  - `sku` UNIQUE
  - INDEX: `(productId)`, `(sku)`
- `stock_items`
  - `variantId` UNIQUE FK
  - `quantity` >= 0
- `category_attribute_schemas`
  - `categoryId` FK
  - UNIQUE: `(categoryId, version)`
- `category_attribute_fields`
  - `schemaId` FK
  - UNIQUE: `(schemaId, key)`
- `orders`
  - `id` PK
  - `status` INDEX
  - `createdAt` INDEX
- `order_items`
  - `orderId` FK
  - `productId` nullable FK (товар мог быть удален/скрыт)
  - snapshot-поля: `titleSnapshot`, `priceSnapshot`, `attributesSnapshot`
- `order_status_history`
  - `orderId` FK
  - INDEX: `(orderId, createdAt)`

## Soft delete стратегия

- `products`, `categories` — soft delete через `deletedAt`.
- Публичные и админ list endpoints по умолчанию исключают записи с `deletedAt != null`.
- Физическое удаление не используется в MVP.

## Audit стратегия

- Для admin write-операций заполняются `createdBy/updatedBy`.
- Для публикации товара дополнительно `publishedBy`.
- Для статусов заказа в `order_status_history` хранится `changedBy`.

## Ограничения и инварианты

- Категории: максимум 2 уровня вложенности.
- Товар относится к категории (включая root и категории с дочерними).
- `sale` (если задан) не превышает `price` и не является отрицательным (валидируется бизнес-логикой API).
- `itemNumber` обязателен и ограничен длиной до 100 символов.
- Разные цвета одного артикула ведутся как отдельные товары по процессному правилу контент-команды (без жёсткого DB/API-constraint).
- Версия схемы характеристик сохраняется в товаре.
- Заказной статус изменяется только по разрешенным переходам.
- Новый товар (ручной/импорт) создается с `isPublished=false`.
- Непубликованный товар не должен быть доступен витрине ни в списках, ни по прямой ссылке.

## Out of scope

- Финальная физическая схема конкретной СУБД.
- Миграции и DDL-скрипты.

## Связанные документы

- [Начальный технический план](001-initial-plan.md)
- [Спецификация характеристик товаров](002-product-attributes-schema.md)
- [Жизненный цикл заказа](005-order-lifecycle.md)
