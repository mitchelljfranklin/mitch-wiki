# OIDC Single Sign-On

Mitch-Wiki supports Single Sign-On (SSO) through OpenID Connect (OIDC), allowing users to authenticate with any compatible identity provider.

**Supported providers include:** Azure AD (Entra ID), Google Workspace, Okta, Keycloak, Auth0, Authentik, and other OIDC-compatible IdPs.

## How to Configure

### 1. Navigate to Security Settings

Go to **Settings → Security & SSO**. Only workspace admins can manage SSO.

### 2. Add a Provider

Click **Add Provider**. The only supported type is **OpenID Connect**.

### 3. Fill in Provider Details

| Field | Description |
|---|---|
| **Provider Name** | A display name shown on the login button (e.g., "Company SSO", "Azure AD") |
| **Issuer URL** | Your IdP's OIDC discovery URL (e.g., `https://login.microsoftonline.com/{tenant-id}/v2.0`) |
| **Client ID** | The OAuth client ID from your IdP |
| **Client Secret** | The OAuth client secret from your IdP |

### 4. Copy the Redirect URI

Each provider card shows its **Redirect URI** with a copy button. Use this URL when configuring your IdP's allowed redirect/callback URLs:

```
https://{your-domain}/api/sso/oidc/{provider-id}/callback
```

### 5. Configure Your Identity Provider

In your IdP (Azure AD, Google, Okta, etc.):

- **Redirect URI / Callback URL:** The URL shown on the provider card
- **Grant Type:** Authorization Code with PKCE
- **Scopes:** `openid profile email`
- **Token Endpoint Auth Method:** `client_secret_post` (recommended) or `client_secret_basic`

### 6. Finalize

- **Allow automatic sign-up:** If enabled, new users are automatically created on first SSO login
- **Enable provider:** Activate the provider immediately (can be toggled later)

Click **Add Provider** to save.

## Login Experience

Once configured and enabled, the provider appears as a button on the login page. Users click the button to authenticate through your IdP.

To require SSO for all users, enable the **Enforce SSO** toggle on the Security settings page. When enabled, the password login form is hidden and users must authenticate via SSO.

## Editing a Provider

Click the **pencil icon** on any provider card to edit its configuration. When editing, leave the **Client Secret** field blank to keep the current secret unchanged.

## Troubleshooting

| Issue | Solution |
|---|---|
| "OIDC provider not found" | Ensure the provider is enabled and the ID in the URL matches |
| "OIDC state mismatch" | The login session expired. Try logging in again within 10 minutes |
| "OIDC nonce mismatch" | The login session expired. Try logging in again |
| "No account found" | Enable "Allow automatic sign-up" to auto-create users, or manually create the user account first |
| Provider not showing on login page | Ensure the provider is enabled AND the redirect URI is correct in your IdP |
