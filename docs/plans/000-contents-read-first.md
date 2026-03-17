# Оглавление документации (прочитать сначала)

## Статус выполнения

- Статус документа: `in_progress`
- Последнее обновление: `2026-03-16`
- Легенда статусов: `done`, `in_progress`, `todo`, `blocked`

## Основные документы

- [Технические требования](000-tech-requirements.md) — `done`  
  Зафиксированный базовый стек и обязательные технологические решения для админки.
- [Начальный технический план](001-initial-plan.md) — `in_progress`  
  Общий поэтапный план реализации доменов каталог/категории/заказы для `admin + api`.
- [Спецификация характеристик товаров](002-product-attributes-schema.md) — `in_progress`  
  Детальная схема управления характеристиками товаров по категориям, версии, валидация и MVP-ограничения.
- [API контракты](003-api-contracts.md) — `done`  
  Контракты endpoint для `catalog`, `categories`, `orders`, `customers`, включая пагинацию/фильтры/ошибки.
- [Модель данных и ERD](004-data-model-erd.md) — `done`  
  Концептуальная модель хранения данных и доменные инварианты.
- [Жизненный цикл заказа](005-order-lifecycle.md) — `done`  
  Статусы заказа, переходы и правила автоматического архива.
- [Аутентификация админки (MVP)](006-admin-auth-mvp.md) — `done`  
  Минимальная auth-модель для одного админ-аккаунта.
- [Единый формат ошибок](007-error-handling.md) — `done`  
  Канонический error contract для `admin <-> api`.
- [Deployment через HestiaCP](008-deploy-hestiacp.md) — `done`  
  Правила публикации контейнеров в production через HestiaCP и dev-доступа по IP.
- [Полноценная админ-панель](009-full-admin-panel.md) — `in_progress`  
  План широкого релиза админки с модулями `catalog`, `categories`, `orders`, `customers` и этапами стабилизации.
- [CRUD для catalog/categories/orders](010-crud-catalog-categories-orders.md) — `in_progress`  
  Детальный план реализации полноценных CRUD-сценариев по ключевым доменам админки.
- [Свойства товара в категории (draft->publish)](011-category-attributes-draft-publish.md) — `in_progress`  
  План внедрения конструктора характеристик по категориям с workflow `draft -> publish`.
- [UX-доработка админки](012-admin-ux-polish.md) — `in_progress`  
  Пошаговый план улучшения UX админ-панели для модулей catalog/categories/orders/customers.
- [Полная миграция admin на shadcn/ui](013-full-shadcn-migration.md) — `in_progress`  
  План и прогресс полной миграции интерфейсов админ-панели на shadcn/ui.
- [Поля товара строго по ТЗ](014-strict-product-fields-from-tz.md) — `in_progress`  
  Реализация обязательных полей товара из исходного ТЗ с синхронизацией DB/API/admin/docs.
- [MVP витрины интернет-магазина](frontend/001-storefront-mvp.md) — `in_progress`  
  ТЗ на минимальный frontend scope: каталог, карточка товара, корзина и checkout flow по `Процессу заказа`.

## Источник бизнес-требований

- [Согласованное ТЗ клиента](../initial-requirements.txt)  
  Бизнес- и продуктовые требования, на основе которых собраны технические документы.

## Правила ведения документации

- [Documentation sync rule](../../.cursor/rules/documentation-sync-rule.mdc) — `done`  
  Обязательное правило: после согласованных решений в чате сразу обновлять релевантные документы и их блок `Статус выполнения`.
