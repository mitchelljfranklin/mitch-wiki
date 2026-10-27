---
sidebar_position: 4
---

# Environment Variables

To configure your application, set the following environment variables. These variables control various aspects of the application's behavior, including URLs, database connections, and third-party integrations.

## Application Configuration

| Variable              | Example                       | Description                                                                                      |
|-----------------------|-------------------------------|--------------------------------------------------------------------------------------------------|
| `APP_URL`             | `https://mitch-wiki.example.com` | The base URL of your application. It is optional, but useful for correct email links.            |
| `APP_SECRET`           | `LONG_SECRET_KEY`             | A secure key for application security (32 chars minimum).  Generate with `openssl rand -hex 32`. |
| `PORT`                | `3000`                        | The port on which the application will run.                                                      |
| `JWT_TOKEN_EXPIRES_IN` | `30d`                         | The expiration time for JSON Web Tokens (JWT). The default is 30 days.                           |

## Database Configuration

| Variable       | Example                                                               | Description                                      |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/mitch_wiki?schema=public` | The connection URL for your PostgreSQL database. |

## Redis Configuration

| Variable    | Example                  | Description                                             |
| ----------- | ------------------------ |---------------------------------------------------------|
| `REDIS_URL` | `redis://127.0.0.1:6379` | Optional. The connection URL for your Redis server.<br/> **Format**: `redis://username:password@host:port/db-number`. Without it, caching and collab coordination use single-instance in-memory fallbacks and background jobs (imports, exports, email, history) run in the web process. |

## Storage Configuration

### Using Local storage

| Variable            | Example | Description                                        |
|---------------------|---------|----------------------------------------------------|
| `STORAGE_DRIVER`    | `local` | The storage driver to use for file storage.        |

### Using S3-compatible storage

| Variable                   | Example | Description                                      |
| -------------------------- | ------- | ------------------------------------------------ |
| `STORAGE_DRIVER`           | `s3`    | The storage driver to use for file storage.      |
| `AWS_S3_ACCESS_KEY_ID`     |         | Your AWS S3 access key ID.                       |
| `AWS_S3_SECRET_ACCESS_KEY` |         | Your AWS S3 secret access key.                   |
| `AWS_S3_REGION`            |         | The region where your S3 bucket is located.      |
| `AWS_S3_BUCKET`            |         | The name of your S3 bucket.                      |
| `AWS_S3_ENDPOINT`          |         | The endpoint URL for your S3 service (optional). |
| `AWS_S3_FORCE_PATH_STYLE`  | `true`  | Force the request to use path-style addressing (optional). |

### Using Azure Blob Storage

| Variable                       | Example | Description                                                |
| ------------------------------ | ------- | ---------------------------------------------------------- |
| `STORAGE_DRIVER`               | `azure` | The storage driver to use for file storage.                |
| `AZURE_STORAGE_ACCOUNT_NAME`   |         | Your Azure Storage account name.                           |
| `AZURE_STORAGE_ACCOUNT_KEY`    |         | Your Azure Storage account key.                            |
| `AZURE_STORAGE_CONTAINER`      |         | The name of your blob container.                           |


### Storage file upload limits

| Variable                 | Example | Description                                           |
|--------------------------|---------|-------------------------------------------------------|
| `FILE_UPLOAD_SIZE_LIMIT` | `50mb`  | The maximum file size per upload. Default is 50mb.    |
| `FILE_IMPORT_SIZE_LIMIT` | `100mb` | The maximum file import size limit. Default is 200mb. |


## Email Configuration

### Using SMTP

| Variable    | Example             | Description                                      |
|-------------| ------------------- | ------------------------------------------------ |
| `MAIL_DRIVER` | `smtp`              | The mail driver to use for sending emails.       |
| `SMTP_HOST` | `smtp.example.com`  | The SMTP server to use for sending emails.       |
| `SMTP_PORT` | `587`               | The port to use for the SMTP server.             |
| `SMTP_USERNAME` |                     | The username for the SMTP server.                |
| `SMTP_PASSWORD` |                     | The password for the SMTP server.                |
| `SMTP_SECURE` | `false`               | Use TLS when connecting to the server, typically for port 465. Defaults to false. [See nodemailer 'secure' for details](https://nodemailer.com/smtp/)  |
| `MAIL_FROM_ADDRESS` | `hello@example.com` | The email address that emails will be sent from. |
| `MAIL_FROM_NAME` | `Mitch Wiki`           | The name that emails will be sent from.          |

### Using Postmark

| Variable            | Example             | Description                                                     |
| ------------------- | ------------------- | --------------------------------------------------------------- |
| `MAIL_DRIVER`       | `postmark`          | The mail driver to use for sending emails.                      |
| `POSTMARK_TOKEN`    |                     | The token for Postmark, if using Postmark as the `MAIL_DRIVER`. |
| `MAIL_FROM_ADDRESS` | `hello@example.com` | The email address that emails will be sent from.                |
| `MAIL_FROM_NAME`    | `Mitch Wiki`           | The name that emails will be sent from.                         |

## Integrations

See [Integrations](/self-hosting/integrations) for provider setup and callback URLs. Each provider reads its own OAuth app credentials.

| Variable | Example | Description |
|---|---|---|
| `INTEGRATION_GITHUB_CLIENT_ID` | | GitHub OAuth app client ID. |
| `INTEGRATION_GITHUB_CLIENT_SECRET` | | GitHub OAuth app client secret. |
| `INTEGRATION_GITHUB_URL` | `https://github.example.com` | Optional. GitHub Enterprise Server root. Leave unset for github.com. |
| `INTEGRATION_LINEAR_CLIENT_ID` | | Linear OAuth app client ID. |
| `INTEGRATION_LINEAR_CLIENT_SECRET` | | Linear OAuth app client secret. |
| `INTEGRATION_FIGMA_CLIENT_ID` | | Figma OAuth app client ID. |
| `INTEGRATION_FIGMA_CLIENT_SECRET` | | Figma OAuth app client secret. |
| `ALLOWED_PRIVATE_NETWORKS` | `192.168.1.0/24` | Optional. Comma-separated `[all\|none,]CIDR[:port]` allowlist for outbound integration requests to private networks. Defaults to `none`; loopback, link-local, metadata, and reserved ranges are always blocked. |

## AI Configuration

AI features (chat and AI search) are enterprise-only upstream and are not part of
Mitch-Wiki. The `AI_*`, `OPENAI_*`, `GEMINI_API_KEY`, and `OLLAMA_API_URL`
variables are still accepted for upstream compatibility but nothing in this fork
uses them; leave them unset.

## DRAW.IO (Diagrams.net) configuration
The default Draw.io embed url is `https://embed.diagrams.net`.
| Variable  | Example                  | Description                |
|-----------| ------------------------ |----------------------------|
| `DRAWIO_URL` | `https://embed.diagrams.net` | Your custom draw.io server url. |

## Search Configuration

| Variable            | Example                   | Description                                                                                                                                                                                      |
|---------------------|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SEARCH_DRIVER`     | `postgres`               | The search engine driver to use. Default is `postgres` (database search).         |

## Security

### Iframe embedding

By default, Mitch-Wiki blocks other origins from embedding your instance in an `<iframe>`. This protects users against clickjacking attacks where a malicious site loads Mitch-Wiki in a hidden frame and tricks signed-in users into clicking destructive actions. Out of the box, Mitch-Wiki responds with `X-Frame-Options: SAMEORIGIN`, so only pages served from your own Mitch-Wiki origin can iframe Mitch-Wiki content.

Public shared pages (`/share/...`) are exempt from this restriction and can always be embedded from any origin. Shares are public, read-only content with no authenticated actions, so they have no clickjacking surface.

If you legitimately need to embed the rest of Mitch-Wiki (the app itself) inside another tool, for example an intranet portal or LMS, use the variables below.

| Variable                 | Example                                                   | Description                                                                                                                                                                                                                                                                                                  |
|--------------------------|-----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `IFRAME_EMBED_ALLOWED`   | `false`                                                   | Master switch for external iframe embedding. Defaults to `false`, which emits `X-Frame-Options: SAMEORIGIN`. Set to `true` to permit external embedding.                                                                                                                                                     |
| `IFRAME_ALLOWED_ORIGINS` | `https://intranet.example.com,https://portal.example.com` | Optional comma-separated allowlist. Only consulted when `IFRAME_EMBED_ALLOWED=true`. When provided, Mitch-Wiki emits `Content-Security-Policy: frame-ancestors 'self' <origins>` instead of `X-Frame-Options`. When empty, embedding is allowed from any origin. |

## Telemetry
We anonymously collect the active version, user count, page count, space and workspace count.

| Variable  | Example                  | Description                |
|-----------| ------------------------ |----------------------------|
| `DISABLE_TELEMETRY` | `true` | To disable telemetry |
