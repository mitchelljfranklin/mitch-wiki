# Fork Divergence Manifest & Upstream Merge Playbook

This fork tracks [docmost/docmost](https://github.com/docmost/docmost) on `main` and carries intentional changes on `master`. This file is the authoritative list of every divergence and the procedure for absorbing upstream updates. **Update this file and `.github/upstream-sync.json` whenever a merge adds or retires a divergence.**

The weekly `Upstream Drift` workflow (`.github/workflows/upstream-drift.yml`) opens or refreshes an issue labelled `upstream-sync` with the upstream commits, likely conflict hotspots, security-relevant files, and enterprise files that a merge would reintroduce.

## Current state (2026-10-26)

| | |
|---|---|
| Upstream | `docmost/docmost`, branch `main` |
| Fork branch | `master` |
| Last synced base | `v0.95.0` (`4132dd5`) |
| Latest upstream | `v0.97.0` — 116 commits, 616 files, 145 files changed on both sides |
| Fork history | one squashed root commit; run the one-time bootstrap below before merging |

Upstream v0.96–v0.97 adds integrations (GitHub, GitLab, Jira, Linear, Figma, Azure DevOps), WebSocket improvements, trusted-proxy handling, MCP v2, editor fixes, and dependency updates. Expect the first merge to be large; afterwards, smaller weekly syncs are cheap.

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

## Fork-only files (upstream never has these)

`docs/**` (entire VitePress site), `AGENTS.md`, `FORK.md`, `SECURITY.md`, `PRIVACY.md`, `.github/ISSUE_TEMPLATE/**`, `.github/workflows/docs.yml`, `.github/workflows/upstream-drift.yml`, `.github/workflows/verify-fork.yml`, `.github/upstream-sync.json`, `scripts/fork-check.mjs`, `docker-compose.yml`, the community SSO/OIDC modules (`apps/server/src/core/auth/sso/**`, `apps/server/src/core/auth/providers/**`, `apps/server/src/core/auth/strategies/oidc.strategy.ts`, `apps/server/src/database/repos/auth-{providers,accounts}/**`, `apps/client/src/features/auth/services/sso-service.ts`, `apps/client/src/pages/settings/security-settings.tsx`), `apps/client/src/features/feature-flags/**`, `apps/client/src/features/editor/collab-socket.ts`, `apps/client/src/features/editor/extensions/placeholder.ts`, `apps/client/src/hooks/use-page-title.ts`, `apps/client/src/features/workspace/components/settings/components/workspace-favicon.tsx`, `apps/server/src/integrations/queue/in-process-queue.service.ts`.

`README.md` is fork-branded but intentionally small; keep it.

## Must-survive seams

| Area | Files | What to preserve | Verify |
|---|---|---|---|
| Redis optional | `environment.service.ts`, `app.module.ts`, `main.ts`, `integrations/queue/queue.module.ts`, `in-process-queue.service.ts`, `health/health.module.ts`, `health/redis.health.ts`, `throttle/throttle.module.ts`, `session/session-activity.service.ts`, `page-update-email-rate-limiter.ts`, `collab-history.service.ts`, `ws/base-realtime.bridge.ts`, `collaboration/extensions/redis-sync/**` | `isRedisEnabled()` gate; conditional `RedisModule`; in-memory cache/throttle/queue/WS fallbacks; `@Optional()` on every Redis service | `pnpm fork:check` |
| Community SSO/OIDC | Server `core/auth/{sso,providers}/**`, `strategies/oidc.strategy.ts`, `database/repos/auth-{providers,accounts}/**`; client `sso-service.ts`, `security-settings.tsx`, login/invite forms, `App.tsx` route, `workspace-query.ts` | Provider CRUD, OIDC callback with `expectedNonce`, SSO buttons using the DB UUID `provider.id`, `/api/sso/oidc/` in `excludedPaths` | `pnpm fork:check` + one OIDC login |
| Feature gates / EE stubs | `apps/client/src/features/feature-flags/**`, `apps/server/src/integrations/audit/audit.module.ts`, `license-check.service.ts` | `useHasFeature()` returns `false`; `NoopAuditModule` supplies `AUDIT_SERVICE`; license service returns `false`/`[]`/`'free'` | `pnpm fork:check` |
| Branding | `apps/client/src/lib/config.ts`, `app-header.tsx`, `auth-layout.tsx`, `home-ai-prompt.tsx`, `share-branding.tsx`, `apps/client/index.html`, `apps/client/public/manifest.json`, `environment.service.ts` (`getMailFromName`), transactional emails/partials, `README.md`, `docs/**` | "Mitch-Wiki" naming and fork links; no "Docmost" user-facing strings | `pnpm fork:check` + `grep -ri docmost apps/client/src` |
| Collab socket | `apps/client/src/features/editor/collab-socket.ts`, `full-editor.tsx`, `page-editor.tsx`, `extensions/extensions.ts` | Shared Hocuspocus socket with the 5 s release grace period; `use-collaboration-url.ts` stays deleted | `pnpm fork:check` |
| Editor fixes | `packages/editor-ext/src/lib/search-and-replace/search-and-replace.ts`, `apps/client/src/features/editor/extensions/placeholder.ts` | Storage null guard; bounds-checked placeholder resolution | `pnpm fork:check` |
| Dependency/toolchain drift | root `package.json`, `apps/*/package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `Dockerfile` | pnpm 11, `"type": "module"`, `shamefullyHoist`, `patchedDependencies`, security overrides, Tiptap 3.29.2 / Hocuspocus 4.4.0 / axios 1.18.1, Node 26 image | `pnpm install` + builds |
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
```

Then restore the community replacements if the merge overwrote them:

- `license-check.service.ts` returns `false` / `[]` / `'free'`.
- `NoopAuditModule` is registered in `app.module.ts`.
- `apps/client/src/features/feature-flags/use-feature.ts` returns `false`.
- EE routes and nav entries are gone from `App.tsx` and the sidebars.
- `@docmost/ee` is absent from the server jest `moduleNameMapper`.
- `lib0` and `tseep` are absent from `apps/server/package.json`.

## History

| Upstream base | Merged on | Notes |
|---|---|---|
| `v0.95.0` | 2026-10-26 | Initial fork base; dependency/toolchain bumps (Tiptap 3.29.2, Hocuspocus 4.4.0, pnpm 11, Node 26) |
