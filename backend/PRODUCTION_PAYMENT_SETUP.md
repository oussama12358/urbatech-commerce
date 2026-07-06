Stripe and PayPal production setup

This document explains the environment variables and steps required to enable production-ready payments for Stripe and PayPal.

Environment variables (backend):

- STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_...)
- STRIPE_WEBHOOK_SECRET: The webhook signing secret from your Stripe webhook endpoint (whsec_...)

- PAYPAL_CLIENT_ID: PayPal REST client id
- PAYPAL_CLIENT_SECRET: PayPal REST client secret
- PAYPAL_MODE: sandbox or live (use "live" in production)
- PAYPAL_WEBHOOK_ID: The webhook ID created in your PayPal app (used to verify webhook signatures)

- API_ORIGIN: The backend origin used in PayPal return URLs (e.g. https://api.yoursite.com)
- CLIENT_ORIGIN: The storefront origin (e.g. https://shop.yoursite.com)

Notes and checklist:

1. Node runtime
- Use Node 18+ (recommended) so `fetch` is available globally. If you cannot use Node 18+, install a fetch polyfill like `node-fetch` and load it at startup.

2. Stripe
- Create a Stripe webhook that points to: `${API_ORIGIN}/api/checkout/webhook` and subscribe to relevant events (e.g., `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `payment_intent.succeeded`).
- Set `STRIPE_WEBHOOK_SECRET` in the environment.
- Ensure the backend is reachable from Stripe (use HTTPS in production).
- The server will validate the signature and update order/payment status idempotently.

3. PayPal
- Create a PayPal REST app and retrieve `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
- Configure the app to create a webhook and note the webhook id; set it as `PAYPAL_WEBHOOK_ID`.
- Your app should provide a PayPal return URL (configured in code as `${API_ORIGIN}/api/checkout/paypal/return`) that captures approved orders.
- The webhook endpoint `${API_ORIGIN}/api/checkout/paypal/webhook` is implemented and will verify signatures using PayPal's `verify-webhook-signature` API.

4. Webhook reliability
- Use HTTPS and ensure your firewall allows inbound traffic from Stripe and PayPal.
- For PayPal, ensure the webhook is configured in the same environment (sandbox vs live) matching `PAYPAL_MODE`.

5. Admin / enabling providers
- Payment providers are stored in the `payment_providers` collection. You can enable/disable providers via the admin API: `PUT /api/admin/payment-providers/:id` (requires admin auth).

6. Testing locally
- For Stripe, use the Stripe CLI to forward webhooks to your local server and obtain a webhook secret.
- For PayPal, use sandbox accounts and create webhooks in the PayPal developer dashboard.

If you want, I can:
- Add example `.env` and a small script to run with a `node-fetch` polyfill for Node <18.
- Add automated tests for webhook handlers.
- Walk through setting up webhooks on Stripe/PayPal step-by-step.
