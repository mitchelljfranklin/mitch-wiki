# Fork Divergence Manifest & Upstream Merge Playbook

This fork tracks [docmost/docmost](https://github.com/docmost/docmost) on `main` and carries intentional changes on `master`. This file is the authoritative list of every divergence and the procedure for absorbing upstream updates. **Update this file and `.github/upstream-sync.json` whenever a merge adds or retires a divergence.**

The weekly `Upstream Drift` workflow (`.github/workflows/upstream-drift.yml`) opens or refreshes an issue labelled `upstream-sync` with the upstream commits, likely conflict hotspots, security-relevant files, and enterprise files that a merge would reintroduce.

## Current state (2026-10-26)

| | |
|---|---|
| Upstream | `docmost/docmost`, branch `main` |
| Fork branch | `master` |
| Last synced base | `v0.97.0` (`6d117f8c`) |
| Latest upstream | `v0.97.0` |
| Fork history | grafted root commit whose parent is upstream `v0.95.0`; see the bootstrap below |

Upstream v0.96–v0.97 added the integrations framework (provider registry, OAuth install/connect flows, link unfurling) with GitHub, Linear, and Figma providers, trusted-proxy client-IP handling, WebSocket improvements, static-asset caching, editor fixes, and dependency updates. The enterprise-only providers (GitLab, Jira, Azure DevOps, Slack) stay out with the rest of the EE tree. That merge is done; later weekly syncs are much smaller.

## Bootstrap fork history (one-time)

The fork was published as a single squashed commit, so Git sees no common ancestor with Docmost and a normal merge cannot work. Create a commit whose parent is the real `v0.95.0` but whose tree is the current fork, then point `master` at it. This rewrites published history — do it once and keep `backup/master`.

```powershell
# 0. Commit everything first. The graft copies master^{tree}, so uncommitted
#    files (including FORK.md and these workflows) would be dropped by the reset.
git add -A
git commit -m "chore: add fork divergence manifest and upstream drift process"

git remote add upstream https://github.com/docmost/docmost.git
git fetch upstream main --tags
git branch backup/master 2>$null   # no-op if it already exists

# Build the graft commit without touching the working tree.
# -f makes this safe to re-run after later commits.
$tree   = git rev-parse "master^{tree}"
$parent = git rev-parse "v0.95.0^{commit}"
$commit = git commit-tree $tree -p $parent -m "Mitch-Wiki: fork changes on top of Docmost v0.95.0"
git branch -f graft/upstream $commit

git diff --stat graft/upstream master   # must be empty
git log --oneline --graph -3 graft/upstream

git switch master
git reset --hard graft/upstream
git push --force-with-lease origin master
```

After this, `git merge-base master v0.97.0` returns `v0.95.0`, and the drift workflow can predict conflicts. Until then it still reports upstream commits and overlapping files, but it cannot preview conflicts.

## Per-clone setup

```bash
git remote add upstream https://github.com/docmost/docmost.git
git fetch upstream main --tags
gh repo set-default mitchelljfranklin/mitch-wiki   # with two remotes gh otherwise targets upstream
```

## Removed enterprise code (must stay removed)

| Removed | Notes |
|---|---|
| `apps/client/src/ee/**`, `apps/server/src/ee/**` | Upstream vendors `apps/server/src/ee` as a submodule; delete it after every merge. |
| `.gitmodules` | Only defines the `apps/server/src/ee` submodule. |
| `@docmost/ee` jest alias | In `apps/server/package.json` `moduleNameMapper`. |
| `ee` requires in `app.module.ts`, `license-check.service.ts` | Replaced by `NoopAuditModule` and the stubbed license service. |
| EE routes/imports in `App.tsx`, sidebars, settings, editor, search | The client must not import `@/ee/*`. |
| EE-only dependencies | `lib0`, `tseep`; verify with `pnpm fork:check`. |
| EE-only integration providers | GitLab, Jira, Azure DevOps, Slack, Google Docs live in the EE submodule. Only `providers/github`, `providers/linear`, and `providers/figma` may exist under `apps/server/src/core/integration/providers`. Leave the shared `integration-link-patterns` client tests and the unused icon components alone; do not add the provider modules. |

## Fork-only files (upstream never has these)

`docs/**` (entire VitePress site), `AGENTS.md`, `FORK.md`, `SECURITY.md`, `PRIVACY.md`, `.github/ISSUE_TEMPLATE/**`, `.github/workflows/docs.yml`, `.github/workflows/upstream-drift.yml`, `.github/workflows/verify-fork.yml`, `.github/upstream-sync.json`, `scripts/fork-check.mjs`, `docker-compose.yml`, the community SSO/OIDC modules (`apps/server/src/core/auth/sso/**`, `apps/server/src/core/auth/providers/**`, `apps/server/src/core/auth/strategies/oidc.strategy.ts`, `apps/server/src/database/repos/auth-{providers,accounts}/**`, `apps/client/src/features/auth/services/sso-service.ts`, `apps/client/src/pages/settings/security-settings.tsx`), `apps/client/src/features/feature-flags/**`, `apps/client/src/features/editor/collab-socket.ts`, `apps/client/src/features/editor/extensions/placeholder.ts`, `apps/client/src/features/workspace/components/settings/components/workspace-favicon.tsx`, `apps/server/src/integrations/queue/in-process-queue.service.ts`.

`README.md` is fork-branded but intentionally small; keep it.

## Must-survive seams

| Area | Files | What to preserve | Verify |
|---|---|---|---|
| Redis optional | `environment.service.ts`, `app.module.ts`, `main.ts`, `integrations/queue/queue.module.ts`, `in-process-queue.service.ts`, `health/health.module.ts`, `health/redis.health.ts`, `throttle/throttle.module.ts`, `session/session-activity.service.ts`, `page-update-email-rate-limiter.ts`, `collab-history.service.ts`, `ws/base-realtime.bridge.ts`, `collaboration/extensions/redis-sync/**` | `isRedisEnabled()` gate; conditional `RedisModule`; in-memory cache/throttle/queue/WS fallbacks; `@Optional()` on every Redis service | `pnpm fork:check` |
| Community SSO/OIDC | Server `core/auth/{sso,providers}/**`, `strategies/oidc.strategy.ts`, `database/repos/auth-{providers,accounts}/**`; client `sso-service.ts`, `security-settings.tsx`, login/invite forms, `App.tsx` route, `workspace-query.ts` | Provider CRUD, OIDC callback with `expectedNonce`, SSO buttons using the DB UUID `provider.id`, `/api/sso/oidc/` in `excludedPaths` | `pnpm fork:check` + one OIDC login |
| Integrations (community providers only) | `apps/server/src/core/integration/**`, `apps/server/src/integrations/{encryption,outbound}/**`, `apps/client/src/features/integration/**`, `apps/client/src/features/editor/components/integration-link/**` | GitHub/Linear/Figma providers registered in `core.module.ts`; `credentialEnvKey` env names; callback `${APP_URL}/api/integrations/oauth/<type>/callback`; `APP_SECRET` encryption; `OutboundUrlGuard` on every fetch; optional Redis in `oauth.service`, `unfurl.service`, `integration.processor`, `collab-access.service`, `authentication.extension`; `QueueModule.forRoot()` in both apps | `pnpm fork:check` + install/connect one provider |
| Feature gates / EE stubs | `apps/client/src/features/feature-flags/**`, `apps/server/src/integrations/audit/audit.module.ts`, `license-check.service.ts` | `useHasFeature()` returns `false`; `NoopAuditModule` supplies `AUDIT_SERVICE`; license service returns `false`/`[]`/`'free'` | `pnpm fork:check` |
| Branding | `apps/client/src/lib/config.ts`, `app-header.tsx`, `auth-layout.tsx`, `home-ai-prompt.tsx`, `features/public-space/components/docs/docs-footer-branding.tsx`, `pages/public-space/public-space-directory-page.tsx`, `apps/client/public/locales/*/translation.json`, `apps/client/index.html`, `apps/client/public/manifest.json`, `environment.service.ts` (`getMailFromName`), transactional emails/partials, `README.md`, `docs/**` | "Mitch-Wiki" naming and fork links; no "Docmost" strings in client source or translations (comments in server code may keep upstream wording) | `pnpm fork:check` |
| Collab socket | `apps/client/src/features/editor/collab-socket.ts`, `full-editor.tsx`, `page-editor.tsx`, `extensions/extensions.ts` | Shared Hocuspocus socket with the 5 s release grace period; `use-collaboration-url.ts` stays deleted | `pnpm fork:check` |
| Editor fixes | `packages/editor-ext/src/lib/search-and-replace/search-and-replace.ts`, `apps/client/src/features/editor/extensions/placeholder.ts` | Storage null guard; bounds-checked placeholder resolution | `pnpm fork:check` |
| Dependency/toolchain drift | root `package.json`, `apps/*/package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `Dockerfile` | pnpm 11, `"type": "module"`, `shamefullyHoist`, `patchedDependencies`, fork-only security overrides, root React 19 devDeps (so Tiptap's peer resolves to React 19), Node 26 image | `pnpm install` + builds |
| Static UI / favicon | `apps/server/src/integrations/static/static.module.ts` | `fastifyStatic` keeps `index: false`; workspace favicon injection | `pnpm fork:check` |
| Fork infrastructure | `docker-compose.yml`, `.env.example`, `.github/workflows/release.yml`, `docs/**` | GHCR release flow, 3080/5433 ports, MailHog, optional Redis, VitePress scripts | `pnpm docs:build` + `docker compose build app` |

## Merge playbook

1. **Pre-flight**: wait for the `upstream-sync` issue, then `git fetch upstream main --tags`. Review the issue's security-sensitive files and hotspots. Confirm this manifest is current.
2. **Bootstrap check**: `git merge-base master v0.97.0` must return a commit. If it is empty, run the bootstrap above first.
3. **Branch**: `git switch -c upstream-sync/v0.97.0`.
4. **Merge**: `git merge v0.97.0` (tags are local refs, not `upstream/v0.97.0`; use `upstream/main` only if you deliberately want unreleased commits).
5. **Conflict policy**:
   - **Enterprise code** (`apps/*/src/ee/**`, `.gitmodules`, EE imports) → delete, never resolve.
   - **Fork-owned files** (`docs/**`, `FORK.md`, `AGENTS.md`, `SECURITY.md`, `PRIVACY.md`, `.github/ISSUE_TEMPLATE/**`, `docker-compose.yml`) → keep ours (`git checkout --ours -- <paths>`).
   - **Package manifests** → take upstream's `package.json` files, then re-apply the fork pins/overrides and `pnpm-workspace.yaml` settings. For shared dependencies take the higher version (the fork carries security bumps). Run `pnpm install` and commit the regenerated `pnpm-lock.yaml`.
   - **Translations** → take upstream wholesale; unused EE keys are harmless. Re-apply any "Docmost" → "Mitch-Wiki" strings.
   - **Shared code** → prefer upstream's implementation, then re-apply the seam from the table above.
6. **Re-strip enterprise code** using the checklist below.
7. **Verify**: `pnpm install`, `pnpm fork:check`, `pnpm run client:build`, `pnpm run server:build`, `pnpm --filter server test`, `pnpm --filter client test`, `pnpm docs:build`. For Docker-affecting merges also `docker compose build app`.
8. **Record the new base**: set `baseRef`/`baseSha`/`syncedAt` in `.github/upstream-sync.json` and add a row to the history table below. Use `git rev-parse v0.97.0` for the SHA.
9. **PR**: push `upstream-sync/v0.97.0`, open a PR against `master`, and review it like any other change. Do not merge with a failing `pnpm fork:check` — the `Verify Fork` workflow runs the same script on every push and PR to `master`.

## Re-strip checklist

```bash
rm -rf apps/client/src/ee apps/server/src/ee
rm -f .gitmodules
git rm -r --cached apps/client/src/ee apps/server/src/ee 2>/dev/null || true

# Any remaining enterprise references must be removed or replaced by stubs
grep -rn "@/ee/" apps/client/src || true
grep -rn "@docmost/ee\|require('../../ee\|from '../../ee" apps/server/src || true

# Only the community providers may exist; EE providers (gitlab, jira,
# azure-devops, slack, google-docs) live in the EE submodule.
ls apps/server/src/core/integration/providers
```

Expected provider directories: `figma`, `github`, `linear`.

Then restore the community replacements if the merge overwrote them:

- `license-check.service.ts` returns `false` / `[]` / `'free'`.
- `NoopAuditModule` is registered in `app.module.ts`.
- `apps/client/src/features/feature-flags/use-feature.ts` returns `false`.
- EE routes and nav entries are gone from `App.tsx` and the sidebars.
- `@docmost/ee` is absent from the server jest `moduleNameMapper`.
- `lib0` and `tseep` are absent from `apps/server/package.json`.
- `core.module.ts` imports only the `FigmaModule`, `GitHubModule`, and `LinearModule` providers.
- Redis stays optional in the integration and collab code: `@Optional()` on `RedisService`, null guards in `oauth.service.ts`, `unfurl.service.ts`, `integration.processor.ts`, `collab-access.service.ts`, `authentication.extension.ts`, and `QueueModule.forRoot()` in both `AppModule` and `CollabAppModule`.

## Known leftovers (harmless, do not build on them)

These are upstream remnants that survived the EE strip. They are unreachable in the fork; remove them opportunistically, but never restore the features behind them.

- `apps/client/src/features/integration/components/integration-icons.tsx` still maps the EE-only icons (`gitlab`, `slack`, `jira`, `google_docs`, `azure_devops`). The server never returns those definitions.
- The Slack-specific `tenant_in_use` / `tenant_mismatch` alerts remain in `features/integration/pages/{integrations,connections}.tsx`; nothing produces those error codes without a workspace-scoped provider.
- `CLOUD_INTEGRATION_TYPES` in `core/integration/registry/integration-registry.ts` still lists `gitlab`. It is only consulted when `IntegrationRegistry` is constructed with `cloud = true`, which the fork never does.
- AI settings are dead code: `environment.service.ts` exposes `getAi*`/`getOpenAi*`/`getGemini*`/`getOllama*`, `environment.validation.ts` accepts `AI_*`, and `features/home/components/home-ai-prompt.tsx` renders a heading when `workspace.settings.ai.chat === true`. Nothing consumes the values.
- `main.ts` still excludes `mcp` and `.well-known/oauth-protected-resource/mcp` from the workspace `preHandler`; MCP is EE-only.
- `apps/server/src/integrations/queue/in-process-queue.service.ts` emits `${queue}:${job}` events, but no processor subscribes to them. Without Redis, jobs are accepted and dropped; only the on-demand code paths (token refresh, unfurl) keep working.

## History

| Upstream base | Merged on | Notes |
|---|---|---|
| `v0.95.0` | 2026-10-26 | Initial fork base; dependency/toolchain bumps (Tiptap 3.29.2, Hocuspocus 4.4.0, pnpm 11, Node 26) |
| `v0.97.0` | 2026-10-26 | 116 commits. Took upstream Tiptap 3.31.3 / Hocuspocus 4.5.0 / axios 1.20.0 / nx 23.3 / pnpm 11.28.2, its integration framework (GitHub/Linear/Figma providers) and static-asset caching; re-stripped all EE code (AI chat/search, templates, bases, MFA, audit/SIEM, API keys, license/billing, page verification, personal spaces, pdf-render, Typesense) and deleted the dead SIEM email templates; kept the Redis-optional seams, community SSO, collab socket rewrite, and favicon injection. Standardized page titles on upstream `DocumentTitle` (dropped the fork `usePageTitle` hook) and rebranded every "Docmost" string in client source and translations to "Mitch-Wiki". Post-merge fixes: restored the Redis-optional seams the upstream integration/collab code broke (`@Optional()` + null guards in OAuth, unfurl, integration processor, collab access/authentication), made the in-process queue mock accept `upsertJobScheduler`, guarded every BullMQ `onModuleDestroy`, restored `LicenseCheckService` to the global environment module, and switched `CollabAppModule` to `QueueModule.forRoot()`; both entrypoints now boot with `REDIS_URL` unset. |
