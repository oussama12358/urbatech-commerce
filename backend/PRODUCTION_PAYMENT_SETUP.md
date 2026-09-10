# Production payment setup

Every payment provider has a server-side checkout flow. An order becomes **Paid** only after the provider's verified confirmation, then supplier dispatch starts. A browser redirect alone can never mark an order paid.

## Shared requirements

- Use public **HTTPS** values for `API_ORIGIN` and `CLIENT_ORIGIN` in production.
- Put provider credentials only in `backend/.env` or encrypted deployment settings. Never use frontend variables.
- Restart the backend after changing environment variables, then enable the configured provider in Admin → Payments.

## Stripe

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Webhook: `${API_ORIGIN}/api/checkout/webhook`
- Subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.

## PayPal

- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`, `PAYPAL_WEBHOOK_ID`
- Return URL: `${API_ORIGIN}/api/checkout/paypal/return`
- Webhook: `${API_ORIGIN}/api/checkout/paypal/webhook`
- The backend checks PayPal's webhook signature before accepting payment.

## Konnect

- `KONNECT_API_KEY`, `KONNECT_RECEIVER_WALLET_ID`
- Optional `KONNECT_API_BASE_URL` (production default: `https://api.konnect.network/api/v2`)
- Webhook: `${API_ORIGIN}/api/checkout/konnect/webhook`
- The webhook's `payment_ref` is never trusted by itself: URBA TECH fetches the payment from Konnect and checks completed status, successful transaction, order ID, currency, and reached amount.
- This adapter supports TND, EUR and USD.

## Paymee

- `PAYMEE_API_KEY`, `PAYMEE_MODE` (`sandbox` or `live`)
- Webhook: `${API_ORIGIN}/api/checkout/paymee/webhook`
- The backend verifies Paymee's `check_sum`, token, order ID and amount before marking the order paid.
- Checkout displays “Payment in TND only.” as an informational provider hint. URBA TECH sends the actual normalized order currency; Paymee accepts or rejects the request according to its own API response.

## Flouci

- `FLOUCI_PUBLIC_KEY`, `FLOUCI_PRIVATE_KEY`
- Optional `FLOUCI_API_BASE_URL` (default: `https://developers.flouci.com/api/v2`)
- Webhook: `${API_ORIGIN}/api/checkout/flouci/webhook`
- Every notification triggers a server-side `verify_payment` call. It requires `SUCCESS`, the expected millime amount and the matching order ID.
- Checkout displays “Payment in TND only.” as an informational provider hint. URBA TECH sends the actual normalized order currency; Flouci accepts or rejects the request according to its own API response.

## Safe tests

Use each provider's sandbox/test account first. Test success, cancellation, duplicate webhooks, changed amount and unsupported currency. Confirm a supplier order is dispatched once, only after a verified paid order.
