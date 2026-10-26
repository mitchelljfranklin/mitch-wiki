---
sidebar_position: 5
---

# Integrations

Mitch-Wiki can enrich links in the editor with live previews ("unfurls") from
GitHub, Linear, and Figma. An integration is installed once per workspace by an
admin, then each member connects their own provider account.

| Provider | Links that get a preview | OAuth scopes |
|---|---|---|
| GitHub | Repositories, pull requests, issues, commits, files, PR/issue/release lists | `repo`, `read:user` |
| Linear | Issues, projects, initiatives, views | `read` |
| Figma | Files, prototypes, boards, designs | `file_metadata:read`, `current_user:read` |

GitLab, Jira, Azure DevOps, Slack, and Google Docs integrations are upstream
enterprise features and are not part of Mitch-Wiki.

## Requirements

- `APP_URL` set to the public origin of your instance, for example
  `https://wiki.example.com`. The OAuth callback is built from it, so a wrong
  value causes `redirect_uri_mismatch` at the provider.
- `APP_SECRET` set to a random value of at least 32 characters
  (`openssl rand -hex 32`). Integration tokens are encrypted with it. Rotating
  `APP_SECRET` makes existing connections undecryptable and members must
  reconnect.
- Outbound HTTPS access from the server to the provider APIs. The server blocks
  private and reserved destinations; see
  [Private-network providers](#private-network-providers).

Redis is optional. Without Redis, unfurl results are not cached, the OAuth
refresh lock is in-process only, and the scheduled token-refresh job does not
run — access tokens are refreshed on demand instead. Use Redis if you run more
than one application instance or want the periodic refresh job.

## 1. Create the provider OAuth app

Register one OAuth app per provider. The callback URL is always:

```text
${APP_URL}/api/integrations/oauth/<type>/callback
```

| Provider | `type` | Callback URL |
|---|---|---|
| GitHub | `github` | `https://wiki.example.com/api/integrations/oauth/github/callback` |
| Linear | `linear` | `https://wiki.example.com/api/integrations/oauth/linear/callback` |
| Figma | `figma` | `https://wiki.example.com/api/integrations/oauth/figma/callback` |

### GitHub

1. Open **Settings → Developer settings → OAuth Apps → New OAuth App** (use the
   organization's settings to own the app at the organization level).
2. Set **Homepage URL** to `APP_URL` and **Authorization callback URL** to the
   GitHub callback above.
3. Copy the **Client ID** and generate a **Client secret**.
4. Set:

```shell
INTEGRATION_GITHUB_CLIENT_ID=
INTEGRATION_GITHUB_CLIENT_SECRET=
```

### Linear

1. In Linear, open **Settings → API → Applications → New application**.
2. Set the callback URL to the Linear callback above and enable the `read`
   scope.
3. Set:

```shell
INTEGRATION_LINEAR_CLIENT_ID=
INTEGRATION_LINEAR_CLIENT_SECRET=
```

### Figma

1. Open <https://www.figma.com/developers/apps> and create a new app.
2. Add the Figma callback above as the redirect URL and enable the
   `file_metadata:read` and `current_user:read` scopes.
3. Set:

```shell
INTEGRATION_FIGMA_CLIENT_ID=
INTEGRATION_FIGMA_CLIENT_SECRET=
```

Figma uses HTTP Basic authentication for its token endpoint; Mitch-Wiki handles
that automatically.

### Environment variable naming

Credentials follow `INTEGRATION_<TYPE>_CLIENT_ID` and
`INTEGRATION_<TYPE>_CLIENT_SECRET`, where `<TYPE>` is the provider `type` in
upper case. A provider can share another product's OAuth app by setting
`credentialsKey` in its definition; none of the community providers do.

Restart the application after changing these variables. The list of available
integrations is not filtered by credentials, so a provider with missing
variables is still listed and fails on install with
`Missing environment variable: INTEGRATION_<TYPE>_CLIENT_ID`.

### GitHub Enterprise

Set `INTEGRATION_GITHUB_URL` to the root of your GitHub Enterprise Server, for
example `https://github.example.com`. OAuth endpoints, API calls, and link
patterns then use that host (`https://github.example.com/api/v3` for the API).
Leave it unset for github.com.

### Private-network providers

Outbound requests are validated by an SSRF guard. Private ranges (`10.0.0.0/8`,
`172.16.0.0/12`, `192.168.0.0/16`, `100.64.0.0/10`, `fc00::/7`) are refused
unless `ALLOWED_PRIVATE_NETWORKS` allows them. Loopback, link-local, metadata,
and reserved ranges are always blocked.

`ALLOWED_PRIVATE_NETWORKS` accepts a comma-separated list of
`[all|none,]CIDR[:port]` entries. CIDRs must have no host bits set.

```shell
# Allow one subnet on any port, plus a single host on port 443
ALLOWED_PRIVATE_NETWORKS=192.168.1.0/24,10.0.0.5/32:443

# Allow every private range (still blocks loopback/metadata/reserved)
ALLOWED_PRIVATE_NETWORKS=all
```

An invalid value fails closed: every private and reserved destination is
refused.

## 2. Install the integration (workspace admin)

1. Sign in as a workspace admin and open **Settings → Integrations**.
2. Select **Install** next to the provider and authorize the OAuth app.
3. You are returned to **Settings → Integrations**. The provider now shows
   **Uninstall**.

Installing requires the `Manage` permission on workspace settings. Uninstalling
disables the integration for the whole workspace and removes every member's
connection.

## 3. Connect an account (each member)

1. Open **Settings → Account → Connections**. The page appears once at least one
   integration is installed.
2. Select **Connect** next to the provider and authorize it.

The provider account's email address must match the member's Mitch-Wiki email
address. A provider account can be connected to only one Mitch-Wiki user per
workspace.

After connecting, links in the editor render as preview cards. For GitHub, public
repositories can be previewed with the OAuth app's own credentials even before a
member connects; private repositories require a connection. When a card cannot
be loaded without a connection, the editor shows a prompt to connect.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Missing environment variable: INTEGRATION_…_CLIENT_ID` | The variable is unset or the server was not restarted after setting it. |
| `redirect_uri_mismatch` at the provider | The provider's callback URL does not exactly match `${APP_URL}/api/integrations/oauth/<type>/callback`. `APP_URL` must be the public origin, with no path or trailing slash. |
| Redirected to `?error=oauth_failed` | The authorization was denied, the 10-minute state/nonce expired, the provider email does not match the user's email, the provider account is already linked to another user, or `APP_SECRET` changed. Retry from the start; if the email differs, use a matching account. |
| Integration installs but no previews appear | The link must match a supported pattern, the integration must be installed in the workspace, and the server needs outbound access. Private GitHub links also need a member connection. |
| `Destination host … resolves to a private address` in the logs | Add the target network to `ALLOWED_PRIVATE_NETWORKS`. |
| Previews stop working after a restart | `APP_SECRET` changed, so stored tokens cannot be decrypted. Members must reconnect. |
| `OAuth connection failed. Please try again.` | Generic callback failure; check the server logs for the provider's error response. |

## Related

- [Environment Variables](/self-hosting/environment-variables)
- [Reverse Proxy](/self-hosting/reverse-proxy/)
