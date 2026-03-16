# HestiaCP templates for moosmans.reactninjas.dev

This folder contains Nginx templates for HestiaCP with path-based routing:

- `/` -> storefront (`127.0.0.1:3000`)
- `/admin` -> admin (`127.0.0.1:3001`)
- `/api` -> api (`127.0.0.1:4000`)

## Files

- `moosmans.reactninjas.dev.tpl` - HTTP template
- `moosmans.reactninjas.dev.stpl` - HTTPS template

## Important notes

1. Admin app now uses `basePath: /admin`.
   - Templates proxy both `/admin` and `/admin/*` directly to admin container (no forced nginx redirects).
2. Keep admin internal handlers on the same domain:
   - `/api/admin-auth/*` -> admin container
   - `/api/admin-crud/*` -> admin container
3. For browser requests use domain root as public API base:
   - `NEXT_PUBLIC_API_URL=https://moosmans.reactninjas.dev`
4. Keep SSR/internal container traffic via Docker network:
   - `API_INTERNAL_URL=http://api:4000`

## Expected public URLs

- Storefront: `https://moosmans.reactninjas.dev/`
- Admin: `https://moosmans.reactninjas.dev/admin`
- API: `https://moosmans.reactninjas.dev/api/health`
