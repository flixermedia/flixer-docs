---
sidebar_position: 5
title: Sign in with Flixer
description: Configure OpenID Connect applications and manage connected app access.
---

# Sign in with Flixer

Flixer can authenticate users for third-party applications using OpenID Connect.
Administrators register applications in the dashboard; users sign in with their
Flixer account and approve the information each application requests.
If already signed in, users can continue with their current account or sign in
with another account. Switching accounts signs them out of Flixer in that browser.

## Configure Flixer

1. Open **Admin → OAuth Applications**.
2. Save the public HTTPS address users and applications use to reach Flixer.
   HTTP is supported only for localhost and loopback addresses.
3. Use the displayed **issuer URL** when configuring applications. Its discovery
   document is available at `<issuer>/.well-known/openid-configuration`.

Keep the public address stable. Changing it changes the issuer, may interrupt
sign-ins, and requires applications to update their issuer configuration.

## Register an application

1. Enter an application name and one or more exact redirect URIs. Redirect URIs
   must use HTTPS, except for HTTP localhost and loopback addresses.
2. Choose **Public** for a browser or mobile application, or **Confidential**
   for a server application that can keep a secret.
3. Create the application and configure it with its client ID and issuer.
   Confidential client secrets are shown only once: copy and store them safely.

Applications must use the authorization code flow with PKCE S256.
Confidential clients authenticate at the token endpoint with
`client_secret_basic`. In addition to `openid`, `profile`, and `email`,
applications may request:

| Scope | Information shared |
| --- | --- |
| `roles` | `roles`, an array containing the account role (`admin` or `user`). |
| `groups` | `groups`, an array containing the role-derived group `flixer:admin` or `flixer:user`. These are not independent group memberships. |
| `offline_access` | A refresh token for continued access after the user leaves. |
| `subscription` | `flixer_subscription_active`, a boolean, when subscription sharing is enabled for the application. |

Claims are available through the userinfo endpoint when their scopes are
approved. For example, an approved request might return:

```json
{
  "sub": "user-id",
  "roles": ["user"],
  "groups": ["flixer:user"],
  "flixer_subscription_active": true
}
```

To receive a refresh token, request `offline_access` and explicitly include
`prompt=consent` in the authorization request. Refresh tokens rotate on use;
reuse of a previously used refresh token revokes its grant. Refresh tokens and
grants expire after at most 30 days, so applications must be prepared to ask the
user to sign in again.

Subscription sharing is **off by default** for each application. An
administrator can allow it in the OAuth applications dashboard; the application
must request the `subscription` scope and the user must approve it. The boolean
is true when any subscription grants access, including a paid period or
past-due grace period. It does not disclose a plan or payment details, and does
not indicate access granted by one-time purchases or other policies.

Disabling subscription sharing removes that permission from saved approvals
and revokes all authorizations and tokens for that application, so its users
will need to authorize it again. The application may retain information it
already received.

## Access Flixer data

The OAuth resource API is read-only and uses separate permissions from identity
claims. In **Admin → OAuth Applications**, enable the data permissions that an
application may request. They are disabled by default. Each user must also
approve the requested permissions. Removing an application's permission
removes it from saved approvals and revokes that application's tokens.

| Scope | Endpoint | Information |
| --- | --- | --- |
| `subscriptions:read` | `GET /api/oauth/me/subscriptions` | Plans, status, paid-through date, grace period and cancellation. |
| `entitlements:read` | `GET /api/oauth/me/entitlements` | Active purchase, rental, registration, administrator and subscription grants. |
| `purchases:read` | `GET /api/oauth/me/purchases` | Purchase and rental order status. |
| `access:check` | `GET /api/oauth/me/access/{itemId}` | Current account access to one media item. |
| `library:read` | `GET /api/oauth/me/library` | Visible media IDs, titles, types, year and hierarchy. |
| `favorites:read` | `GET /api/oauth/me/favorites` | Favorite item IDs. |
| `playlists:read` | `GET /api/oauth/me/playlists` and `/api/oauth/me/playlists/{id}/items` | The user's own playlists, including private lists, and visible item IDs. |
| `progress:read` | `GET /api/oauth/me/progress` | Viewing progress and completion. |
| `history:read` | `GET /api/oauth/me/history` | Listening history; video progress is in the separate progress endpoint. |
| `preferences:read` | `GET /api/oauth/me/preferences` | The user's language preference. |

These are Flixer-specific OAuth scopes, not standard OIDC claims. Request the
resource indicator `<issuer>/resource` in the authorization request. For example:

```text
scope=openid%20offline_access%20subscriptions%3Aread%20entitlements%3Aread
resource=https%3A%2F%2Fflixer.example%2Fapi%2Foidc%2Fresource
prompt=consent
```

Along with the authorization code and PKCE verifier, include that same
`resource` value in the token request. The resulting access token is for the
Flixer resource API, not UserInfo. To request a UserInfo token instead, omit
`resource` from the token request. A refresh token may be exchanged for a new
token for an authorized resource by including `resource` in the refresh request.

```bash
curl 'https://flixer.example/api/oauth/me/subscriptions?limit=25&offset=0' \
  -H 'Authorization: Bearer ACCESS_TOKEN'
```

List responses contain `items` and `nextOffset` (null at the end). `limit` is
1–100 and defaults to 25; `offset` defaults to 0. Filtering restricted media
may produce an empty page with a non-null `nextOffset`, so follow the cursor
until it is null. Access checks apply the user's viewing restrictions and
paywall rules without starting a rental. OAuth clients have no device PIN unlock.
They do not receive payment credentials, filesystem paths, messages or secrets.
These APIs do not perform purchases, playback or account changes.

## Manage access

Approval is remembered per user and application. A request for additional
permissions, or an explicit consent request, asks the user to approve again.
Users can review approved permissions and revoke access under **Settings →
Connected apps**. Revoking access invalidates Flixer-issued access and refresh
tokens and unused authorization codes; the application may retain its own session or
previously received data. Deleting a client in the admin dashboard removes all
its approvals and revokes its authorizations and tokens.

Back up the database and Flixer configuration data together. The signing key
and encrypted client secrets depend on the automatically managed login secret;
rotating or losing it makes them unreadable.

## Runtime requirement

The OpenID Connect provider requires a supported Node.js LTS release. The
current default API image uses Node.js 26, which the provider warns is not an
LTS runtime; use a supported LTS runtime for production until that changes.
