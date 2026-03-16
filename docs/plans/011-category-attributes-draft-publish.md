# План: Свойства товара в категории (draft->publish)

## Статус выполнения

- Статус документа: `in_progress`
- Последнее обновление: `2026-03-16`
- Задачи:
  - [x] Добавить Prisma модели схем характеристик и shared DTO/types.
  - [x] Реализовать API draft/publish для схем характеристик категорий.
  - [x] Добавить структурный UI-конструктор полей в категории.
  - [x] Интегрировать active schema в форму товара и серверную валидацию.
  - [ ] Добавить smoke-проверки и синхронизировать документацию.

## Цель

Добавить в админку и API управление схемами характеристик по категориям: создание полей, выбор типа значения, публикация версии схемы и валидация атрибутов товара по активной версии.

## Что уже используем

- Спецификация: [docs/plans/002-product-attributes-schema.md](002-product-attributes-schema.md)
- CRUD-контекст: [docs/plans/010-crud-catalog-categories-orders.md](010-crud-catalog-categories-orders.md)
- API категории: [apps/api/src/modules/categories/index.ts](../../apps/api/src/modules/categories/index.ts)
- Product storage: [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma)
- Category edit page (точка расширения): `apps/admin/app/(dashboard)/categories/[id]/page.tsx`

## Этап 1: Data model и shared contracts

- Добавить модели Prisma:
  - `CategoryAttributeSchema` (`id`, `categoryId`, `version`, `status`, `fieldsJson`, timestamps)
  - индекс уникальности на (`categoryId`, `version`)
  - ограничение 1 `draft` на категорию (на уровне сервиса/валидации)
- Добавить в `packages/types`:
  - `CategoryAttributeFieldType`
  - `CategoryAttributeFieldDto`
  - `CategoryAttributeSchemaDto`
  - команды `createDraft`, `publishDraft`, `updateDraft`

## Этап 2: API для схем характеристик

- В `apps/api/src/modules/categories/index.ts` добавить endpoints:
  - `GET /api/categories/:id/attributes/schema` (active + draft)
  - `POST /api/categories/:id/attributes/schema/draft` (создать draft, если нет)
  - `PATCH /api/categories/:id/attributes/schema/draft` (обновить поля)
  - `POST /api/categories/:id/attributes/schema/publish` (инкремент версии, статус active)
- Реализовать серверную валидацию полей:
  - `key` уникален в схеме
  - `type` из enum
  - `select/multiselect` требуют `options[]`
  - `required` булево

## Этап 3: UI-конструктор полей в категории

- Добавить компоненты:
  - `attributes-schema-editor.tsx` (список полей)
  - `attribute-field-form.tsx` (создание/редактирование поля)
- На странице `categories/[id]` добавить блок "Характеристики":
  - кнопка "Добавить поле"
  - выбор типа (`text|number|boolean|select|multiselect`)
  - ввод `key`, `label`, `required`, `options`
  - кнопки `Save Draft` и `Publish`
- Добавить read-only отображение active версии и индикатор `draft changes`.

## Этап 4: Интеграция в форму товара (catalog)

- В форму товара загрузить active schema выбранной категории.
- Рендерить динамические поля атрибутов по type.
- При submit передавать `attributesSnapshot` + `schemaVersion`.
- В API каталога валидировать атрибуты товара против активной/указанной версии схемы.

## Этап 5: Качество и документация

- Добавить smoke checks:
  - create draft
  - add field of each type
  - publish
  - create/update product with valid/invalid attributes
- Обновить docs:
  - [docs/plans/002-product-attributes-schema.md](002-product-attributes-schema.md)
  - [docs/plans/010-crud-catalog-categories-orders.md](010-crud-catalog-categories-orders.md)
  - [docs/plans/000-contents-read-first.md](000-contents-read-first.md)

## Критерии готовности

- В категории можно создать поле, выбрать тип значения, сохранить draft и опубликовать.
- После publish у категории есть активная версия схемы.
- Форма товара строится из active schema и не принимает невалидные атрибуты.
- Исторические товары остаются валидными на своей версии схемы.
