---
sidebar_position: 4
---

# Caddy

Caddy is a modern web server with automatic HTTPS built in. It obtains and renews SSL certificates from Let's Encrypt automatically with no additional configuration.

## Docker Compose with Caddy

Create a `Caddyfile` in the same directory as your `docker-compose.yml`:
Replace `mitch-wiki.example.com` with your actual domain.

```text title="Caddyfile"
mitch-wiki.example.com {
    reverse_proxy app:3000
}
```

Below is a full `docker-compose.yml` that includes Mitch-Wiki with Caddy as the reverse proxy.

```yaml title="docker-compose.yml"
services:
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
    restart: unless-stopped

  app:
    image: ghcr.io/mitchelljfranklin/mitch-wiki:latest
    depends_on:
      - db
    environment:
      APP_URL: 'https://mitch-wiki.example.com'
      APP_SECRET: 'REPLACE_WITH_LONG_SECRET'
      DATABASE_URL: 'postgresql://mitch_wiki:STRONG_DB_PASSWORD@db:5432/mitch_wiki'
    ports:
      - "3000:3000"
    restart: unless-stopped
    volumes:
      - mitch_wiki_data:/app/data/storage

  db:
    image: postgres:18
    environment:
      POSTGRES_DB: mitch_wiki
      POSTGRES_USER: mitch_wiki
      POSTGRES_PASSWORD: STRONG_DB_PASSWORD
    restart: unless-stopped
    volumes:
      - db_data:/var/lib/postgresql

volumes:
  mitch_wiki_data:
  db_data:
  caddy_data:
  caddy_config:
```

That's it. Caddy automatically handles SSL certificates and WebSocket connections.

## File Structure

```
mitch-wiki/
├── docker-compose.yml
└── Caddyfile
```

## Verify

After starting the services with `docker compose up -d`, navigate to `https://mitch-wiki.example.com` in your browser. You should see the Mitch-Wiki setup page.
