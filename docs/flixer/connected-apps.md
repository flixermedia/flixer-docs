---
sidebar_position: 5
title: Sign in with Flixer
description: Configure OpenID Connect applications and manage connected app access.
---

# Sign in with Flixer

Flixer can authenticate users for third-party applications using OpenID Connect.
Administrators register applications in the dashboard; users sign in with their
Flixer account and approve the information each application requests.

## Configure Flixer

1. Open **Admin → API Keys → OAuth applications**.
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
`client_secret_basic`. Supported scopes are `openid`, `profile`, and `email`.
Flixer does not issue refresh tokens.

## Manage access

Approval is remembered per user and application. A request for additional
permissions, or an explicit consent request, asks the user to approve again.
Users can review approved permissions and revoke access under **Settings →
Connected apps**. Revoking access invalidates Flixer-issued access tokens and
unused authorization codes; the application may retain its own session or
previously received data. Deleting a client in the admin dashboard removes all
its approvals and revokes its authorizations and tokens.

Back up the database and Flixer configuration data together. The signing key
and encrypted client secrets depend on the automatically managed login secret;
rotating or losing it makes them unreadable.

## Runtime requirement

The OpenID Connect provider requires a supported Node.js LTS release. The
current default API image uses Node.js 26, which the provider warns is not an
LTS runtime; use a supported LTS runtime for production until that changes.
