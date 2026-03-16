# План: Полная миграция admin на shadcn/ui

## Статус выполнения

- Статус документа: `in_progress`
- Последнее обновление: `2026-03-16`
- Задачи:
  - [x] Поднять базовую инфраструктуру (`tailwindcss`, `postcss`, `components.json`, shadcn-style primitives).
  - [x] Перевести ключевые страницы и формы (`catalog`, `categories`, `orders`, `customers`) на shadcn-подход.
  - [x] Перевести shell/layout и базовые UI-состояния на shadcn-паттерны.
  - [ ] Довести remaining polish: консистентные spacing/typography и доп. компоненты (`dialog`, `dropdown`, `tabs` при необходимости).
  - [ ] Провести ручной UX smoke-проход по всем CRUD-флоу.

## Цель

Перевести админ-панель на полноценный `shadcn/ui` baseline без legacy-CSS паттернов MVP.

## Что реализовано в этой итерации

- Добавлены зависимости и конфиги для shadcn-базы в `apps/admin`.
- Добавлены reusable primitives в `apps/admin/src/shared/ui`:
  - `button`, `input`, `textarea`, `label`, `select`, `badge`, `alert`, `card`, `table`.
- Переведены экраны и фичи:
  - `catalog`, `categories`, `orders`, `customers`,
  - `login`,
  - `admin-shell`.
- Переведены `empty/error/success` состояния с единым визуальным паттерном.

## Критерии завершения

- Все основные экраны админки используют shadcn-style primitives.
- В коде нет зависимости от старых class-based MVP-паттернов (`data-table`, `crud-form`, `page-actions`).
- `typecheck` и `lint` зеленые.
