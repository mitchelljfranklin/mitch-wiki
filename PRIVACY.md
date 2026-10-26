# Privacy Policy

## Overview

Mitch-Wiki is self-hosted software. We do **not** collect, store, or process any user data. Your data stays on your servers.

## What Mitch-Wiki Does

- **Self-hosted:** You run Mitch-Wiki on your own infrastructure. All data (user accounts, pages, files, settings) remains in your database and storage.
- **No analytics:** Telemetry is **disabled by default**. No usage data is sent to any third party.
- **No tracking:** There are no trackers, cookies for analytics, or third-party scripts embedded in the application.
- **No accounts required from us:** You don't need an account with us to use the software. Authentication is handled entirely on your instance.

## What Mitch-Wiki Does NOT Do

- Does **not** collect analytics or usage data
- Does **not** phone home
- Does **not** include any telemetry (disabled since fork)
- Does **not** embed third-party trackers or ads
- Does **not** require internet access to function (fully offline-capable)

## Data You Control

As the operator of a Mitch-Wiki instance, you are responsible for:

- **User data:** Email addresses, names, and any content created by users
- **Content:** Pages, attachments, diagrams, comments, and all workspace data
- **Authentication:** User credentials and OIDC provider configurations
- **Storage:** File attachments are stored in your configured storage (local, S3, or Azure)

## Third-Party Services

Mitch-Wiki integrates with external services **only when you configure them**:

- **OIDC Identity Providers:** If you enable SSO, user authentication data is exchanged with your configured IdP
- **Email:** If configured, transactional emails (invitations, password resets) are sent via your SMTP server
- **Storage:** File uploads go to your configured storage driver

None of these integrations share data with the Mitch-Wiki project or any third party.

## Questions

If you have questions about data handling or privacy, contact us at `privacy@mitch-wiki.local`.
