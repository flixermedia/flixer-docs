---
sidebar_position: 4
title: Payment security notes
description: How Flixer protects payment credentials, verifies webhook-driven state, and handles card data.
---

# Payment security notes

## Protect provider credentials

Stripe secret keys and Square access tokens are stored encrypted in the Flixer database. Encryption uses AES-256-GCM with a key derived from `APP_SECRET`; payment credential storage requires `APP_SECRET` to be at least 32 bytes. Keep this value private, back it up securely, and preserve it when moving or restoring the database. If the secret changes, previously encrypted payment credentials cannot be decrypted.

Never publish a Stripe secret key or Square access token in a client app, source repository, or support log. Flixer masks saved secrets in administrator configuration responses. Sending the mask or omitting a secret field keeps its saved value; supply a new secret to rotate it.

## Webhooks are signed and verified

Every webhook must carry a valid provider signature: Stripe's `Stripe-Signature` (checked against the webhook signing secret, with a 5-minute replay window) or Square's `x-square-hmacsha256-signature` (checked against the signature key and the notification URL). Unsigned or incorrectly signed requests are rejected with `401` before anything is read. The signing secrets are stored encrypted and masked like other credentials.

As defense in depth, the payload is still only used to identify a provider event and payment. Before changing an order or entitlement, Flixer fetches the current payment state directly from Stripe or Square using its stored credentials. Configure the exact Flixer webhook URL, restrict who can change the provider endpoint, and use HTTPS. Events are de-duplicated by event ID.

## Card data

Card entry uses the provider's browser SDK/tokenization flow (Stripe Elements and SetupIntents, or Square's Web Payments SDK and source token). Full card numbers and CVC values do not pass through or get stored by Flixer. Flixer receives provider setup references or tokens and stores the provider's card reference plus display metadata such as brand, last four digits and expiration date.

## Operational guidance

- Use test/sandbox credentials for validation, then switch all related credentials and environment settings together before production.
- Limit administrator access to payment configuration and order/refund routes.
- Use a reliable database backup strategy. The encrypted credentials depend on the same `APP_SECRET` being available after restore.
