# Quick Start

This guide gets you running with Mitch-Wiki in under 5 minutes using Docker.

## Prerequisites

- Docker and Docker Compose installed
- 2GB+ available RAM

## Installation

1. Create a directory and download the compose file:

```shell
mkdir mitch-wiki
cd mitch-wiki
curl -O https://raw.githubusercontent.com/mitchelljfranklin/mitch-wiki/main/docker-compose.yml
```

2. Start the containers:

```shell
docker compose up -d
```

3. Open [http://localhost:3080](http://localhost:3080) in your browser.

4. Complete the setup wizard to create your workspace and admin account.

## First Steps

After setup:

- **Create your first space** — Spaces help you organize pages by team, project, or topic.
- **Start writing pages** — Use the real-time editor with Markdown support, tables, and diagrams.
- **Invite team members** — Go to Settings to invite users to your workspace.
- **Customize branding** — Update your workspace name, logo, and settings via Settings > Workspace.

## Next Steps

- [Configuration](/self-hosting/configuration) — Set up email, file storage, and AI
- [Environment Variables](/self-hosting/environment-variables) — Full reference of available variables
- [Reverse Proxy](/self-hosting/reverse-proxy/) — Set up HTTPS with Caddy, Traefik, or Nginx
