# Smartshop Monorepo

Smartshop is a monorepo with three applications:
- `apps/storefront` - customer-facing Next.js storefront
- `apps/admin` - Next.js admin panel
- `apps/api` - Fastify API service

## Tech Stack

- `pnpm` workspaces
- `Turborepo` for task orchestration
- `TypeScript` everywhere
- `Next.js` for frontend apps
- `Fastify` for backend API

## Repository Structure

```text
apps/
  storefront/
  admin/
  api/
packages/
  ui/
  types/
  utils/
  config/
```

## Modular Architecture Rules

- Organize by feature modules first, then by layer.
- Keep module boundaries explicit through public exports (`index.ts`).
- Do not import internals from another feature module.
- Place shared cross-feature logic in `shared/*` or `packages/*`.
- Keep UI components presentational; business logic belongs to feature/application layers.

### Recommended Layers

- `ui` - rendering and interaction
- `application` - use-cases and orchestration
- `domain` - domain models and pure business rules
- `infrastructure` - external systems and data access

## Module Public API Pattern

Each feature exposes only its public API:

```text
src/features/catalog/
  ui/
    catalog-list.tsx
  index.ts
```

Consumers import only from `src/features/catalog`.

## Shared Packages

- `@smartshop/ui` - reusable presentational components
- `@smartshop/types` - shared contracts/DTOs
- `@smartshop/utils` - pure utilities
- `@smartshop/config` - shared config presets (`tsconfig`, `eslint`, `prettier`)

## Scripts

From repository root:

- `pnpm install` - install all workspace dependencies
- `pnpm dev` - run storefront, admin and api in parallel
- `pnpm lint` - run lint in all packages/apps
- `pnpm typecheck` - run TypeScript checks in all packages/apps
- `pnpm build` - run build in all packages/apps
- `pnpm test` - run test tasks in all packages/apps

## Environment Variables

Use `.env.example` as the template:

- `NEXT_PUBLIC_API_URL`
- `STORE_FRONTEND_URL`
- `ADMIN_FRONTEND_URL`
- `API_PORT`

## First Run

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Run `pnpm install`.
3. Start development with `pnpm dev`.

