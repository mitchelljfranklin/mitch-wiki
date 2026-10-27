#!/usr/bin/env node
/**
 * Verifies that the fork's deliberate divergences survived an upstream merge.
 *
 * The manifest in FORK.md is prose; this script is the executable version of it.
 * Run after every upstream merge: `pnpm fork:check`.
 *
 * If a check fails because upstream now implements something better than our
 * fork version, retire the divergence in FORK.md and update this script. Do not
 * silently delete a check.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const passes = [];
const failures = [];

function read(relativePath) {
  try {
    return readFileSync(join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function exists(relativePath) {
  return existsSync(join(root, relativePath));
}

function walk(relativeDir) {
  const absoluteDir = join(root, relativeDir);
  if (!existsSync(absoluteDir)) return [];

  const files = [];
  for (const entry of readdirSync(absoluteDir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const relativePath = join(relativeDir, entry);
    const stats = statSync(join(root, relativePath));
    if (stats.isDirectory()) files.push(...walk(relativePath));
    else files.push(relativePath);
  }
  return files;
}

function anyFileContains(relativeDir, pattern) {
  return walk(relativeDir).some((file) => pattern.test(read(file)));
}

function check(name, predicate) {
  let passed = false;
  try {
    passed = Boolean(predicate());
  } catch {
    passed = false;
  }
  (passed ? passes : failures).push(name);
}

// --- Enterprise code removal -------------------------------------------------
check("enterprise client tree is absent", () => !exists("apps/client/src/ee"));
check("enterprise server tree is absent", () => !exists("apps/server/src/ee"));
check(".gitmodules is absent", () => !exists(".gitmodules"));
check(
  "no @/ee imports remain in the client",
  () => !anyFileContains("apps/client/src", /@\/ee\//),
);
check(
  "no @docmost/ee imports remain in the server",
  () => !anyFileContains("apps/server/src", /@docmost\/ee\/|require\(["']\.\.\/\.\.\/ee\//),
);
check(
  "no @docmost/ee jest alias",
  () => !read("apps/server/package.json").includes("@docmost/ee"),
);
check(
  "EE-only dependencies are absent",
  () => {
    const manifest = JSON.parse(read("apps/server/package.json"));
    return !manifest.dependencies?.lib0 && !manifest.dependencies?.tseep;
  },
);

// --- Community replacements --------------------------------------------------
check(
  "feature gate stub still returns false",
  () => read("apps/client/src/features/feature-flags/use-feature.ts").includes("return false"),
);
check(
  "NoopAuditModule is still registered",
  () => read("apps/server/src/app.module.ts").includes("NoopAuditModule"),
);
check(
  "license check service is still stubbed",
  () => {
    const source = read("apps/server/src/integrations/environment/license-check.service.ts");
    return source.includes("isValidEELicense") && !source.includes("moduleRef") && !source.includes("require(");
  },
);
check(
  "community SSO/OIDC modules exist",
  () =>
    [
      "apps/server/src/core/auth/sso/sso.module.ts",
      "apps/server/src/core/auth/providers/auth-providers.module.ts",
      "apps/server/src/core/auth/strategies/oidc.strategy.ts",
      "apps/client/src/features/auth/services/sso-service.ts",
      "apps/client/src/pages/settings/security-settings.tsx",
    ].every(exists),
);
check(
  "SSO routes stay outside the workspace middleware",
  () => read("apps/server/src/main.ts").includes("/api/sso/oidc/"),
);

// --- Redis-optional seams ----------------------------------------------------
check(
  "Redis availability gate exists",
  () =>
    read("apps/server/src/integrations/environment/environment.service.ts").includes("isRedisEnabled") &&
    read("apps/server/src/app.module.ts").includes("redisIsEnabled"),
);
check(
  "in-process queue fallback dispatches to processors",
  () =>
    exists("apps/server/src/integrations/queue/in-process-queue.service.ts") &&
    read("apps/server/src/integrations/queue/in-process-queue.service.ts").includes(
      "DiscoveryService",
    ) &&
    read("apps/server/src/integrations/queue/in-process-queue.service.ts").includes(
      "instance.process",
    ),
);
check(
  "Redis-dependent services inject @Optional",
  () =>
    [
      "apps/server/src/core/notification/services/page-update-email-rate-limiter.ts",
      "apps/server/src/core/session/session-activity.service.ts",
      "apps/server/src/collaboration/services/collab-history.service.ts",
    ].every((file) => read(file).includes("@Optional")),
);

// --- Branding, editor, and UI seams -----------------------------------------
check(
  "app name is Mitch-Wiki",
  () => read("apps/client/src/lib/config.ts").includes('return "Mitch-Wiki"'),
);
check(
  "public/share pages still carry fork branding",
  () =>
    read(
      "apps/client/src/features/public-space/components/docs/docs-footer-branding.tsx",
    ).includes("Mitch-Wiki"),
);
check(
  "no upstream brand strings in client source",
  () =>
    walk("apps/client/src")
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !/\.test\.(ts|tsx)$/.test(file))
      .every((file) => !/Docmost/.test(read(file))),
);
check(
  "no upstream brand strings in translations",
  () =>
    walk("apps/client/public/locales")
      .filter((file) => file.endsWith("translation.json"))
      .every((file) => !/Docmost/.test(read(file))),
);
check(
  "collab socket rewrite is present",
  () =>
    exists("apps/client/src/features/editor/collab-socket.ts") &&
    !exists("apps/client/src/features/editor/hooks/use-collaboration-url.ts"),
);
check(
  "editor-ext search storage guard is present",
  () =>
    read("packages/editor-ext/src/lib/search-and-replace/search-and-replace.ts").includes(
      "if (!storage) return oldState",
    ),
);
check(
  "static UI keeps favicon injection and index:false",
  () => {
    const source = read("apps/server/src/integrations/static/static.module.ts");
    return source.includes("index: false") && source.includes("favicon");
  },
);

// --- Toolchain, docs, and fork infrastructure --------------------------------
check(
  "pnpm workspace hoisting is preserved and .npmrc stays removed",
  () => read("pnpm-workspace.yaml").includes("shamefullyHoist: true") && !exists(".npmrc"),
);
check(
  "root ESM, pnpm 11, and docs scripts are preserved",
  () => {
    const manifest = JSON.parse(read("package.json"));
    return (
      manifest.type === "module" &&
      manifest.packageManager?.startsWith("pnpm@11") &&
      Boolean(manifest.scripts?.["docs:build"])
    );
  },
);
check("VitePress docs site exists", () => exists("docs/.vitepress/config.ts"));
check(
  "upstream sync state is valid",
  () => {
    const state = JSON.parse(read(".github/upstream-sync.json"));
    return Boolean(
      state.upstream &&
        state.upstreamBranch &&
        state.forkBranch &&
        state.baseRef &&
        state.baseSha,
    );
  },
);

console.log("Fork divergence check\n");
for (const name of passes) console.log(`  PASS  ${name}`);
for (const name of failures) console.log(`  FAIL  ${name}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);

if (failures.length > 0) {
  console.error(
    "\nA failed check means an upstream merge dropped a fork divergence. Restore it, or retire the divergence in FORK.md and this script if upstream superseded it.",
  );
  process.exit(1);
}
