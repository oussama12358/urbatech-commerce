import './polyfills/fetch.js';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import crypto from "crypto";
import { apiRouter } from "./routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { connectMongo } from "./db/mongo.js";
import { startBackgroundJobs } from "./modules/jobs/background-jobs.js";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// Relax rate limiting in development so HMR / repeated reloads don't trigger 429s
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
app.use(helmet());

// Request-id middleware: prefer incoming X-Request-Id (from proxy), otherwise generate one
app.use((req, res, next) => {
  const incoming = req.headers['x-request-id'];
  const id = incoming || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`);
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  console.log(`[req:${id}] ${req.method} ${req.originalUrl}`);
  next();
});
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buf) => {
    if (req.originalUrl === "/api/checkout/webhook" || req.originalUrl === "/api/checkout/paypal/webhook") {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.set("trust proxy", 1);
app.use(
  session({
    secret: env.jwtSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax"
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(apiLimiter);

// CSRF protection - only for routes that use cookie-based auth
// Regular API endpoints use JWT Bearer tokens (Authorization header)
// which are immune to CSRF. Only /auth/refresh uses HttpOnly cookie.
const csrfProtection = csurf({ cookie: true });

// Apply CSRF protection selectively to cookie-dependent routes only
app.use((req, res, next) => {
  // Skip CSRF for webhooks and public endpoints
  if (
    req.path.startsWith("/api/suppliers/webhooks/") ||
    req.path === "/api/checkout/webhook" ||
    req.path === "/api/checkout/paypal/webhook"
  ) {
    next();
    return;
  }
  
  // Only apply CSRF to /api/auth/refresh which uses cookies
  // JWT Bearer endpoints don't need CSRF
  if (req.path === "/api/auth/refresh") {
    return csrfProtection(req, res, next);
  }
  
  // For csrf-token endpoint, we still need the token function
  if (req.path === "/api/csrf-token") {
    return csrfProtection(req, res, next);
  }
  
  next();
});

app.use((req, res, next) => {
  // Set XSRF-TOKEN cookie for the frontend (only if csrfToken is available)
  if (typeof req.csrfToken === "function") {
    try {
      res.cookie("XSRF-TOKEN", req.csrfToken(), { sameSite: "lax", httpOnly: false });
    } catch (e) {
      // ignore
    }
  }
  next();
});

app.use("/api", apiRouter);
app.use(errorHandler);

// Global error handlers for better visibility and graceful shutdown
process.on('unhandledRejection', (reason, promise) => {
  console.error('[unhandledRejection] reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] error:', err && (err.stack || err.message || err));
  try {
    serverCleanup().finally(() => process.exit(1));
  } catch (e) {
    process.exit(1);
  }
});

let server;
let backgroundJobTimers = [];
connectMongo()
  .then(() => {
    server = app.listen(env.port, () => {
      console.log(`URBA TECH commerce API listening on http://127.0.0.1:${env.port}/api`);
    });
    backgroundJobTimers = startBackgroundJobs();
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

async function serverCleanup() {
  try {
    backgroundJobTimers.forEach((timer) => clearInterval(timer));
    if (server && typeof server.close === 'function') {
      console.log('Shutting down HTTP server...');
      await new Promise((resolve) => server.close(resolve));
    }
  } catch (e) {}
  try {
    console.log('Closing MongoDB connection...');
    await (await connectMongo()).close();
  } catch (e) {}
}
