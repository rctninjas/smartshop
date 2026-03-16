# Жизненный цикл заказа (MVP)

## Статус выполнения

- Статус документа: `done`
- Последнее обновление: `2026-03-15`
- Задачи:
  - [x] Зафиксировать целевые статусы заказа по ТЗ.
  - [x] Зафиксировать разрешенные переходы статусов.
  - [x] Зафиксировать side effects на каждом переходе.
  - [x] Зафиксировать SLA/таймер автоархивации.
  - [x] Зафиксировать требования к трек-номеру для `shipped`.

## Цель

Зафиксировать однозначную state machine заказа для API и админки.

## Scope

- Статусы заказа.
- Правила переходов.
- Технические триггеры и проверки.

## Ключевые решения

- Статусы MVP:
  - `created`
  - `paid`
  - `archived` (если не оплачен в течение 20 минут)
  - `shipped` (обязательно с `trackNumber`)
  - `delivered`

## Базовые переходы

- `created -> paid`
- `created -> archived` (по таймеру)
- `paid -> shipped` (требуется track number)
- `shipped -> delivered`

## Запрещенные переходы

- Любой переход из `archived` в другой статус.
- `created -> shipped` и `created -> delivered`.
- `paid -> delivered` (нужно пройти `shipped`).
- `delivered -> *` (финальный статус).

## Технические требования к автоматике

- Планировщик проверяет неоплаченные заказы каждые 1 минуту.
- Если `created` старше 20 минут и не `paid`, перевод в `archived`.
- Переход в `shipped` запрещен без валидного `trackNumber`.
- Изменение публикации товара в каталоге не влияет на уже созданные `order_items` (исторический snapshot сохраняется).

## Side effects по переходам

- `created -> paid`
  - запись в `order_status_history`;
  - фиксация `paidAt`;
  - событие `order.paid`.
- `created -> archived`
  - запись в `order_status_history` с причиной `payment_timeout`;
  - событие `order.archived`.
- `paid -> shipped`
  - обязательная валидация `trackNumber`;
  - запись `shippedAt`, сохранение `trackNumber`;
  - событие `order.shipped`.
- `shipped -> delivered`
  - запись `deliveredAt`;
  - событие `order.delivered`.

## SLA и идемпотентность

- Архивация по timeout выполняется идемпотентно (повторный запуск не меняет archived заказ).
- Конкурентные обновления статуса защищаются optimistic check по текущему статусу.
- Любой невалидный переход возвращает `409 ORDER_INVALID_STATUS_TRANSITION`.

## Out of scope

- Возвраты, частичные возвраты, отмены после оплаты.
- Сложные подпроцессы fulfillment и SLA перевозчиков.

## Связанные документы

- [Начальный технический план](001-initial-plan.md)
- [API контракты](003-api-contracts.md)
- [Error handling](007-error-handling.md)
