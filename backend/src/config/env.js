import "dotenv/config";

export const env = {
  port: Number(process.env.API_PORT || 8081),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173",
  mongoUrl: process.env.MONGO_URL || "mongodb://127.0.0.1:27017/urbatech_db",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  // API origin (useful for PayPal return URLs). Defaults to local backend.
  apiOrigin: process.env.API_ORIGIN || `http://127.0.0.1:${process.env.API_PORT || 8081}`,
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://127.0.0.1:8081/api/auth/google/callback",
  appleClientId: process.env.APPLE_CLIENT_ID || "",
  appleTeamId: process.env.APPLE_TEAM_ID || "",
  appleKeyId: process.env.APPLE_KEY_ID || "",
  applePrivateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION || "",
  applePrivateKeyString: process.env.APPLE_PRIVATE_KEY_STRING || "",
  appleCallbackUrl: process.env.APPLE_CALLBACK_URL || "http://127.0.0.1:8081/api/auth/apple/callback",
  emailFrom: process.env.EMAIL_FROM || "URBA TECH <noreply@urbatechinter.com>",
  resendApiKey: process.env.RESEND_API_KEY || "",
  // PayPal credentials (set for enabling PayPal payments)
  paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
  // 'sandbox' or 'live'
  paypalMode: process.env.PAYPAL_MODE || "sandbox",
  // PayPal webhook ID (from PayPal app webhook configuration) for signature verification
  paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID || "",
  // Supplier sync interval: use MS directly, or fallback to minutes. Default is 60 minutes.
  supplierSyncIntervalMs: Number(process.env.SUPPLIER_SYNC_INTERVAL_MS || 0) || (Number(process.env.SUPPLIER_SYNC_INTERVAL_MINUTES || 0) * 60 * 1000) || 60 * 60 * 1000,
  // Set to "true" to completely disable email verification flow (signup, verify, login)
  disableEmailVerification: process.env.DISABLE_EMAIL_VERIFICATION === "false" || process.env.DISABLE_EMAIL_VERIFICATION === "1",
  // Rotate JWT signing keys by keeping previous secrets for verification.
  jwtPreviousSecrets: process.env.JWT_PREVIOUS_SECRETS ? process.env.JWT_PREVIOUS_SECRETS.split(",").filter(Boolean) : [],
  jwtVerificationSecrets: [
    process.env.JWT_SECRET || "dev-secret",
    ...(process.env.JWT_PREVIOUS_SECRETS ? process.env.JWT_PREVIOUS_SECRETS.split(",") : [])
  ].filter(Boolean),
  // When true, set refresh cookie SameSite to 'strict' (may break some OAuth redirect flows)
  enforceSameSiteStrict: process.env.ENFORCE_SAMESITE_STRICT === "true"
};
