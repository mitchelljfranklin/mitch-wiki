# API Reference

Mitch-Wiki exposes a REST API for programmatic access to wiki resources. All authenticated endpoints accept both cookie-based user sessions and Bearer token API keys.

## Authentication

API keys are created by workspace admins via **Settings → API Management**. The key is a signed JWT shown once at creation — save it immediately.

Include the key in the `Authorization` header:

```bash
curl -X POST https://your-instance.com/api/pages/info \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pageId": "019fdbfa-..."}'
```

## Conventions

- **All endpoints use POST**. GET is reserved for file downloads and health checks.
- **Content-Type**: POST requests without a body MUST include `Content-Type: application/json`.
- **Response format**: All responses return `{"data": ..., "success": true, "status": 200}`.
- **Errors**: Use standard HTTP status codes (400, 403, 404) with a JSON body containing the error message.
- **API keys inherit the creator's permissions**. If the creator is an editor, the API key can create and edit pages. If the creator is an admin, the key has full access.

## Pagination

List endpoints accept pagination parameters in the request body:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | Items per page (1-100) |
| `cursor` | string | null | Pagination cursor for the next page |
| `beforeCursor` | string | null | Pagination cursor for the previous page |
| `query` | string | null | Optional search filter |

---

## Endpoints

### Pages

**Get page info**
```bash
curl -X POST /api/pages/info \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pageId": "019fdbfa-..."}'
```

**Create a page**
```bash
curl -X POST /api/pages/create \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "spaceId": "019fdbfa-...",
    "title": "My New Page",
    "parentPageId": null
  }'
```

**Update a page**
```bash
curl -X POST /api/pages/update \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "019fdbfa-...",
    "title": "Updated Title",
    "content": {"type": "doc", "content": []},
    "operation": "replace",
    "format": "json"
  }'
```

**Get sidebar pages** (page tree in a space)
```bash
curl -X POST /api/pages/sidebar-pages \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"spaceId": "019fdbfa-...", "limit": 50}'
```

**Delete a page**
```bash
curl -X POST /api/pages/delete \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pageId": "019fdbfa-..."}'
```

**Get page history**
```bash
curl -X POST /api/pages/history \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pageId": "019fdbfa-...", "limit": 20}'
```

**Move a page**
```bash
curl -X POST /api/pages/move \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "019fdbfa-...",
    "position": "a000000000",
    "parentPageId": null
  }'
```

**Duplicate a page**
```bash
curl -X POST /api/pages/duplicate \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pageId": "019fdbfa-..."}'
```

**Get page breadcrumbs**
```bash
curl -X POST /api/pages/breadcrumbs \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pageId": "019fdbfa-..."}'
```

### Spaces

**List spaces**
```bash
curl -X POST /api/spaces \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'
```

**Get space info**
```bash
curl -X POST /api/spaces/info \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"spaceId": "019fdbfa-..."}'
```

**Create a space** (admin only)
```bash
curl -X POST /api/spaces/create \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Engineering", "slug": "engineering"}'
```

**Update a space** (space admin)
```bash
curl -X POST /api/spaces/update \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"spaceId": "019fdbfa-...", "name": "Updated Name"}'
```

### Search

**Full-text search**
```bash
curl -X POST /api/search \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "getting started", "limit": 20}'
```

**Search suggestions** (pages, users, groups)
```bash
curl -X POST /api/search/suggest \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "api", "includePages": true}'
```

### Comments

**List comments on a page**
```bash
curl -X POST /api/comments \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pageId": "019fdbfa-...", "limit": 50}'
```

**Create a comment**
```bash
curl -X POST /api/comments/create \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "019fdbfa-...",
    "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Great page!"}]}]}
  }'
```

**Delete a comment** (owner or space admin)
```bash
curl -X POST /api/comments/delete \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"commentId": "019fdbfa-..."}'
```

### Files

**Upload a file**
```bash
curl -X POST /api/files/upload \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@document.pdf" \
  -F "pageId=019fdbfa-..."
```

**Download a file**
```bash
curl /api/files/{fileId}/{fileName} \
  -H "Authorization: Bearer $API_KEY" \
  -o document.pdf
```

### Users

**Get current user info**
```bash
curl -X POST /api/users/me \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Update user profile**
```bash
curl -X POST /api/users/update \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "locale": "en-US"}'
```

### Workspace

**Get workspace info**
```bash
curl -X POST /api/workspace/info \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Labels

**List labels**
```bash
curl -X POST /api/labels \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "page", "limit": 50}'
```

**Find pages by label**
```bash
curl -X POST /api/labels/pages \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "api", "limit": 20}'
```

### Favorites

**List favorites**
```bash
curl -X POST /api/favorites \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "page", "limit": 20}'
```

**Add to favorites**
```bash
curl -X POST /api/favorites/add \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "page", "pageId": "019fdbfa-..."}'
```

**Remove from favorites**
```bash
curl -X POST /api/favorites/remove \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "page", "pageId": "019fdbfa-..."}'
```

---

## Full Endpoint Reference

This page covers the most commonly used endpoints (~25). The complete API has ~55+ endpoints covering:

- **Workspace** — members, invitations, settings, entitlements
- **Groups** — CRUD, member management
- **Notifications** — list, mark read, unread count
- **Sessions** — list active sessions, revoke
- **Page History** — revision list, specific revision details
- **Backlinks** — incoming and outgoing page references
- **Page Transclusion** — sync block references
- **Export** — page and space export
- **Import** — file import (markdown, HTML, ZIP)
- **Watchers** — page watch/unwatch/status

For the complete list, see the controller files in `apps/server/src/core/`.
