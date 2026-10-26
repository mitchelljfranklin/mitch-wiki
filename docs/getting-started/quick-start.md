# Quick Start

This guide gets you running with Mitch-Wiki in under 5 minutes using Docker.

## Prerequisites

- Docker and Docker Compose installed
- 2GB+ available RAM

## One-Command Setup

Create a `docker-compose.yml` file with the content below, then run `docker compose up -d`:

```yaml
services:
  app:
    image: ghcr.io/mitchelljfranklin/mitch-wiki:latest
    container_name: mitch-wiki
    depends_on:
      db:
        condition: service_healthy
    environment:
      APP_URL: "http://localhost:3080"
      APP_SECRET: "REPLACE_WITH_LONG_SECRET_KEY"
      DATABASE_URL: "postgresql://mitch_wiki:STRONG_DB_PASSWORD@db:5432/mitch_wiki"
      # Uncomment if using Redis (optional — only needed for multi-instance deployments)
      # REDIS_URL: "redis://redis:6379"
      PORT: "3000"
      STORAGE_DRIVER: "local"
      MAIL_DRIVER: "smtp"
      # MailHog is for dev/testing only. Replace with your real SMTP provider for production.
      SMTP_HOST: "mailhog"
      SMTP_PORT: "1025"
      SMTP_USERNAME: ""
      SMTP_PASSWORD: ""
      MAIL_FROM_ADDRESS: "noreply@mitch-wiki.local"
      MAIL_FROM_NAME: "Mitch Wiki"
    ports:
      - "3080:3000"
    restart: unless-stopped
    volumes:
      - mitch_wiki_data:/app/data/storage

  db:
    image: postgres:18
    container_name: mitch-wiki-db
    environment:
      POSTGRES_DB: mitch_wiki
      POSTGRES_USER: mitch_wiki
      POSTGRES_PASSWORD: STRONG_DB_PASSWORD
    restart: unless-stopped
    volumes:
      - db_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mitch_wiki -d mitch_wiki"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis is optional — only needed for multi-instance deployments.
  # Uncomment the redis service and REDIS_URL above to enable.
  # redis:
  #   image: redis:8
  #   container_name: mitch-wiki-redis
  #   command: ["redis-server", "--appendonly", "yes", "--maxmemory-policy", "noeviction"]
  #   restart: unless-stopped
  #   volumes:
  #     - redis_data:/data
  #   healthcheck:
  #     test: ["CMD", "redis-cli", "ping"]
  #     interval: 5s
  #     timeout: 5s
  #     retries: 5

  # MailHog catches outgoing email and provides a web UI at :8025.
  # Remove or comment out for production — configure your real SMTP server instead.
  mailhog:
    image: mailhog/mailhog:latest
    container_name: mitch-wiki-mailhog
    ports:
      - "8025:8025"
    restart: unless-stopped

volumes:
  mitch_wiki_data:
  db_data:
  # redis_data:  # Uncomment if using Redis
```

## Configuration Steps

1. **Generate a secret key** and replace `REPLACE_WITH_LONG_SECRET_KEY`:
   ```shell
   openssl rand -hex 32
   ```

2. **Set a database password** — replace both `STRONG_DB_PASSWORD` values with a secure password.

3. **Start the stack**:
   ```shell
   docker compose up -d
   ```

4. **Open** [http://localhost:3080](http://localhost:3080) and complete the setup wizard.

:::warning Production Email
MailHog is a development tool that captures outgoing email in a web UI. For production, **remove the `mailhog` service** and replace the SMTP settings with your real email provider (Mailgun, SendGrid, Postmark, etc.). See [Configuration](/self-hosting/configuration#email).
:::

:::tip Optional: Redis
Redis is only needed for multi-instance high-availability deployments. For single-server setups, leave it commented out — Mitch-Wiki runs fine without it.
:::

:::tip ARM / Raspberry Pi
The `ghcr.io/mitchelljfranklin/mitch-wiki:latest` image is multi-arch and works on both amd64 and arm64 (Raspberry Pi 4/5).
:::

## First Steps

After setup:

- **Create your first space** — Spaces help you organize pages by team, project, or topic.
- **Start writing pages** — Use the real-time editor with Markdown support, tables, and diagrams.
- **Invite team members** — Go to Settings to invite users to your workspace.
- **Customize branding** — Update your workspace name, logo, and settings via Settings > Workspace.

## Upgrade

```shell
docker compose down
docker pull ghcr.io/mitchelljfranklin/mitch-wiki:latest
docker compose up -d
```

## Next Steps

- [Installation](/self-hosting/installation) — Detailed production deployment
- [Configuration](/self-hosting/configuration) — Set up email, file storage, and AI
- [Reverse Proxy](/self-hosting/reverse-proxy/) — Set up HTTPS with Caddy, Traefik, or Nginx
- [API Reference](/api-reference/overview) — Automate with the REST API
