# AGENTS.md

Mitch-Wiki is a community fork of Docmost v0.97.0 (AGPL-3.0). All upstream enterprise code was removed, so `@docmost/*` is the fork's internal package naming — not a paid tier. Do not rename those scopes; hundreds of imports use them.

Monorepo: pnpm 11 workspace + Nx 23. There are no `project.json` files — Nx infers targets from each package's `package.json` scripts. Run anything with `pnpm --filter <pkg> <script>` or `nx run <pkg>:<script>` using the package names `server`, `client`, `@docmost/editor-ext`, `@docmost/base-formula`.

| Path | What |
|---|---|
| `apps/server` | NestJS + Fastify API, WebSocket/collab server, Kysely DB layer |
| `apps/client` | React 19 + Vite + Mantine 9 + Jotai + React Query SPA |
| `packages/editor-ext` | Tiptap extensions (`@docmost/editor-ext`) |
| `packages/base-formula` | Formula parser with separate client/server entrypoints |
| `docs` | VitePress site (`pnpm docs:dev`) |

## Commands

```bash
pnpm install
pnpm dev                 # client:dev + server:start:dev via concurrently
pnpm build               # all projects; Nx builds dependency packages first
pnpm run client:build    # tsc && vite build (this is the client typecheck)
pnpm run server:build    # nest build (tsc)

# Tests (no root test script)
pnpm --filter server test                                       # jest, *.spec.ts
pnpm --filter server exec jest src/common/helpers/utils.spec.ts # single spec
pnpm --filter client test                                       # vitest
pnpm --filter client exec vitest run src/path/file.test.ts      # single test

# Lint/format (no root script; server lint auto-fixes)
pnpm --filter server lint
pnpm --filter client lint
pnpm --filter server format

# DB (dev: migrations are NOT applied automatically)
pnpm --filter server migration:latest   # also :up, :down, :create <name>, :reset
pnpm --filter server migration:codegen  # regenerate src/database/types/db.d.ts
```

CI runs `pnpm fork:check` (`.github/workflows/verify-fork.yml`) on every push/PR to `master`, builds docs (`.github/workflows/docs.yml`), and builds the Docker image on release; there is no test/lint/typecheck CI, so run those locally.

Before committing: `pnpm run client:build`, `pnpm run server:build`, `pnpm docs:build`. Nx caches outputs; clear with `rm -rf .nx/cache` if results look stale.

## Architecture

- **API entrypoint** `apps/server/src/main.ts`: global prefix `api` (exceptions: `robots.txt`, share pages, `mcp`; the `mcp` entry is an upstream leftover because MCP is EE-only). A `preHandler` hook rejects any `/api/*` request without a resolved workspace with 404 "Workspace not found"; the client redirects to `/setup/register` on that message. New public endpoints need both `@Public()` and an entry in that hook's `excludedPaths` array.
- **Response envelope**: `TransformHttpResponseInterceptor` wraps every controller response as `{ data, success, status }`. Use `@SkipTransform()` to opt out. The client axios interceptor unwraps it back to `response.data`.
- **Collab is a separate process**: `collab:prod`/`collab:dev` run `dist/collaboration/server/collab-main` on `COLLAB_PORT` (default 3001). `collab:dev` executes built output — build first. Dev proxies `/collab` to it. `CollabAppModule` must import `QueueModule.forRoot()`; the bare `QueueModule` registers no queue providers, so `PageListener` and the collab processors fail to resolve their `BullQueue_*` tokens.
- **Static UI**: `apps/server/src/integrations/static/static.module.ts` serves `apps/client/dist` and injects workspace favicon into `index.html`. `fastifyStatic` must keep `index: false` so the catch-all handler wins. Do not remove `NoopAuditModule` — it provides the `AUDIT_SERVICE` token used by many services.
- **Env loading**: one root `.env`, resolved as `cwd/../../.env`. Always run through pnpm/Nx filters (cwd = the app); running `node apps/server/dist/main` from the repo root loads the wrong path. Vite loads the root `.env` via an explicit path in `vite.config.ts`.
- **Module format**: server is CommonJS (`apps/server/tsconfig.json`); root `package.json` is ESM for VitePress. Leave both as-is.
- **`base-formula` exports**: `./client` resolves to TS source, `./server` to `dist`; the server build needs the package built (Nx `^build` handles this).
- **Client**: `@/` → `src/`, entry `src/main.tsx`. Workspace state in `workspaceAtom` (`features/user/atoms/current-user-atom.ts`).
- **Integrations** (`apps/server/src/core/integration`): provider registry + OAuth install/connect + link unfurling. Only `providers/github`, `providers/linear`, and `providers/figma` exist; each module self-registers in `onModuleInit` and is imported in `core/core.module.ts`. Credentials are read from `INTEGRATION_<TYPE>_CLIENT_ID`/`_CLIENT_SECRET` (via `credentialEnvKey`; `credentialsKey` lets products share one OAuth app), and the callback is `${APP_URL}/api/integrations/oauth/<type>/callback`. Installing is an admin action (`Manage`/`Settings`); each member then connects their own account. Tokens are encrypted with `APP_SECRET`, so rotating it invalidates every connection. Outbound fetches go through `OutboundUrlGuard`, which blocks private/reserved destinations unless `ALLOWED_PRIVATE_NETWORKS` names them.

## Environment & ports

- Server listens on `PORT` (default 3000; this checkout's `.env` uses 3001). `APP_URL` is both the public URL and the Vite dev proxy target for `/api`, `/socket.io`, `/collab` — change the port and you must update `APP_URL`, or dev requests go to the wrong host. `APP_URL` is also the OAuth base: integrations register `${APP_URL}/api/integrations/oauth/<type>/callback`.
- `APP_SECRET` is required (32+ chars, not the `.env.example` placeholder) and is the encryption key for integration OAuth tokens and OAuth completion tickets. Changing it forces every member to reconnect their integrations.
- `docker compose` publishes app `3080:3000` and Postgres `5433:5432`, so a host-side `DATABASE_URL` for the compose DB must use port **5433**. MailHog UI is `:8025`.
- Redis is optional: `app.module.ts` only registers `RedisModule` when `REDIS_URL` is set; cache, WS adapter, session activity, collab history, collab access rechecks, the unfurl cache, and the OAuth refresh lock fall back to in-memory/noop. Any new Redis-dependent service must inject with `@Optional()` and guard every method body (`if (!this.redis) return fallback;`). BullMQ processors must guard `this.worker` in `onModuleDestroy` (the getter throws when BullMQ is not registered), and both `AppModule` and `CollabAppModule` import `QueueModule.forRoot()`, never the bare `QueueModule`. Boot-check both entrypoints with `REDIS_URL` unset after touching queue/Redis code.

## Database

- Kysely query builder, no ORM. Migrations live in `apps/server/src/database/migrations`.
- Migrations auto-run only when `NODE_ENV=production` (`DatabaseModule.onApplicationBootstrap`). In development run `migration:latest`/`migration:up` yourself after pulling schema changes.
- `apps/server/src/database/types/db.d.ts` is generated by `kysely-codegen`; regenerate with `migration:codegen` after schema changes and never hand-edit it.

## Conventions & gotchas

- **Feature gates always return false**: `useHasFeature()` is a single stub in `features/feature-flags/use-feature.ts`. To ship a gated feature, change that stub; feature keys belong in `features/feature-flags/features.ts`. Never import from `@/ee/*` (deleted).
- **API calls** go through `@/lib/api-client.ts` (plain axios instance, baseURL `/api`, unwraps the envelope; supports all axios methods). Bodyless POSTs must send `{}` plus `Content-Type: application/json` or Fastify returns 415.
- **Hooks at top level**: `useAtom`, `useAtomValue`, `useHasFeature` must not sit in conditionals/early returns (see `pages/auth/setup-workspace.tsx`). Auth pages use `useWorkspacePublicDataQuery()` for branding and fall back to "Mitch-Wiki" when there is no workspace.
- **Page titles** go through `<DocumentTitle title={t("…")} />` (`components/ui/document-title.tsx`), which appends the app name. Do not hand-roll `Helmet` blocks in new pages.
- **Adding an integration provider**: create `providers/<type>/{<type>.provider.ts,<type>.service.ts,<type>.module.ts}`, register the module in `core/core.module.ts`, add the icon in `features/integration/components/integration-icons.tsx`, and document `INTEGRATION_<TYPE>_CLIENT_ID`/`_CLIENT_SECRET` in `.env.example` and `docs/self-hosting/integrations.md`. The available list is not filtered by credentials, so an unconfigured provider still shows Install and fails with `Missing environment variable: …`. EE-only providers (GitLab, Jira, Azure DevOps, Slack, Google Docs) are intentionally absent — do not re-add them.
- **AI env vars are vestigial**: `environment.service.ts` still exposes `getAi*`/`getOpenAi*`/`getGemini*`/`getOllama*` and validation accepts `AI_*`, but nothing consumes them (AI chat/search was EE). `HomeAiPrompt` only renders when `workspace.settings.ai.chat === true` and shows a heading, not AI. Do not build on these without restoring the upstream feature.
- **Auth providers are soft-deleted** (`deletedAt`), never hard-deleted: every query must filter `deletedAt is null`, including the admin list and the login page's public workspace data.
- **SSO provider IDs are DB UUIDs**: routes and buttons use `provider.id` (`/api/sso/oidc/<id>/login`), not a `providerId` field.
- **OIDC nonce**: openid-client v6 validates the nonce itself, so pass `expectedNonce: storedStateEntry.nonce` into `authorizationCodeGrant`; omitting it fails with `OAUTH_JWT_CLAIM_COMPARISON_FAILED`.
- **`test:e2e` is stale**: it boots the full `AppModule` (needs a live DB) and still expects a "Hello World!" route that no longer exists.
- Naming: no single-letter variables; name magic numbers (`const THROTTLE_SECONDS = 15 * 60; // 15 minutes`).

## Upstream sync

- `FORK.md` is the divergence manifest and merge playbook; `.github/upstream-sync.json` records the last synced upstream tag. Read both before merging `upstream/*`.
- The weekly `Upstream Drift` workflow opens an `upstream-sync` issue with upstream commits, conflict hotspots, and security-relevant changes. The `Verify Fork` workflow runs `pnpm fork:check` on every push/PR to `master`; run it locally after any merge too.

## Docs

- Default branch is `master`, but `nx.json` sets `affected.defaultBase: main` — pass `--base=master` to `nx affected`.
- Feature changes → update `docs/` and the sidebar in `docs/.vitepress/config.ts`; env var changes → `.env.example`, `docs/self-hosting/environment-variables.md`, and `docker-compose.yml`; UI text changes → keys in `apps/client/public/locales/*/translation.json` (`en-US` is the Crowdin source, config in `crowdin.yml`). Self-hosted integrations live in `docs/self-hosting/integrations.md` — keep its provider list and `INTEGRATION_*` variables in sync with the code.
- `pnpm docs:build` fails on dead links — run it after doc edits.

See `README.md` for the project pitch and `docs/self-hosting/development.md` for the published dev guide (note: it still lists Redis as required; it is optional).
