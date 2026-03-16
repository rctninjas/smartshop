# Единый формат ошибок (admin + api)

## Статус выполнения

- Статус документа: `done`
- Последнее обновление: `2026-03-15`
- Задачи:
  - [x] Зафиксировать канонический JSON-формат ошибки.
  - [x] Зафиксировать маппинг доменных ошибок в HTTP-коды.
  - [x] Зафиксировать перечень error codes для каталог/категории/заказы.
  - [x] Зафиксировать требования к логированию и `requestId`.
  - [x] Зафиксировать UX-политику отображения ошибок в админке.

## Цель

Сделать предсказуемую обработку ошибок между API и админкой.

## Scope

- HTTP error payload.
- Error codes.
- Стандарты логирования и трассировки.

## Базовый формат ошибки (черновик)

```json
{
  "code": "ORDER_INVALID_STATUS_TRANSITION",
  "message": "Status transition is not allowed.",
  "details": {
    "from": "created",
    "to": "shipped"
  },
  "requestId": "req_123"
}
```

## Рекомендованный маппинг

- `400` — validation/input error
- `401` — unauthorized
- `403` — forbidden
- `404` — not found
- `409` — conflict/business invariant
- `422` — semantically invalid payload
- `500` — unexpected internal error

## Принципы

- Технические детали ошибки не раскрываются клиенту в production.
- Любая ошибка должна включать `code` и `requestId`.
- Доменные ошибки имеют стабильные, документированные коды.

## Каталог: error codes

- `CATALOG_PRODUCT_NOT_FOUND` (`404`)
- `CATALOG_PRODUCT_ALREADY_EXISTS` (`409`)
- `CATALOG_PRODUCT_NOT_PUBLISHED` (`404` для storefront)
- `CATALOG_INVALID_FILTER` (`400`)
- `CATALOG_BULK_PUBLISH_EMPTY_IDS` (`422`)

## Категории: error codes

- `CATEGORY_NOT_FOUND` (`404`)
- `CATEGORY_DEPTH_LIMIT_EXCEEDED` (`409`)
- `CATEGORY_CYCLE_DETECTED` (`409`)
- `CATEGORY_DELETE_HAS_ACTIVE_PRODUCTS` (`409`)
- `CATEGORY_SCHEMA_NOT_FOUND` (`404`)

## Заказы: error codes

- `ORDER_NOT_FOUND` (`404`)
- `ORDER_INVALID_STATUS_TRANSITION` (`409`)
- `ORDER_TRACK_REQUIRED` (`422`)
- `ORDER_PAYMENT_TIMEOUT_ARCHIVED` (`409`)
- `ORDER_INVALID_PAYLOAD` (`400`)

## Auth: error codes

- `AUTH_UNAUTHORIZED` (`401`)
- `AUTH_INVALID_CREDENTIALS` (`401`)
- `AUTH_FORBIDDEN` (`403`)

## Logging and tracing

- Каждый ответ с ошибкой содержит `requestId`.
- На сервере логируются: `requestId`, `code`, `status`, `path`, `method`.
- PII и секреты в логах маскируются (email/phone partially masked, password never logged).

## UX политика для админки

- `400/422`: показать validation message рядом с полями + toast summary.
- `401`: редирект на login page.
- `403`: показать экран "Недостаточно прав".
- `404`: показать not found state.
- `409`: показать бизнес-конфликт с рекомендацией действия.
- `500`: generic error message + retry action.

## Out of scope

- Централизованный external monitoring stack.
- Международная локализация текстов ошибок.

## Связанные документы

- [API контракты](003-api-contracts.md)
- [Жизненный цикл заказа](005-order-lifecycle.md)
