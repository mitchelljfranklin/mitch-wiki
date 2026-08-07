<div align="center">
    <h1><b>Mitch-Wiki</b></h1>
    <p>
        <strong>Open-source collaborative wiki and documentation platform.</strong>
        <br />
        Self-hosted. Modern editor. Real-time collaboration. No paywalls.
    </p>
    <p>
        <a href="https://github.com/mitchelljfranklin/mitch-wiki"><strong>GitHub</strong></a> •
        <a href="https://github.com/mitchelljfranklin/mitch-wiki/tree/master/docs"><strong>Documentation</strong></a>
    </p>
</div>

---

## About

Mitch-Wiki is a community fork of [Docmost](https://github.com/docmost/docmost), an excellent open-source wiki platform. We're grateful to the Docmost team for building such a solid foundation.

### Why this fork exists

We believe open-source software shouldn't hide features behind paywalls. The upstream project reserves key functionality — SSO, audit logs, API access, page permissions, and more — for paid enterprise licenses. That's their right, but it's not our philosophy.

Mitch-Wiki removes **all** enterprise/proprietary code and replaces it with community-built, freely-licensed alternatives. Same great wiki. No enterprise gates. No license keys. No paywalls.

---

## Features

| Category | Feature |
|---|---|
| **Editor** | Block-based rich-text editor (Tiptap), markdown support, slash commands, drag-and-drop |
| **Collaboration** | Real-time co-editing with live cursors, comments, page history |
| **Diagrams** | Built-in Mermaid, Draw.io, and Excalidraw support |
| **Organization** | Spaces, nested pages, sidebar navigation, drag-and-drop reordering |
| **Search** | Full-text search with fuzzy matching and suggestions |
| **Auth** | Password authentication + OIDC Single Sign-On (Azure AD, Google Workspace, Okta, Keycloak, Auth0) |
| **Permissions** | Workspace-level roles (Admin, Editor, Viewer) + group-based access |
| **Import/Export** | Markdown, HTML, ZIP import. Markdown, HTML, DOCX export |
| **Branding** | Custom workspace logo, favicon, and name — all via browser UI |
| **i18n** | 10+ language translations (community maintained) |
| **Self-Hosted** | Docker deployment with PostgreSQL. Redis optional. AGPL-3.0 licensed |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/mitchelljfranklin/mitch-wiki.git
cd mitch-wiki

# Copy and edit environment
cp .env.example .env

# Start with Docker Compose
docker compose up -d

# Open http://localhost:3080
```

For detailed setup, see the [documentation](https://github.com/mitchelljfranklin/mitch-wiki/tree/master/docs).

### Requirements

- Docker & Docker Compose
- PostgreSQL (included in compose)
- Redis (optional — only for multi-instance deployments)

---

## Development

```bash
# Install dependencies
pnpm install

# Start dev mode (Vite HMR + NestJS watch)
pnpm dev

# Build all packages
pnpm build

# Build docs
pnpm docs:dev
```

See [AGENTS.md](AGENTS.md) for architecture details and coding standards.

---

## Documentation

Full docs at [docs/](docs/) — built with VitePress.

```bash
pnpm docs:dev     # Dev server
pnpm docs:build   # Production build
```

---

## License

Mitch-Wiki is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

All enterprise/proprietary code from the upstream project has been removed. This fork contains no restricted or paid features.

---

## Security

See [SECURITY.md](SECURITY.md) for our security policy and vulnerability reporting process.

---

## Thanks

- **[Docmost](https://github.com/docmost/docmost)** — the upstream project that inspired this fork
- **[Crowdin](https://crowdin.com/)** — for providing access to their localization platform
