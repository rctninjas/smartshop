# Deployment через HestiaCP

## Статус выполнения

- Статус документа: `done`
- Последнее обновление: `2026-03-16`
- Задачи:
  - [x] Зафиксировать роль HestiaCP в production.
  - [x] Зафиксировать модель доступа в dev по IP.
  - [x] Зафиксировать границу ответственности между Docker и HestiaCP.

## Цель

Определить единый способ публикации `admin` и `api` в production и dev-средах.

## Scope

- Контейнерный запуск сервисов.
- Внешняя маршрутизация, домены и SSL.
- Минимальные правила network exposure.

## Ключевые решения

- Контейнеры `admin`, `api`, `db` запускаются через `docker compose`.
- В production домены и SSL управляются через `HestiaCP`.
- В development достаточно доступа по `IP:порт`.
- Внутри docker-compose не поднимается отдельный reverse proxy.

## Граница ответственности

- Docker:
  - запуск и изоляция сервисов (`admin`, `api`, `db`);
  - внутренние сети и зависимости между контейнерами.
- HestiaCP:
  - внешние домены;
  - SSL-сертификаты;
  - reverse proxy до нужных контейнерных портов.

## Dev режим

- `admin`: `http://<SERVER_IP>:3001`
- `api`: `http://<SERVER_IP>:4000`
- доменные имена для dev не обязательны.

## Production режим

- Рекомендуемый маршрут:
  - `https://admin.<domain>` -> container `admin:3001`
  - `https://admin.<domain>/api` или `https://api.<domain>` -> container `api:4000`
- TLS termination выполняется в HestiaCP.

## Out of scope

- Детальная пошаговая инструкция по UI HestiaCP.
- CI/CD пайплайн деплоя.

## Связанные документы

- [Технические требования](000-tech-requirements.md)
- [Аутентификация админки (MVP)](006-admin-auth-mvp.md)
