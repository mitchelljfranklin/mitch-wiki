# Security Policy

## Supported Versions

Mitch-Wiki is currently in active development. We recommend running the latest commit from the `main` branch.

| Branch | Supported |
|---|---|
| `main` | Yes |
| Feature branches | No — development only |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, report it privately to:

- **Email:** `security@mitch-wiki.local`
- **GitHub:** [Private vulnerability reporting](https://github.com/mitchelljfranklin/mitch-wiki/security/advisories/new)

We will respond within **72 hours** and aim to publish a fix within **7 days** for critical issues.

### What to include

- A clear description of the vulnerability
- Steps to reproduce
- Affected versions or commits
- Potential impact
- Any suggested fixes (optional)

## Security Practices

### Authentication

- Passwords hashed with bcrypt
- JWT tokens with configurable expiration
- Session-based token management with revocation
- OIDC SSO with PKCE, state, and nonce validation
- Rate limiting on auth endpoints (10 req/min)

### Data Protection

- HTTP-only, secure, same-site cookies for auth tokens
- Configurable CORS and frame embedding restrictions
- All API routes require workspace context (except public endpoints)
- Validation pipe with whitelist mode on all DTOs

### Infrastructure

- PostgreSQL with strong password authentication
- Docker containers run as non-root `node` user
- Health check endpoints for monitoring
- Telemetry is disabled by default

## Dependencies

We use pnpm overrides to pin dependencies with known vulnerabilities. Run `pnpm audit` to check for issues.

Dependencies are updated regularly through Dependabot (coming soon) and manual review.
