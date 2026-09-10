# URBA TECH INTER — Production Checklist

Complete every unchecked item in the production environment before accepting live customer payments.

## Infrastructure and security

- [ ] Set `NODE_ENV=production`.
- [ ] Set public HTTPS `API_ORIGIN` and `CLIENT_ORIGIN` values.
- [ ] Set a long, unique `JWT_SECRET`; never use the development default.
- [ ] Use managed MongoDB and test both backup and restore.
- [ ] Enforce HTTPS at the reverse proxy/hosting platform.
- [ ] Restrict `CLIENT_ORIGIN` to the production frontend domain.
- [ ] Configure `ADMIN_NOTIFICATION_EMAILS`.
- [x] Helmet, CORS, JWT bearer authorization, cookie-refresh CSRF protection, request IDs, and API rate limiting are implemented.
- [ ] Add external error monitoring and production alerting.

## Email

- [ ] Verify the Resend domain/DNS records and set `RESEND_API_KEY`.
- [ ] Set `EMAIL_FROM` to the monitored business address, normally `URBA TECH <contact@urbatechinter.com>`.
- [ ] Set `EMAIL_SYSTEM_FROM` to the automated address, normally `URBA TECH <noreply@urbatechinter.com>`.
- [ ] Test verification, password reset, order, fulfillment, supplier, and settlement emails.

## Customer payments

Orders become paid only after provider confirmation is verified server-side. A browser redirect never marks an order as paid.

- [ ] **Stripe/Card:** set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; register `${API_ORIGIN}/api/checkout/webhook`; test success, 3DS, cancellation, duplicate webhook, changed amount, and refund.
- [ ] **PayPal:** set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=live`, and `PAYPAL_WEBHOOK_ID`; register `${API_ORIGIN}/api/checkout/paypal/webhook`; test signature verification and refunds.
- [ ] **Konnect / Paymee / Flouci:** add production credentials, configure their callbacks/webhooks, and complete sandbox tests before enabling them.
- [ ] Enable only the providers that have real configured credentials in Admin Payments.

## Currency, refunds, and settlements

- [x] Product base currency, Store display currency, and actual order/payment currency are separate.
- [x] Order and FX snapshots are kept; refunds use original payment currency.
- [x] Supplier settlement amount/currency is snapshotted and is not recalculated by later FX refreshes.
- [ ] Configure reporting/order currency in Admin Settings before live orders.
- [ ] Test multi-currency checkout, JPY/HUF/TWD rounding, refunds, and reporting totals.
- [ ] Configure every supplier payout destination and payout currency.
- [ ] For manual settlements, retain a real transfer reference and record actual amount/currency when different from the locked settlement.
- [ ] For Stripe Connect, verify each connected account and supported payout currency.
- [ ] For PayPal Payouts, enable Payouts in the Business account and test reconciliation. Current implementation uses the Settlements refresh/reconcile action; there is no dedicated PayPal Payout webhook or perpetual polling worker yet.

## Suppliers, fulfilment, and tracking

- [x] Supplier dispatches and retry jobs are implemented.
- [x] One dispatch supports one or more physical packages with independent carrier/tracking/status.
- [x] Customer APIs expose only safe shipment/package data; supplier identity, costs, payables, credentials, and API metadata remain hidden.
- [ ] Configure every API supplier's endpoint, credentials, webhook secret, and field mappings.
- [ ] Test CSV/manual suppliers, API suppliers, multi-supplier orders, single-package shipments, and multi-package shipments.
- [ ] Ensure multi-package supplier updates send `packages[]` or a package/shipment/parcel identifier. Ambiguous generic tracking updates are intentionally not assigned at random.
- [ ] Confirm carrier/tracking remains visible without a URL and Track appears only for a valid custom or known-carrier URL.

## Final verification

- [ ] Run `npm run test:currencies --prefix backend`.
- [ ] Run `node --test backend/tests/shipment-serialization.test.mjs`.
- [ ] Run `npm run build --prefix frontend`.
- [ ] Complete a staging journey: payment → paid → dispatch → tracking → settlement → refund.
- [ ] Confirm the rollback and database restore procedure with the deployment owner.

## Required environment variables

Use `backend/.env.example` as the full template. Never expose credentials through frontend `VITE_` variables or commit real secrets.

```env
NODE_ENV=production
API_ORIGIN=https://api.example.com
CLIENT_ORIGIN=https://www.example.com
MONGO_URL=mongodb+srv://...
JWT_SECRET=<long-random-secret>
RESEND_API_KEY=<resend-key>
EMAIL_FROM="URBA TECH <contact@urbatechinter.com>"
EMAIL_SYSTEM_FROM="URBA TECH <noreply@urbatechinter.com>"

STRIPE_SECRET_KEY=<stripe-secret>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
PAYPAL_CLIENT_ID=<paypal-client-id>
PAYPAL_CLIENT_SECRET=<paypal-client-secret>
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=<paypal-webhook-id>

KONNECT_API_KEY=<konnect-key>
KONNECT_RECEIVER_WALLET_ID=<wallet-id>
PAYMEE_API_KEY=<paymee-key>
PAYMEE_MODE=live
FLOUCI_PUBLIC_KEY=<flouci-public-key>
FLOUCI_PRIVATE_KEY=<flouci-private-key>
```
