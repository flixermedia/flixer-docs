---
sidebar_position: 1
title: Payments overview and concepts
description: Configure Flixer's optional payment system, content scopes, purchases, rentals, subscriptions, registration fees, taxes and coupons.
---

# Payments overview and concepts

Flixer's payments system is optional and **off by default**. When enabled, choose one active provider—Stripe or Square—and configure it in Flixer. Flixer owns the products, plans, scopes and entitlements; you do not need to create products or subscription plans in the provider dashboard. Prices are configured in Flixer and can have multiple currencies.

Payments only gate content covered by an active product, plan or paid-registration unlock scope. Other content stays free. Administrators are always exempt from paywalls.

## Paywall scopes

A product, plan, or registration unlock can apply to:

- **All** content.
- **Kind:** movies, TV, music or guide.
- **Item:** a selected media item and its descendants in the media tree. For example, a series scope covers its seasons and episodes; an album scope covers its tracks.
- **Artist:** items whose music metadata names that artist.

Scopes may be used on their own or together on a plan. The API resolves item descendants and artist names from indexed media metadata.

## Purchases, rentals and subscriptions

- **Buy:** a one-time purchase grants an entitlement to its configured scope without an expiry.
- **Rent:** a one-time payment grants access for the configured number of hours. The rental can begin at purchase or at first play. First-play rentals must be started within 30 days of purchase.
- **Subscription:** monthly or yearly plans grant access to their configured scopes while access is active. Plans can include a free trial (up to 365 days); a user can receive a plan's trial only once. Flixer charges the saved card for renewals.

Users can manage saved cards and their subscriptions, and see order and entitlement history through the payment API. Admins can manage products, plans, orders, subscriptions, and coupons.

### Always require a separate purchase

A product can be marked **Always require a separate purchase**. Content covered by that product then ignores blanket access: a paid registration that unlocks everything, a subscription, an "everything" or category grant, and grandfathered status do not unlock it. Only buying or renting that product (or an admin granting that content directly) does. Administrators are still exempt.

## Registration paywall

Registration payments are configured separately from content products. An administrator can set registration to:

- **One-time fee:** choose prices and whether payment unlocks all content, selected scopes, or no content entitlement.
- **Subscription:** select the plan new accounts must subscribe to.

When payments are enabled and correctly configured, new accounts must add a card even if no registration fee is set. When a registration charge is required, it is collected as part of signup; a failed card setup or charge prevents account creation from completing.

## Grandfathering and access rules

By default, accounts created before payments were first enabled are grandfathered and retain access to paid scopes. The administrator can disable this behavior in payment settings. New accounts are evaluated against the current paywall scopes and their entitlements or active subscriptions. Admin accounts remain exempt regardless of configuration.

## Grace period

A failed subscription renewal moves the subscription into a past-due state and preserves access through its grace window. The default is **3 days**; administrators can set it from **0 to 30 days**. Flixer retries renewals while the grace period remains. After the window expires, the subscription no longer grants access.

## Currencies

Choose the currencies you sell in under **Settings → Currencies** and one default currency. The list offers a curated set of 23 currencies, narrowed to what the active provider supports (Square supports fewer than Stripe). Price editors for products, plans, coupons and the registration fee only offer the enabled currencies, and the backend rejects prices in any other currency. Currencies with unusual minor-unit rules (for example ISK or UGX) are not offered.

## Receipts

Order history in **Billing** shows a **Receipt** button on paid and refunded orders. Flixer fetches the provider's hosted receipt link on demand; if the provider has none for an order, the button reports that no receipt is available.

## Signup and payment

When registration requires a card, signup has two slides. The first collects the account details; its button reads **Continue to payment**. Submitting it creates the account straight away, and the second slide then asks for the card (and the registration fee, if one is set).

Until the card is saved, the account is **pending payment** and cannot sign in or use the server. If the bank asks the customer to approve the registration charge (3-D Secure), the approval pops up on the payment slide and the signup finishes once it is confirmed. If the card or charge is declined, the form starts a fresh card session and the person can try again as many times as needed.

The pending state is stored on the server, so it survives a reload and a change of browser or device. Reloading the page returns to the payment slide. Signing in with a pending account on any device shows the payment slide before the sign-in completes. A payment session lasts 24 hours; after that the person signs in again to start a new one. Turning payments off releases all pending accounts. Admin accounts and accounts created by an admin are never pending.

## Coupons

Coupons can provide a percentage discount or a fixed discount in one or more currencies. Administrators can optionally set an expiry, redemption limit, and restrictions to selected products or plans. Coupon codes are entered during checkout; Flixer applies eligible discounts before calculating tax.

## Tax

Tax is configured in Flixer as up to ten named percentage rates. Choose whether the configured rates are **inclusive** (included in the displayed amount) or **exclusive** (added to the price). Flixer calculates the amounts using the configured rates; this is not automatic tax determination, so administrators are responsible for entering applicable rates.

## Refunds and complimentary access

Administrators can issue a full or partial refund on a paid order. A full refund revokes entitlements granted by that order; a partial refund does not automatically revoke them. Subscription cancellation and refunds are separate actions.

Administrators can also grant a user complimentary access to any scope. A grant can be indefinite or expire after a specified number of hours, and can be revoked later.

## Receipt emails

When mail is configured, every successful payment sends a Flixer-themed receipt. It shows the poster of the purchased or rented title, the rental period, the price breakdown with any coupon and tax, and a button that opens the title. The poster is served through a signed link, so it loads in mail clients without a login.

The receipt is the `purchase-receipt` email template. Edit it under the mail templates settings like any other template. Its **Template keys** panel lists every key you can use, grouped as everywhere (`appName`, `appUrl`, `year`), account and payments (`title`, `kind`, `detail`, `posterUrl`, `subtotal`, `discount`, `tax`, `total`, `orderId`, `date`, `watchUrl`, `watchLabel`). `{{#if name}}...{{/if}}` blocks show their content only when that value is set.

## Provider and API setup

Configure a provider and confirm its credentials before enabling payments. See [Stripe setup](./stripe-setup.md), [Square setup](./square-setup.md), [security notes](./security.md), and [troubleshooting](./troubleshooting.md).

The API exposes public payment status at `GET /api/payments/status` and administrator configuration at `GET/PUT /api/admin/payments/config`; test saved or unsaved credentials with `POST /api/admin/payments/config/test`. These routes are relative to the backend host. Administrative routes require an administrator session or administrator-owned API key.
