---
sidebar_position: 5
title: Payments troubleshooting
description: Diagnose provider setup, checkout, webhook, and subscription access problems.
---

# Payments troubleshooting

## Payments are unavailable or disabled

- Payments are **off by default**. Check the `enabled` setting and selected provider in Flixer's admin payment configuration.
- Confirm all required credentials are present: Stripe needs a publishable key and secret key; Square needs an application ID, location ID and access token.
- Run the provider connection test (`POST /api/admin/payments/config/test`). For Square, confirm the token can access the configured location. For Stripe, confirm the key belongs to the intended test/live mode and that the account can accept charges.

## Card setup or checkout fails

- Make sure the browser SDK uses the public configuration returned by `GET /api/payments/status`, and that its environment matches the provider credentials configured on the backend.
- A new account must complete card setup whenever payments are enabled, even when registration itself has no fee.
- If Stripe requires additional authentication, complete the card element flow and let the client call `POST /api/payments/orders/:orderId/confirm`.
- Square card setup can request bank verification. If verification is cancelled or fails, retry the card form or use another card. If the bank still requires verification after the challenge, contact the administrator; completing the challenge does not guarantee that the subsequent charge will succeed.
- Flixer reports common declines and verification failures in plain language. Administrators can check `PAYMENT_PROVIDER_ERROR` in the server logs for the provider's error codes and status, then consult the provider's dashboard for transaction details.
- Check the user's order status and failure message in the admin order list. Verify that a default card and provider customer are present for subscription renewals.
- For a free trial, the initial subscription charge may be zero; a card is still required as part of signup when payments are enabled.

## Webhook events do not update orders or refunds

- Check that the provider endpoint exactly matches `<server>/api/payments/webhooks/stripe` or `<server>/api/payments/webhooks/square`, and that it is reachable from the provider.
- Ensure the configured provider is the one sending the event and that test events go to test credentials (and sandbox events to Square Sandbox).
- For Stripe, send `payment_intent.succeeded`, `payment_intent.payment_failed` and `charge.refunded`. For Square, subscribe to payment and refund events.
- A `401 Invalid webhook signature` means the saved signing secret (Stripe) or signature key and notification URL (Square) do not match the provider endpoint. Re-copy them, check test versus live mode, and make sure the URL has no proxy rewrite or trailing difference.
- Flixer re-fetches payment state from the provider API. A misconfigured, expired or wrong-mode credential can prevent reconciliation even if the webhook delivery itself succeeds.

## A subscription lost access after a failed renewal

A failed renewal preserves access only through the configured grace period (3 days by default, configurable from 0 to 30 days). Have the user update the saved card and check the subscription status and `graceUntil`. Once the grace window expires, the subscription no longer unlocks its scopes; a successful renewal or a new subscription is required.

## Content appears locked unexpectedly

- Confirm payments are active and that the item matches an active product, plan, or registration unlock scope. Check kind, selected item/descendants, and artist metadata.
- Check the user's entitlements and subscription state. A rental may have expired; a first-play rental must be started within 30 days of purchase.
- Existing users are grandfathered by default only when they were created before payments were first enabled and grandfathering remains enabled. Administrators are always exempt.
- An administrator can grant the required scope as complimentary access or review/revoke an existing grant.

## Full refund did not revoke access, or partial refund did

A full refund revokes entitlements created by that order. A partial refund leaves those entitlements unchanged. Subscription cancellations are managed separately from order refunds.
