---
sidebar_position: 7
title: Admin dashboard
description: A practical guide to the main Flixer administration tools.
---

# Admin dashboard

Open **Admin** from Flixer Web to manage the server. Available sections depend
on the services and optional features enabled in your installation.

| Section | Use it to |
| --- | --- |
| **Overview** | Check service status, library counts, and recent activity. |
| **Libraries** | Create libraries, select folders, manage network shares, and start scans. |
| **Media** | Review indexed items and correct metadata or artwork. |
| **Indexer** | Check scan progress, configure metadata providers, and manage queued work. |
| **Users and devices** | Create or disable accounts, revoke sessions, and manage API keys. |
| **Logging** | Search application events and inspect recent service activity. |
| **Settings** | Configure email, monitoring, and other server options. |
| **Payments and plugins** | Set up optional features when they are available in your release. |

## Set up a library

1. If your media is on an SMB share, connect it from **Libraries** first.
2. Select **Add library**, choose a type, and select one or more folders.
3. Save the library and start a scan.
4. Follow scan status in the Libraries or Indexer section.

## Manage access safely

Use administrator accounts only for server management. Give users only the
access they need, revoke sessions when a device should be signed out, and copy
new API keys to a secure location when they are created.

To let third-party applications use Flixer accounts, see
[Sign in with Flixer](../flixer/connected-apps.md).

For service status and log troubleshooting, see
[Deployment and operations](../operations/deployment.md). For media-specific
settings, see [Libraries and media](../flixer/libraries-and-media.md).
