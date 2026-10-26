# Configuration

## Email
To send emails, you will have to configure the email driver. This is necessary for inviting new users to your workspace.
Mitch-Wiki supports both SMTP and Postmark email drivers.

#### Using SMTP
```shell
MAIL_DRIVER=smtp
SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_SECURE=
MAIL_FROM_ADDRESS=hello@example.com
MAIL_FROM_NAME=Mitch Wiki
```

### Using Postmark:
```shell
MAIL_DRIVER=postmark
POSTMARK_TOKEN=
MAIL_FROM_ADDRESS=hello@example.com
MAIL_FROM_NAME=Mitch Wiki
```

## File Storage
Mitch-Wiki supports local storage, S3-compatible storage, and Azure Blob Storage drivers. The default driver is `local storage`.
```shell
STORAGE_DRIVER=local
```

### Using S3-Compatible Storage
If you wish to use an S3-compatible storage, you have to add the below environment variables:

```shell
STORAGE_DRIVER=s3
AWS_S3_ACCESS_KEY_ID=
AWS_S3_SECRET_ACCESS_KEY=
AWS_S3_REGION=
AWS_S3_BUCKET=
AWS_S3_ENDPOINT=
AWS_S3_FORCE_PATH_STYLE=
```

Being S3-compatible means Mitch-Wiki can work with AWS S3, Backblaze, Wasabi, DigitalOcean Spaces, Minio, and other S3-compatible providers.

### Using Azure Blob Storage
If you wish to use Azure Blob Storage, you have to add the below environment variables:

```shell
STORAGE_DRIVER=azure
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_ACCOUNT_KEY=
AZURE_STORAGE_CONTAINER=
```


### File upload size limit
The maximum file size that can be uploaded on the editor.
```shell
FILE_UPLOAD_SIZE_LIMIT=100mb
```

### File import size limit
The maximum size limit for an import file.
```shell
FILE_IMPORT_SIZE_LIMIT=200mb
```

## AI
### OpenAI / Azure OpenAI
```shell
AI_DRIVER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
AI_EMBEDDING_MODEL=text-embedding-3-small
AI_COMPLETION_MODEL=gpt-4o-mini
# optional
OPENAI_API_URL=
# AI_EMBEDDING_SUPPORTS_MRL=false
```

### OpenAI-Compatible
```shell
AI_DRIVER=openai-compatible
OPENAI_API_KEY=your-api-key
OPENAI_API_URL=https://api.your_provider.com/v1
AI_EMBEDDING_MODEL=your-embedding-model
AI_COMPLETION_MODEL=your-completion-model
# optional
AI_EMBEDDING_DIMENSION=1024
AI_EMBEDDING_SUPPORTS_MRL=false
```

### Google Gemini
```shell
AI_DRIVER=gemini
GEMINI_API_KEY=AIzaSyxxxxx
AI_EMBEDDING_MODEL=gemini-embedding-001
AI_COMPLETION_MODEL=gemini-2.5-flash
```

### Ollama
```shell
AI_DRIVER=ollama
OLLAMA_API_URL=http://localhost:11434
AI_EMBEDDING_MODEL=nomic-embed-text
AI_COMPLETION_MODEL=qwen2.5:7b
```

## Search

By default, Mitch-Wiki uses the database for full-text search.

## Iframe embedding
Mitch-Wiki blocks other origins from embedding your instance in an `<iframe>` by default.

**Public shared pages (`/share/...`) are exempt and can always be embedded from any origin**, regardless of the settings below.

### Allow embedding from any origin

```shell
IFRAME_EMBED_ALLOWED=true
```

When `IFRAME_EMBED_ALLOWED=true` and no allowlist is provided, Mitch-Wiki emits no framing header, so any origin can embed it.

### Allow embedding from specific origins

```shell
IFRAME_EMBED_ALLOWED=true
IFRAME_ALLOWED_ORIGINS=https://intranet.example.com,https://portal.example.com
```

## Telemetry
We anonymously collect the active version, user count, page count, space and workspace count.
To disable telemetry:
```shell
DISABLE_TELEMETRY=true
```


Refer to the [Environment Variables](/self-hosting/environment-variables) to see all available environment variables.
