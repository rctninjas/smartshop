# Локальный запуск в Docker

## Цель

Запустить `admin`, `api`, `storefront` и `PostgreSQL` локально через Docker.

## Требования

- Установлен Docker Desktop (или Docker Engine + Compose Plugin).
- Свободны порты:
  - `3000` (storefront)
  - `3001` (admin)
  - `4000` (api)
  - `5452` (postgres, внешний порт)

## 1) Подготовка окружения

В корне проекта:

```bash
cp .env.example .env
```

Проверьте ключевые переменные в `.env`:

- `ADMIN_PORT=3001`
- `API_PORT=4000`
- `POSTGRES_PORT=5452`
- `DATABASE_URL=postgresql://smartshop:smartshop@db:5432/smartshop?schema=public`
- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `API_INTERNAL_URL=http://api:4000`
- `API_PUBLIC_URL=http://localhost:4000`
- `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- `CUSTOMER_SESSION_SECRET`, `CUSTOMER_SESSION_TTL_MINUTES`, `CUSTOMER_LOGIN_CODE_TTL_MINUTES`

## 2) Запуск контейнеров

В конфигурации используется отдельный init-сервис `deps`: он единственный выполняет `pnpm install`, после чего запускаются `api`, `admin` и `storefront`.
`deps` пишет зависимости в общие тома:

- `root_node_modules`
- `api_node_modules`
- `admin_node_modules`
- `storefront_node_modules`

Это гарантирует корректный cold start после `docker compose down -v` без ручных `pnpm install` в приложениях.

```bash
docker compose up -d
```

Или через npm-скрипт:

```bash
pnpm docker:up
```

## 3) Проверка состояния

```bash
docker compose ps
```

Ожидаемо:

- `smartshop-deps` со статусом `exited (0)` (это нормальное поведение init-сервиса).
- `smartshop-db`, `smartshop-api`, `smartshop-admin`, `smartshop-storefront` в статусе `running`.

Проверка API health:

```bash
curl http://localhost:4000/health
```

Ожидаемо:

- `status: ok`
- `database: up`

Проверка, что зависимости действительно поднялись автоматически:

```bash
docker compose logs --no-color --tail=100 api admin storefront
```

В логах не должно быть ошибок старта:

- `next: not found`
- `prisma: not found`

## 4) Доступ к сервисам

- Admin: `http://localhost:3001/admin`
- API: `http://localhost:4000`
- Storefront: `http://localhost:3000`
- PostgreSQL: `localhost:5452` (внутри Docker-сети БД остается на `db:5432`)

## 5) Полезные команды

Логи:

```bash
docker compose logs -f
```

Остановка:

```bash
docker compose down
```

Остановка с удалением volume БД:

```bash
docker compose down -v
```

Полная очистка и запуск с "0" (рекомендуется при сломанном локальном окружении):

```bash
docker compose down -v --remove-orphans
docker compose up -d --build
docker compose ps
docker compose logs --tail=120 deps api admin storefront db
```

Что делает этот набор:

- Полностью удаляет контейнеры, сеть и volumes (включая данные PostgreSQL).
- Пересобирает образы и поднимает сервисы заново.
- Позволяет сразу проверить, что `deps` завершился успешно, а `api/admin/storefront/db` работают корректно.

## 6) Частые проблемы

- Файлы изображений товаров:
  - хранятся локально в `apps/api/storage/products`;
  - каталог исключен из git и должен сохраняться только как runtime-данные.
- Порт занят:
  - измените порт в `.env` и перезапустите `docker compose up -d`.
- API не стартует из-за Prisma:
  - проверьте `DATABASE_URL` в `.env`;
  - проверьте, что контейнер `db` в статусе `healthy`.
- `api`/`admin` не стартуют после изменения `package.json` или `pnpm-lock.yaml`:
  - перезапустите стек с пересозданием зависимостей: `docker compose down -v && docker compose up -d --build`.
- Admin не видит API:
  - проверьте `NEXT_PUBLIC_API_URL` в `.env` (для браузера);
  - проверьте `API_INTERNAL_URL` в `.env` (для SSR внутри контейнера `admin`).
- Storefront не стартует:
  - проверьте, что `api` доступен по `http://localhost:4000/health`;
  - перезапустите сервис: `docker compose restart storefront`;
  - проверьте логи: `docker compose logs --tail=120 storefront`.
