# URBA TECH INTER Commerce

URBA TECH INTER Commerce is a full-stack commerce platform for smart-city and infrastructure equipment. It combines a customer Store, secure order and payment processing, supplier fulfilment, package-level tracking, and an administrative operations workspace.

## Platform overview

| Area | Capabilities |
| --- | --- |
| Store | Product catalogue, product details, display-currency preference, guest and authenticated cart |
| Orders | Server-authoritative prices, one normalized payment currency, FX snapshots, inventory reservation, refunds |
| Payments | Card via Stripe, PayPal, Konnect, Paymee, and Flouci when configured |
| Suppliers | API and Excel/CSV suppliers, dispatch retries, status synchronization, package-level tracking |
| Operations | Admin dashboard, products, categories, orders, customers, suppliers, payments, settlements, reports, settings |
| Notifications | Resend transactional email for customers, suppliers, and administrators |

## Technology

- **Frontend:** React 19, Vite 7, React Router, Lucide icons
- **Backend:** Node.js, Express 5, MongoDB
- **Security:** JWT bearer authentication, refresh-token rotation, bcrypt, Helmet, CORS, CSRF protection for cookie refresh, rate limiting, request IDs
- **Payments:** provider-hosted/tokenized flows; raw card numbers and CVV are never stored by URBA TECH

## Currency model

The platform keeps these concepts separate:

1. **Product base currency** — product price source of truth.
2. **Store display currency** — browsing preference only.
3. **Order/payment currency** — one backend-determined normalized currency for the order.
4. **Customer card/account currency** — handled by the customer's bank/card issuer.

The Store display preference cannot alter Cart, Checkout, Order, Payment, or Refund values. Orders retain line-level and order-level FX snapshots; refunds use the original payment currency.

## Supplier fulfilment and tracking

```text
Verified paid order
  → supplier dispatches (one per supplier)
  → physical packages (one or more per dispatch)
  → carrier + tracking for each package
  → customer order tracking
```

Supplier adapters normalize `packages`, `shipments`, or `parcels` responses into one internal `packages[]` format. Legacy supplier dispatches with one carrier/tracking number continue to work. A multi-package dispatch is never updated from an ambiguous generic tracking update; the supplier must send package data or an identifier.

Customer tracking responses contain only products, quantities, public delivery status, carrier, tracking number, and valid tracking URL. They do not expose supplier IDs, supplier product IDs, costs, payables, commissions, credentials, or API metadata.

## Supplier settlements

- One settlement is created per supplier/order after verified payment and supplier dispatch.
- Amount and currency are snapshotted; later FX changes do not rewrite them.
- Manual methods require a real transfer reference and can record a different actual payment amount/currency.
- Stripe Connect supports idempotent automatic transfers when the supplier connected account is configured.
- PayPal Payouts remains `processing` until the Admin reconciliation action confirms the provider result.
- Konnect, Paymee, and Flouci are customer checkout gateways; they are not represented as automatic supplier-disbursement APIs.

## Prerequisites

- Node.js 20+
- npm
- MongoDB

## Installation

```bash
npm run install:all
```

Copy `backend/.env.example` to `backend/.env`, then fill in only the server-side credentials for the services you intend to enable.

## Development

```bash
npm run dev
```

Default URLs:

- Store: `http://127.0.0.1:5173/store`
- API health: `http://127.0.0.1:8081/api/health`

## Scripts

```bash
# Production frontend build
npm run build --prefix frontend

# Currency/order-currency tests
npm run test:currencies --prefix backend

# Shipment, package, adapter, and tracking tests
node --test backend/tests/shipment-serialization.test.mjs

# Create and seed MongoDB data
npm run createdb --prefix backend
npm run seed --prefix backend

# Production API process
npm run start --prefix backend
```

## Production deployment

Read [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) before deploying. The complete environment template is [backend/.env.example](backend/.env.example), and payment configuration is documented in [backend/PRODUCTION_PAYMENT_SETUP.md](backend/PRODUCTION_PAYMENT_SETUP.md).

At minimum, production needs HTTPS origins, MongoDB, a secure JWT secret, a verified email sender, and valid credentials/webhooks for each payment provider enabled in Admin.

## Security principles

- Never expose server credentials in frontend variables or Admin UI.
- Never commit real `.env` credentials.
- Backend calculations are authoritative for prices, payment amounts, currencies, refunds, and settlements.
- Customer APIs never expose internal supplier financial or integration data.
