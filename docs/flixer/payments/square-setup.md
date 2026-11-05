---
sidebar_position: 3
title: Square setup
description: Connect Square to Flixer with an application, access token and location, then configure webhooks and sandbox testing.
---

# Square setup

Flixer uses Square for card setup, one-time payments, subscription renewals and refunds. Products and subscription plans are managed in Flixer; no Square catalog is required.

## Get the application details and access token

1. In the Square Developer Dashboard, create or select the application you will use with Flixer.
2. Copy its **Application ID** and an **Access token** for the intended environment from the application's credentials page.
3. In the Square Dashboard, identify the **Location ID** that should receive payments. The Flixer connection test checks whether the configured location is available to the access token.
4. In Flixer payment configuration, select **Square**; enter the application ID, location ID and access token; and choose **Sandbox** or **Production** to match the credentials. Test the connection, save the settings, then enable payments.

All three values—application ID, location ID and access token—are required to enable Square. Use sandbox credentials with **Sandbox** and production credentials with **Production**.

## Configure webhooks

Add a Square webhook subscription with this notification URL:

```text
<server>/api/payments/webhooks/square
```

Replace `<server>` with the public base URL of the Flixer backend, reachable over HTTPS. Copy the subscription's **Signature key** into Flixer's payment settings, and enter the notification URL there exactly as registered in Square, because Square signs the URL together with the body. Flixer rejects any request whose `x-square-hmacsha256-signature` header does not verify with `401`. Under **Events**, select exactly these four:

- `payment.created`
- `payment.updated`
- `refund.created`
- `refund.updated`

Other event types are acknowledged and ignored, so selecting more is harmless but unnecessary. The handler uses event IDs and payment/refund references from the payload to locate an order, then fetches the latest payment state from Square using the configured access token.

## Sandbox testing

Use the Square Sandbox environment and its matching application credentials and location while testing. The browser card element tokenizes card details into a Square source token; Flixer sends that token to Square to attach a card. Do not mix sandbox and production credentials. Before accepting real payments, switch the environment and all credentials to Production and verify the connection again.
