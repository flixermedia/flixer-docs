---
sidebar_position: 2
title: Quick start
description: Install Flixer through the official installer and add your first library.
---

# Quick start

Use the official installer at [get.flixer.dev](https://get.flixer.dev). It
downloads the current Compose files, guides you through installation choices,
and starts the Flixer stack.

## Requirements

- **macOS:** Docker Desktop and Docker Compose.
- **Linux:** Docker Engine and the Compose plugin. Automatic Docker
  installation is available on Debian and Ubuntu.
- **Windows:** WSL 2 with Ubuntu (or another supported WSL distribution) and a
  local Docker Engine installed inside WSL. Docker Desktop is not supported by
  the Windows installer.

## Install

On macOS or supported Linux, run:

```bash
curl -fsSL https://get.flixer.dev | bash
```

On Windows, download and run the PowerShell installer:

```powershell
Invoke-WebRequest -UseBasicParsing https://get.flixer.dev/install.ps1 -OutFile install-flixer.ps1
powershell -ExecutionPolicy Bypass -File .\install-flixer.ps1
```

The Windows installer uses WSL's local Linux Docker Engine. If needed, install
Ubuntu and Docker Engine inside WSL before running it:

```powershell
wsl --install -d Ubuntu
```

The installer prompts for the installation and storage locations, media
folder, and optional features. AI is enabled by default and may download
models. To review all installer options, open [get.flixer.dev](https://get.flixer.dev)
or [get.flixer.dev/install.ps1](https://get.flixer.dev/install.ps1).

## Finish setup

1. Open the address printed by the installer (default: `http://localhost:8080`).
2. Follow the setup wizard to connect a database and create the first
   administrator. The standard installation includes PostgreSQL and Redis.
3. In **Admin → Libraries**, create a library from folders under your media
   root and start a scan.
4. When scanning finishes, browse a title and start playback.

Flixer does not require folder names such as `Movies` or `Music`. Create
libraries from the folders that actually exist in your media root.

For ongoing maintenance, see [Deployment and operations](../operations/deployment.md).
