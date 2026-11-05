---
sidebar_position: 2
title: Stripe setup
description: Connect Stripe to Flixer, configure keys and send payment webhooks to the backend.
---

# Stripe setup

Flixer uses Stripe for card setup, one-time payments, subscription renewals and refunds. Products and prices are managed in Flixer, not as Stripe catalog entries.

## Get the API keys

1. Open the Stripe Dashboard and go to **Developers → API keys**.
2. Copy the **Publishable key** for the selected mode (`pk_test_…` for testing or `pk_live_…` for production).
3. Copy the matching **Secret key** (`sk_test_…` or `sk_live_…`). Keep the secret key private.
4. In Flixer's payment configuration, select **Stripe**, enter the publishable key and secret key, then use the connection test. The backend accepts Stripe secret keys beginning with `sk_` or restricted keys beginning with `rk_`; use a key with the required account/payment permissions.
5. Save the settings and enable payments only after the connection test succeeds.

Test and live credentials must be from the same Stripe mode. Flixer requires both a publishable key and a secret key before Stripe payments can be enabled.

## Configure webhooks

In the Stripe Dashboard, create a webhook endpoint pointing to:

```text
<server>/api/payments/webhooks/stripe
```

Replace `<server>` with the public base URL of the Flixer backend, reachable over HTTPS. Under **Select events to listen to**, select exactly these three event types:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

Other event types are acknowledged and ignored, so selecting more is harmless but unnecessary. These are also listed next to the endpoint URL in Flixer's payment settings.

After saving the endpoint, reveal its **Signing secret** (`whsec_…`) in Stripe and paste it into the **Webhook signing secret** field in Flixer's payment settings. Flixer rejects every webhook whose `Stripe-Signature` header does not verify against this secret (HMAC-SHA256, 5-minute timestamp tolerance) with `401`, and ignores the event until a secret is saved.

Flixer reads payment-intent IDs from `payment_intent.*` events and associated payment-intent IDs from `charge.*` events. It uses each event to identify a local order, then retrieves the current payment state directly from Stripe before updating the order or access. Webhooks are therefore useful for asynchronous updates and refunds; they do not replace the API checkout flow.

## Card setup and extra authentication

The browser uses Stripe's card element with a SetupIntent created by Flixer. After a successful interactive checkout that needs additional authentication, the client completes the provider flow and confirms the order through Flixer. Flixer stores the provider's payment-method reference and non-sensitive card display details, not the card number or security code.
