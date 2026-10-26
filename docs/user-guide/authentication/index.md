# Authentication

Mitch-Wiki supports multiple authentication methods to suit your deployment needs.

## Email and Password Authentication

The default authentication method uses email and password. Users register with their email address and set a password. Admins can manage user accounts from the workspace settings.

## OpenID Connect (OIDC) SSO

Mitch-Wiki supports Single Sign-On (SSO) through OpenID Connect, allowing users to authenticate using their existing identity provider. Supported providers include:

- Microsoft Azure AD (Entra ID)
- Google Workspace
- Okta
- Keycloak
- Auth0
- Authentik
- Other OIDC-compatible providers

Admins can configure multiple OIDC providers, toggle them on/off, and enforce SSO (disabling password login). For full setup instructions, see the [OIDC configuration guide](./oidc).
