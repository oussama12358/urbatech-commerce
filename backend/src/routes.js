import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { checkoutRouter } from "./modules/checkout/checkout.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { cartRouter } from "./modules/cart/cart.routes.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { suppliersRouter } from "./modules/suppliers/suppliers.routes.js";
import { paymentProvidersRouter } from "./modules/payments/payment.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "URBA TECH commerce API is live. Use /api/health, /api/products, /api/orders, /api/checkout, or /api/auth."
  });
});

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "urbatech-commerce-api" });
});

apiRouter.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/suppliers", suppliersRouter);
apiRouter.use("/payments", paymentProvidersRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/checkout", checkoutRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/cart", cartRouter);
