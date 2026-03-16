# Аутентификация админки (MVP)

## Статус выполнения

- Статус документа: `done`
- Последнее обновление: `2026-03-15`
- Задачи:
  - [x] Зафиксировать способ аутентификации (session/JWT).
  - [x] Зафиксировать формат login/logout endpoint.
  - [x] Зафиксировать срок жизни сессии и refresh policy.
  - [x] Зафиксировать middleware для защиты admin routes.
  - [x] Зафиксировать требования к хранению секретов и cookie flags.

## Цель

Обеспечить минимально безопасный вход в админку для одного админ-аккаунта на старте.

## Scope

- Login/logout.
- Защита маршрутов админки.
- Проверка прав для admin-only API endpoint.

## Ключевые решения

- На первой итерации используется один админ-аккаунт.
- Любой write endpoint в API требует auth проверки.
- Данные аутентификации не хранятся в presentation-компонентах.
- Способ входа: логин/пароль, пароль задается через environment variables.
- Модель сессии: cookie-based session.

## ENV переменные (MVP)

- `ADMIN_LOGIN`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_SESSION_TTL_MINUTES` (default: `480`)

## API контракты auth

- `POST /api/admin/auth/login`
  - Body: `{ login: string; password: string }`
  - Success: `204` + установка HttpOnly session cookie
  - Error: `401 AUTH_INVALID_CREDENTIALS`
- `POST /api/admin/auth/logout`
  - Success: `204` + очистка session cookie
- `GET /api/admin/auth/me`
  - Success: `200 { login: string }`
  - Error: `401 AUTH_UNAUTHORIZED`

## Session policy

- Session cookie: `HttpOnly`, `Secure` (production), `SameSite=Lax`, `Path=/`.
- TTL по умолчанию: 8 часов (`480` минут).
- Sliding session: продление TTL при активной работе.
- Refresh token в MVP не используется.

## Middleware policy

- Все admin routes в `apps/admin` закрываются middleware-проверкой сессии.
- Все API операции изменения данных (`POST/PATCH/DELETE`) требуют валидной admin session.
- Read-only storefront endpoints не требуют admin session.

## Минимальные требования безопасности

- Только HTTPS в production.
- HttpOnly cookie для токена/сессии.
- `SameSite=Lax` или строже.
- Секреты и ключи только через environment variables.
- Базовый rate limiting на login endpoint.
- Сравнение пароля выполняется в constant-time.
- Логирование не должно содержать значение `ADMIN_PASSWORD`.

## Out of scope

- RBAC с несколькими ролями.
- OAuth/SSO провайдеры.
- MFA.

## Связанные документы

- [Начальный технический план](001-initial-plan.md)
- [API контракты](003-api-contracts.md)
- [Error handling](007-error-handling.md)
