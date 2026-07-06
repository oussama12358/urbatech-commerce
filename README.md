# URBA TECH INTER Commerce Fullstack

Fullstack e-commerce project for URBA TECH INTER, built with a React/Vite frontend and a Node.js/Express backend backed by MongoDB.

The application supports product browsing, guest cart management, authenticated checkout, persisted user carts, order creation, account/orders pages, and an admin catalogue/dashboard foundation.

## Tech Stack

### Frontend

- React 19
- Vite 7
- React Router 7
- Lucide React icons
- Tailwind/PostCSS setup plus custom CSS
- LocalStorage persistence for guest cart, user session, cached products, and cached orders

### Backend

- Node.js with Express 5
- MongoDB via `mongodb`
- JWT authentication
- Bcrypt password hashing
- CSRF protection and cookies
- Helmet, CORS, rate limiting, Morgan logging
- Google OAuth support, disabled until env vars are configured
- Stripe checkout placeholder, disabled until `STRIPE_SECRET_KEY` is configured
- Refresh-token cleanup cron helper and JWT signing-key rotation support

## Current Features

- Public store and product detail pages
- Guest users can add products to cart, view cart, update quantity, and remove items
- `Buy Now` adds the product to cart and sends the user to checkout
- Checkout, orders, account, and admin pages require login
- Admin accounts are redirected to `/admin/dashboard` and cannot use the client store/cart/checkout flow with the admin account
- Client accounts cannot see or access the admin UI
- If a guest clicks checkout, the app redirects to login and returns to checkout after successful auth
- Guest cart is merged with the saved user cart after login without doubling duplicate products
- Email/password signup and login
- Optional Google OAuth login
- Products API with database reads and admin product creation
- Admin product CRUD: create, edit, soft-delete, and list products
- Admin category CRUD: create, edit, delete, and list categories with product counts
- Admin storefront control: enable or disable the public store from settings
- Orders API with order item persistence
- Cart API for authenticated users
- Admin dashboard summary endpoint
- Stripe checkout session endpoint prepared for payment integration

## User Flow

```text
Store
  -> Add to Cart
  -> Cart
  -> Checkout / Buy Now
  -> Sign In if not authenticated
  -> Checkout
  -> Order
```

Guest cart behavior:

- Guest cart is stored in `localStorage`.
- After login, the local cart is merged into the server cart.
- If the same product exists in both carts, the local cart quantity wins to avoid accidental doubling.

## Project Structure

```text
urbatech-commerce-fullstack/
  package.json
  package-lock.json
  README.md

  frontend/
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
    index.html
    README.md
    src/
      main.jsx
      styles.css
      i18n.js
      app/
        App.jsx
        router.jsx
        StoreProvider.jsx
      layouts/
        ClientLayout.jsx
        AdminLayout.jsx
      client/
        components/
          Footer.jsx
          Hero.jsx
          ProductArt.jsx
          ProductCard.jsx
          SummaryBox.jsx
        pages/
          AccountPage.jsx
          CartPage.jsx
          CheckoutPage.jsx
          ForgottenPasswordPage.jsx
          LoginPage.jsx
          LogoutPage.jsx
          OrdersPage.jsx
          ProductPage.jsx
          SignupPage.jsx
          StorePage.jsx
        routes/
          ClientRoutes.jsx
      admin/
        components/
          DashboardCards.jsx
          ProductTable.jsx
          Sidebar.jsx
          Topbar.jsx
        pages/
          AddProduct.jsx
          Categories.jsx
          Customers.jsx
          Dashboard.jsx
          EditProduct.jsx
          Orders.jsx
          Products.jsx
          Settings.jsx
        routes/
          AdminRoutes.jsx
      shared/
        components/
          Loading.jsx
          NotFound.jsx
          ProtectedRoute.jsx
        hooks/
        lib/
          api.js
          format.js
          storage.js
      store/
        StoreContext.jsx

  backend/
    package.json
    README.md
    database/
      schema.sql
    scripts/
      cart-scenarios.mjs
      create-carts.mjs
      create-db.mjs
      seed-products.mjs
      set-role.mjs
    src/
      server.js
      routes.js
      config/
        env.js
      db/
        pool.js
      middleware/
        auth.js
        error-handler.js
      modules/
        admin/
          admin.routes.js
        auth/
          auth.routes.js
        cart/
          cart.routes.js
        checkout/
          checkout.routes.js
        orders/
          orders.routes.js
        products/
          products.routes.js
      utils/
        async-route.js
```

Generated folders such as `node_modules/`, `frontend/dist/`, and `logs/` are not part of the source structure above.

## Routes

### Frontend Routes

- `/store` - product catalogue
- `/product/:id` - product details
- `/cart` - public cart page
- `/checkout` - protected checkout page
- `/login` - login page
- `/signup` - signup page
- `/forgotten-password` - forgotten password page
- `/logout` - logout page
- `/account` - protected account page
- `/orders` - protected orders page
- `/admin` - redirects to admin dashboard
- `/admin/dashboard` - protected admin dashboard
- `/admin/products` - protected admin products list
- `/admin/products/new` - protected add product page
- `/admin/products/:id/edit` - protected edit product placeholder
- `/admin/orders` - protected admin orders page
- `/admin/customers` - protected customers page
- `/admin/categories` - protected categories page
- `/admin/settings` - protected settings page

### API Routes

Base URL:

```text
http://127.0.0.1:8081/api
```

Main endpoints:

- `GET /api/health`
- `GET /api/csrf-token`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/cart`
- `POST /api/cart`
- `DELETE /api/cart`
- `GET /api/orders`
- `POST /api/orders`
- `POST /api/checkout/session`
- `GET /api/admin/dashboard`
- `GET /api/settings`
- `PUT /api/settings`

Protected API routes require a JWT bearer token.

## Requirements

- Node.js 20 or newer recommended
- npm
- MongoDB if you want to run the backend locally

## Installation

Install dependencies for both apps:

```bash
npm run install:all
```

Or install them separately:

```bash
npm install --prefix frontend
npm install --prefix backend
```

## Environment Variables

Create `backend/.env` when running with local services:

```env
API_PORT=8081
CLIENT_ORIGIN=http://127.0.0.1:5173
MONGO_URL=mongodb://127.0.0.1:27017/urbatech_db
JWT_SECRET=change-this-secret
JWT_PREVIOUS_SECRETS=previous-secret-1,previous-secret-2
STRIPE_SECRET_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://127.0.0.1:8081/api/auth/google/callback
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY_LOCATION=
APPLE_PRIVATE_KEY_STRING=
APPLE_CALLBACK_URL=http://127.0.0.1:8081/api/auth/apple/callback
```

Notes:

- If Google OAuth variables are empty, Google login returns `501` and the backend prints a warning.
- If `STRIPE_SECRET_KEY` is empty, `/api/checkout/session` returns `501`.
- Vite uses port `5173` by default. If the port is busy, it may run on another port such as `5174`.
- `JWT_PREVIOUS_SECRETS` enables JWT signing-key rotation by validating tokens issued with older keys.
- Use the cron helper below to prune expired refresh tokens from the database.

## Database Setup

The backend is configured for MongoDB. Legacy SQL schema content is referenced in documentation, but the repository does not include an active SQL schema file.

Create and seed the MongoDB database:

```bash
npm run createdb --prefix backend
npm run seed --prefix backend
```

If you need to migrate data from PostgreSQL into MongoDB, use the new migration script:

```bash
cd backend
POSTGRES_URL="postgres://user:pass@host:5432/dbname" npm run migrate:sql
```

Use `--dry-run` to validate mappings without writing data, and `--reset` to clear target MongoDB collections first.

The MongoDB setup includes:

- customers
- suppliers
- categories
- products
- carts
- orders
- order_items
- payments

## Roles and Admin Access

Every new user created through signup is a client by default.

This default is defined in the database schema:

```sql
role text not null default 'Client'
```

The account page does not show the user's role. The role is used internally to decide if the user can access the admin area.

Role behavior:

- `Client`: can access store, products, cart, checkout, account, and orders.
- `admin`: can access admin dashboard, product management, order management, customers, categories, and settings.
- Admin users should not buy products with the admin account. To test the customer journey, create a separate client account.

Admin-only API behavior:

- `GET /api/admin/dashboard` requires an authenticated admin token.
- `POST /api/products` requires an authenticated admin token.
- `PUT /api/settings` requires an authenticated admin token.

### Storefront Enable / Disable

The admin can control whether the public storefront is open from:

```text
/admin/settings
```

Available options:

- `Enabled`: clients can access store, product details, cart, and checkout.
- `Disabled`: clients see a storefront closed page instead of store/cart/checkout.

The frontend reads the setting from:

```text
GET /api/settings
```

The admin updates it through:

```text
PUT /api/settings
```

### Make a User Admin

From the project root, run this in PowerShell and replace the email with the real user email:

```powershell
npm run set-role --prefix backend -- user@email.com admin
```

### Return a User to Client

From the project root, run this in PowerShell and replace the email with the real user email:

```powershell
npm run set-role --prefix backend -- user@email.com Client
```

If the email is wrong or the user does not exist, the command prints an error instead of a success message:

```text
No user found with email user@email.com
```

### Check a User Role

Use the backend role helper rather than raw SQL queries:

```powershell
npm run set-role --prefix backend -- user@email.com admin
```

After changing a role, the user must log out and log in again because the role is stored inside the JWT token at login time.

## Run Development Servers

Run frontend and backend together:

```bash
npm run dev
```

Run separately:

```bash
npm run frontend
npm run backend
```

Default URLs:

```text
Frontend: http://127.0.0.1:5173/store
Backend:  http://127.0.0.1:8081/api
Health:   http://127.0.0.1:8081/api/health
```

The frontend proxies `/api` requests to `http://127.0.0.1:8081`.

## Security & Maintenance

### Refresh token cleanup

Expired refresh tokens are pruned from MongoDB using the backend cron helper:

```bash
cd backend
npm run prune-refresh-tokens
```

Run this once per day or once per hour in production.

### JWT signing-key rotation

The backend supports validating older JWTs using `JWT_PREVIOUS_SECRETS`.

Example `.env` values:

```env
JWT_SECRET=current-secret
JWT_PREVIOUS_SECRETS=older-secret-1,older-secret-2
```

Tokens signed with any of these secrets will still be accepted until they expire.

## Build

Build the frontend:

```bash
npm run build --prefix frontend
```

Preview the production frontend build:

```bash
npm run preview --prefix frontend
```

Run the backend in production mode:

```bash
npm run start --prefix backend
```

## Useful Scripts

Root scripts:

```bash
npm run dev
npm run frontend
npm run backend
npm run install:all
```

Frontend scripts:

```bash
npm run dev --prefix frontend
npm run build --prefix frontend
npm run preview --prefix frontend
```

Backend scripts:

```bash
npm run dev --prefix backend
npm run start --prefix backend
npm run createdb --prefix backend
npm run seed --prefix backend
npm run set-role --prefix backend -- user@email.com admin
npm run cart-scenarios --prefix backend
```

## Production TODO

- Add stricter role protection for admin APIs and admin frontend routes
- Complete Stripe or another payment provider integration
- Add invoice and proforma PDF generation
- Add order status management
- Add product images/media uploads
- Add password reset email delivery
- Add automated tests for cart merge, checkout redirect, auth, orders, and admin flows
