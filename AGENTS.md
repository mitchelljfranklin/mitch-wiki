# AGENTS.md

## Project Overview

Mitch-Wiki is a community fork of Docmost (v0.95.0) — an open-source collaborative wiki. AGPL-3.0 licensed. All proprietary enterprise features have been stripped.

**Monorepo** (pnpm + Nx): 2 apps + 2 packages.

| Directory | Stack | Purpose |
|---|---|---|
| `apps/server/` | NestJS + Fastify + Kysely | Backend API, migrations, WebSocket collab |
| `apps/client/` | React + Vite + Mantine 9 + Jotai | Frontend SPA |
| `packages/editor-ext/` | Tiptap extensions | Rich-text editor plugins |
| `packages/base-formula/` | Formula parser | `@docmost/base-formula` |
| `docs/` | VitePress | Documentation site |

## Essential Commands

```bash
pnpm dev                    # Vite HMR (5173+) + NestJS watch (3001) — dev mode
pnpm build                  # Build all 4 projects via Nx
pnpm run client:build       # Build client only (tsc + vite build)
pnpm run server:build       # Build server only (nest build)
pnpm docs:dev               # VitePress docs dev server
pnpm docs:build             # VitePress docs production build
```

`.env` required at project root for dev mode. See `.env.example`.

## Architecture Notes

### Server (NestJS + Fastify)
- **Global prefix**: `api` (set in `main.ts:41`). All controller routes are `/api/*`.
- **Workspace middleware** (`main.ts:114-140`): Blocks API requests without `workspaceId`. Add new public endpoints to the `excludedPaths` array.
- **Validation pipe**: `whitelist: true, transform: true` — DTOs must declare all accepted fields.
- **Module type**: Server uses CommonJS (`"module": "commonjs"` in tsconfig). Root `package.json` has `"type": "module"` for vitepress — this does not affect the server because `apps/server/package.json` overrides it.
- **Database**: PostgreSQL via Kysely ORM. Migrations in `apps/server/src/database/migrations/`. Run automatically on startup in production.
- **Path aliases**: `@docmost/db/*` → `src/database/*`, `@docmost/transactional/*` → `src/integrations/transactional/*`. Keep these package names — do not rename.

### Client (React + Vite)
- **Path alias**: `@/` → `src/`
- **API calls**: All go through `@/lib/api-client.ts` (axios instance, base `/api`). POST requests without a body MUST include `{ headers: { "Content-Type": "application/json" } }` — Fastify rejects empty POSTs with 415 otherwise.
- **Feature flags**: Stubs at `@/features/feature-flags/`. Never import from `@/ee/` — that directory was deleted.
- **State**: Jotai atoms. Workspace data in `workspaceAtom` from `@/features/user/atoms/current-user-atom.ts`.
- **Auth pages**: Outside `<Layout>`, use `useWorkspacePublicDataQuery()` for workspace branding. Auth pages have no workspace context, fall back to "Mitch-Wiki".

### Docker
```bash
docker compose build app    # Build image
docker compose up -d        # Start all services
docker compose up -d app    # Start app only (uses existing db)
docker compose down -v      # Full wipe (destroys all data)
```

App on `:3080`. MailHog on `:8025`. Redis service is commented out — optional.

### Redis (Optional)
All Redis-dependent services use `@Optional()` injection with graceful fallbacks:
- `PageUpdateEmailRateLimiter` — allows all emails when Redis absent
- `SessionActivityService` — writes directly to DB without throttling
- `CollabHistoryService` — noop when Redis absent
- If adding a new Redis-dependent service, use `@Optional()` and guard all method bodies.

## Gotchas

1. **Empty POST requests need Content-Type**: `api.post(url, {}, { headers: { "Content-Type": "application/json" } })`. Fastify returns 415 otherwise, especially behind reverse proxies.
2. **`usePageTitle` must be called at hook top-level**: Not inside conditionals (Rules of Hooks). See `setup-workspace.tsx` for correct pattern.
3. **`@docmost/` packages are NOT Dotmost Enterprise**: These are internal technical package names from the fork. Do not rename them — ~300 import paths depend on them.
4. **EACCES on port 3000**: Default dev port. Kill the process on that port or use PORT=3001 in `.env`.
5. **Postgres 18 volume path**: Must mount at `/var/lib/postgresql` (not `/var/lib/postgresql/data`). The compose file already handles this.
6. **Client build in Docker requires `server:build` first**: Nx `server:build` is a dependency of `client:build` in the Dockerfile.
7. **Favicon injection**: `static.module.ts` serves index.html with workspace favicon. Needs `index: false` on `fastifyStatic` to prevent early interception. Do not remove `NoopAuditModule` — it provides the `AUDIT_SERVICE` token used by 20+ services.

## Coding Standards

### Naming & Readability
- **No single-letter variables**: Use descriptive names (`authorizationUrl`, `workspaceName`) — never `e`, `j`, `a`, `x`.
- **No magic numbers**: Extract to named constants with a comment explaining the unit or purpose.  
  `const THROTTLE_SECONDS = 15 * 60; // 15 minutes` — not `900`.
- **Descriptive function names**: `getAuthorizationUrl()` not `getUrl()`. Functions should say what they do.
- **Comments for non-obvious logic**: OIDC flow, workspace middleware bypasses, in-memory queue fallbacks — if it took research to write, it needs a comment.

### Redis-Dependent Services
All services that use Redis must follow the same pattern:
```typescript
constructor(@Optional() private readonly redisService: RedisService) {
  if (this.redisService) {
    this.redis = this.redisService.getOrThrow();
  }
}

someMethod(): ReturnType {
  if (!this.redis) {
    return sensibleFallback; // e.g. true, [], void
  }
  // ... Redis logic
}
```
Never assume Redis is available. Every method body must guard with `if (!this.redis)`.

### NestJS
- Public endpoints use `@Public()` decorator and must be added to `excludedPaths` in `main.ts`.
- DTOs use `class-validator` decorators. Match the validation pipe's `whitelist: true`.
- Controllers under `/api/auth/` and `/api/workspace/` are workspace-scoped — inject `@AuthWorkspace()` for the workspace context.

### React
- Hooks (`useAtom`, `usePageTitle`, `useHasFeature`) must be called at component top-level — never inside conditionals, loops, or early returns.
- API calls go through `@/lib/api-client.ts`. Never use raw `fetch` or `axios` directly.
- New feature flags go in `@/features/feature-flags/features.ts`.

## Documentation

### When Adding or Removing a Feature
- Update `docs/` with a new or updated markdown file in the relevant section.
- Run `pnpm docs:build` to verify no dead links.
- Update the sidebar in `docs/.vitepress/config.ts` if adding a new page.
- Update `docs/index.md` feature cards if adding a headline feature.

### When Changing Environment Variables
- Update `.env.example` with the new variable and a comment.
- Update `docs/self-hosting/environment-variables.md` with the variable's description, default, and valid values.
- Update `docker-compose.yml` if the variable is needed or has changed for the standard deployment.

### When Changing the UI
- Update `docs/user-guide/` pages affected by the change (screenshots, menu paths, field names).
- Translation files in `apps/client/public/locales/*/translation.json` may need new keys.

### When Adding a Gotcha
- Add it to the **Gotchas** section below. If it cost you more than 30 minutes to debug, it belongs here.

### README & AGENTS.md
- `README.md` stays high-level: what the project is, how to run, license.
- `AGENTS.md` stays agent-focused: commands, architecture, standards, gotchas. Do not duplicate README content here.

### Before Committing
```bash
pnpm run client:build    # Must pass
pnpm run server:build    # Must pass
pnpm docs:build          # Must pass (no dead links)
```
For Docker-affecting changes, also run `docker compose build app`.

Nx caches build outputs. If builds produce stale results, clear with:
```bash
rm -rf .nx/cache
```

## See Also

- `README.md` — project overview and quick start
- `docs/` — full VitePress documentation (`pnpm docs:dev`)
- `.env.example` — all supported environment variables
- `docker-compose.yml` — production deployment template
