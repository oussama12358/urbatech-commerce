import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import { env } from "../../config/env.js";
import { getCollection, createId } from "../../db/mongo.js";
import { requireAuth } from "../../middleware/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../utils/email.js";

// Note: rate limiting removed per user request; resend works without limits

const googleEnabled = Boolean(env.googleClientId && env.googleClientSecret && env.googleCallbackUrl);
const appleEnabled = Boolean(
  env.appleClientId &&
  env.appleTeamId &&
  env.appleKeyId &&
  (env.applePrivateKeyLocation || env.applePrivateKeyString) &&
  env.appleCallbackUrl
);

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl,
        passReqToCallback: false
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google profile did not provide an email"));
          }

          let user = await findUserByEmail(email);
          if (!user) {
            const name = profile.displayName || profile.name?.givenName || "Google user";
            user = await createUser(name, email, null, null, { provider: "google", providers: ["google"] });
          } else if (!user.providers?.includes("google")) {
            const providers = Array.from(new Set([...(user.providers || [user.provider].filter(Boolean)), "google"]));
            await getCollection("customers").updateOne({ id: user.id }, { $set: { providers } });
          }

          return done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
}

if (appleEnabled) {
  passport.use(
    new AppleStrategy(
      {
        clientID: env.appleClientId,
        teamID: env.appleTeamId,
        keyID: env.appleKeyId,
        callbackURL: env.appleCallbackUrl,
        privateKeyLocation: env.applePrivateKeyLocation || undefined,
        privateKeyString: env.applePrivateKeyString || undefined,
        passReqToCallback: true
      },
      async (req, _accessToken, _refreshToken, idToken, _profile, done) => {
        try {
          const applePayload = jwt.decode(idToken) || {};
          const appleId = applePayload.sub;
          if (!appleId) {
            return done(new Error("Apple id token did not contain sub"));
          }

          let email = applePayload.email;
          let name = null;
          if (req.body?.user) {
            try {
              const appleUser = JSON.parse(req.body.user);
              email = email || appleUser.email;
              if (appleUser.name) {
                const firstName = appleUser.name.firstName || "";
                const lastName = appleUser.name.lastName || "";
                name = `${firstName} ${lastName}`.trim() || null;
              }
            } catch (error) {
              // ignore malformed Apple user payload
            }
          }

          let user = await findUserByAppleId(appleId);
          if (!user && email) {
            user = await findUserByEmail(email);
          }

          if (!user) {
            if (!email) {
              return done(new Error("Apple profile did not provide an email"));
            }
            const displayName = name || "Apple user";
            user = await createUser(displayName, email, null, null, { appleId, provider: "apple", providers: ["apple"] });
          } else {
            const update = {};
            if (!user.appleId) {
              update.appleId = appleId;
            }
            if (!user.providers?.includes("apple")) {
              update.providers = Array.from(new Set([...(user.providers || [user.provider].filter(Boolean)), "apple"]));
            }
            if (Object.keys(update).length > 0) {
              await getCollection("customers").updateOne({ id: user.id }, { $set: update });
            }
          }

          return done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
}

if (googleEnabled || appleEnabled) {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await findUserById(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });
}

if (!googleEnabled) {
  console.warn("Google OAuth is not configured: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are required.");
}

if (!appleEnabled) {
  console.warn(
    "Apple OAuth is not configured: APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CALLBACK_URL, and APPLE_PRIVATE_KEY_STRING or APPLE_PRIVATE_KEY_LOCATION are required."
  );
}

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, "must contain an uppercase letter").regex(/[a-z]/, "must contain a lowercase letter").regex(/\d/, "must contain a number").regex(/[^A-Za-z0-9]/, "must contain a symbol"),
  country_code: z.string().length(2).optional(),
  country: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).regex(/[A-Z]/, "must contain an uppercase letter").regex(/[a-z]/, "must contain a lowercase letter").regex(/\d/, "must contain a number").regex(/[^A-Za-z0-9]/, "must contain a symbol")
});

async function createUser(name, email, hashedPassword, verificationToken = null, extraFields = {}) {
  const customers = await getCollection("customers");
  const user = {
    id: createId(),
    name,
    email,
    password: hashedPassword,
    role: "Client",
    provider: extraFields.provider || "local",
    providers: extraFields.providers || [extraFields.provider || "local"],
    emailVerified: env.disableEmailVerification ? true : false,
    status: extraFields.status ?? "active",
    verificationToken: verificationToken,
    verificationTokenExpiry: verificationToken ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    created_at: new Date(),
    ...extraFields
  };
  await customers.insertOne(user);
  return user;
}

async function findUserByEmail(email) {
  const customers = await getCollection("customers");
  return customers.findOne({ email });
}

async function findUserByAppleId(appleId) {
  const customers = await getCollection("customers");
  return customers.findOne({ appleId });
}

async function findUserById(id) {
  const customers = await getCollection("customers");
  return customers.findOne({ id });
}

const ACCESS_TOKEN_EXPIRES_IN = "4h";
const SESSION_MAX_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const REMEMBER_REFRESH_TOKEN_DAYS = 90;
const SESSION_REFRESH_TOKEN_DAYS = 1;

function createRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function addRefreshToken(userId, token, expiresAt, remember, meta = {}) {
  const customers = await getCollection("customers");
  const tokenHash = hashToken(token);
  const record = {
    tokenHash,
    expiresAt,
    remember: Boolean(remember),
    createdAt: new Date(),
    loginAt: meta.loginAt || new Date(),
    ip: meta.ip || null,
    userAgent: meta.userAgent || null
  };
  await customers.updateOne({ id: userId }, { $push: { refreshTokens: record } });
}

async function removeRefreshToken(userId, token) {
  const customers = await getCollection("customers");
  const tokenHash = hashToken(token);
  await customers.updateOne({ id: userId }, { $pull: { refreshTokens: { tokenHash } } });
}

async function findUserByRefreshToken(token) {
  const customers = await getCollection("customers");
  const tokenHash = hashToken(token);
  return customers.findOne({ "refreshTokens.tokenHash": tokenHash });
}

export const authRouter = Router();

authRouter.post("/signup", async (req, res, next) => {
  try {
    const payload = signupSchema.parse(req.body);
    const existing = await findUserByEmail(payload.email);
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const verificationToken = env.disableEmailVerification ? null : crypto.randomBytes(32).toString("hex");
    const user = await createUser(payload.name, payload.email, hashedPassword, verificationToken, {
      country: payload.country || null,
      country_code: payload.country_code || null
    });

    if (!env.disableEmailVerification) {
      const emailResult = await sendVerificationEmail(payload.email, verificationToken);
      if (!emailResult.success) {
        // eslint-disable-next-line no-console
        console.error("[Signup] Verification email send failed:", emailResult.error);

        res.status(201).json({
          message: "Signup successful! Please use resend verification email if the first email did not arrive.",
          email: payload.email,
          emailVerified: false,
          emailDeliveryFailed: true,
          detail: env.nodeEnv === "production" ? undefined : emailResult.error
        });
        return;
      }

      res.status(201).json({
        message: "Signup successful! Please check your email to verify your account.",
        email: payload.email,
        emailVerified: false
      });
    } else {
      // If verification is disabled, immediately return a JWT and user info
      const tokenUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      const jwtToken = jwt.sign(tokenUser, env.jwtSecret, { expiresIn: "7d" });
      res.status(201).json({ message: "Signup successful (email verification disabled).", user: tokenUser, token: jwtToken });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      const field = err.errors[0].path[0] || "input";
      res.status(400).json({ error: `Invalid ${field}` });
      return;
    }
    next(err);
  }
});

authRouter.get("/verify-email", async (req, res, next) => {
  try {
    if (env.disableEmailVerification) {
      res.json({ message: "Email verification is disabled on this server." });
      return;
    }
    const { token } = req.query;
    if (!token) {
      res.status(400).json({ error: "Verification token is required" });
      return;
    }

    const customers = await getCollection("customers");
    const user = await customers.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ error: "Invalid or expired verification token" });
      return;
    }

    // Mark email as verified and clear token
    await customers.updateOne(
      { id: user.id },
      {
        $set: { emailVerified: true },
        $unset: { verificationToken: "", verificationTokenExpiry: "" }
      }
    );

    const tokenUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      country: user.country || null,
      country_code: user.country_code || null,
      phone: user.phone || null,
      address: user.address || null,
      city: user.city || null,
      postalCode: user.postalCode || null
    };
    const jwtToken = jwt.sign(tokenUser, env.jwtSecret, { expiresIn: "7d" });

    res.json({
      message: "Email verified successfully!",
      user: tokenUser,
      token: jwtToken
    });
  } catch (err) {
    next(err);
  }
});

// Resend verification email
authRouter.post("/resend-verification", async (req, res, next) => {
  try {
    if (env.disableEmailVerification) {
      res.status(400).json({ error: "Email verification is disabled" });
      return;
    }

    const { email } = req.body || {};
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const customers = await getCollection("customers");
    const user = await customers.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "Email not found" });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ error: "Email already verified" });
      return;
    }
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await customers.updateOne({ id: user.id }, { $set: { verificationToken, verificationTokenExpiry } });

    const emailResult = await sendVerificationEmail(email, verificationToken);
    if (!emailResult.success) {
      res.status(502).json({ error: "Verification email could not be sent", detail: env.nodeEnv === "production" ? undefined : emailResult.error });
      return;
    }

    res.json({ message: "Verification email resent" });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await findUserByEmail(payload.email);
    if (!user || !user.password) {
      res.status(401).json({ error: "Email not found" });
      return;
    }
    const valid = await bcrypt.compare(payload.password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Password incorrect" });
      return;
    }

    // Block login until email is verified (unless verification disabled)
    if (!env.disableEmailVerification && !user.emailVerified) {
      res.status(403).json({
        error: "Email not verified",
        message: "Please verify your email address before logging in. Check your inbox for the verification link."
      });
      return;
    }

    if (user.status && user.status !== "active") {
      res.status(403).json({
        error: "Account disabled",
        message: "This account is deactivated. Reactivate from the admin dashboard before logging in."
      });
      return;
    }

    const tokenUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      country: user.country || null,
      country_code: user.country_code || null,
      phone: user.phone || null,
      address: user.address || null,
      city: user.city || null,
      postalCode: user.postalCode || null
    };
    const rememberFlag = req.body && (req.body.remember === true || req.body.remember === "1" || req.body.remember === "true");
    const accessToken = jwt.sign(tokenUser, env.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = createRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * (rememberFlag ? REMEMBER_REFRESH_TOKEN_DAYS : SESSION_REFRESH_TOKEN_DAYS));
    const loginAt = new Date();
    await addRefreshToken(user.id, refreshToken, refreshExpiresAt, rememberFlag, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      loginAt
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: env.enforceSameSiteStrict ? "strict" : "none",
      expires: refreshExpiresAt
    });

    res.json({ user: tokenUser, token: accessToken, loginAt: loginAt.toISOString() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const field = err.errors[0].path[0] || 'input';
      res.status(400).json({ error: `Invalid ${field}` });
      return;
    }
    next(err);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const customers = await getCollection("customers");
    const user = await customers.findOne({ email });

    if (!user || !user.password) {
      res.json({ message: "If an account exists and supports password login, we'll send you a password reset email." });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashToken(resetToken);
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 15);

    await customers.updateOne(
      { id: user.id },
      {
        $set: {
          passwordResetTokenHash: resetTokenHash,
          passwordResetTokenExpiry: resetTokenExpiry
        }
      }
    );

    await sendPasswordResetEmail(email, resetToken);
    res.json({ message: "If an account exists and supports password login, we'll send you a password reset email." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }
    next(err);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const customers = await getCollection("customers");
    const tokenHash = hashToken(token);
    const user = await customers.findOne({ passwordResetTokenHash: tokenHash, passwordResetTokenExpiry: { $gt: new Date() } });

    if (!user || !user.password) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const providers = Array.from(new Set([...(user.providers || [user.provider].filter(Boolean)), "local"]));

    await customers.updateOne(
      { id: user.id },
      {
        $set: {
          password: hashedPassword,
          provider: user.provider === "local" ? "local" : user.provider,
          providers,
          refreshTokens: []
        },
        $unset: {
          passwordResetTokenHash: "",
          passwordResetTokenExpiry: ""
        }
      }
    );

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: env.enforceSameSiteStrict ? "strict" : "lax"
    });

    res.json({ message: "Password reset successful. You can now log in with your new password." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const field = err.errors[0].path[0] || 'input';
      res.status(400).json({ error: `Invalid ${field}` });
      return;
    }
    next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) {
      res.status(401).json({ error: "Missing refresh token" });
      return;
    }

    const user = await findUserByRefreshToken(refreshToken);
    if (!user || !Array.isArray(user.refreshTokens)) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    if (user.status && user.status !== "active") {
      await removeRefreshToken(user.id, refreshToken);
      res.status(403).json({ error: "Account disabled" });
      return;
    }

    const tokenHash = hashToken(refreshToken);
    const tokenRecord = user.refreshTokens.find((record) => record.tokenHash === tokenHash);
    if (!tokenRecord || new Date(tokenRecord.expiresAt) <= new Date()) {
      await removeRefreshToken(user.id, refreshToken);
      res.status(401).json({ error: "Refresh token expired" });
      return;
    }

    // Check if the session has exceeded the maximum duration (4 hours)
    const loginAt = tokenRecord.loginAt ? new Date(tokenRecord.loginAt) : null;
    if (loginAt && (Date.now() - loginAt.getTime()) >= SESSION_MAX_DURATION_MS) {
      // Session expired - remove all refresh tokens to force re-login
      await getCollection("customers").updateOne(
        { id: user.id },
        { $set: { refreshTokens: [] } }
      );
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: env.enforceSameSiteStrict ? "strict" : "lax"
      });
      res.status(401).json({ error: "Session expired", sessionExpired: true });
      return;
    }

    const tokenUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    const newAccessToken = jwt.sign(tokenUser, env.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const newRefreshToken = createRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * (tokenRecord.remember ? REMEMBER_REFRESH_TOKEN_DAYS : SESSION_REFRESH_TOKEN_DAYS));

    await removeRefreshToken(user.id, refreshToken);
    // Preserve the original loginAt when rotating the refresh token
    await addRefreshToken(user.id, newRefreshToken, refreshExpiresAt, tokenRecord.remember, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      loginAt: loginAt || new Date()
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: env.enforceSameSiteStrict ? "strict" : "lax",
      expires: refreshExpiresAt
    });

    res.json({ token: newAccessToken });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    if (refreshToken) {
      const user = await findUserByRefreshToken(refreshToken);
      if (user) {
        await removeRefreshToken(user.id, refreshToken);
      }
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: env.enforceSameSiteStrict ? "strict" : "none"
    });
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
});

if (googleEnabled) {
  authRouter.get("/google", (req, res, next) => {
    const nextUrl = req.query.next || "/store";
    const remember = req.query.remember === "1" ? "1" : "0";
    const statePayload = encodeURIComponent(JSON.stringify({ next: nextUrl, remember }));
    passport.authenticate("google", { scope: ["email", "profile"], state: statePayload })(req, res, next);
  });

  authRouter.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login", session: true }),
    async (req, res) => {
      const user = req.user;
      const tokenUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      let nextUrl = "/store";
      let remember = "0";
      try {
        if (req.query.state) {
          const state = JSON.parse(decodeURIComponent(req.query.state));
          nextUrl = state.next || "/store";
          remember = state.remember === "1" ? "1" : "0";
        }
      } catch (e) {
        // ignore state parse errors and fall back to defaults
      }
      const accessToken = jwt.sign(tokenUser, env.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
      const refreshToken = createRefreshToken();
      const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * (remember === "1" ? REMEMBER_REFRESH_TOKEN_DAYS : SESSION_REFRESH_TOKEN_DAYS));
      const loginAt = new Date();
      await addRefreshToken(user.id, refreshToken, refreshExpiresAt, remember === "1", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        loginAt
      });

      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: env.enforceSameSiteStrict ? "strict" : "lax",
        expires: refreshExpiresAt
      });
      const redirectUrl = new URL(`${env.clientOrigin}/login`);
      redirectUrl.searchParams.set("token", accessToken);
      redirectUrl.searchParams.set("name", user.name);
      redirectUrl.searchParams.set("email", user.email);
      redirectUrl.searchParams.set("role", user.role);
      redirectUrl.searchParams.set("next", nextUrl);
      redirectUrl.searchParams.set("remember", remember);
      redirectUrl.searchParams.set("loginAt", loginAt.toISOString());
      res.redirect(redirectUrl.toString());
    }
  );
} else {
  authRouter.get("/google", (_req, res) => {
    res.status(501).json({ error: "Google OAuth is not configured." });
  });
  authRouter.get("/google/callback", (_req, res) => {
    res.status(501).json({ error: "Google OAuth is not configured." });
  });
}

if (appleEnabled) {
  authRouter.get("/apple", (req, res, next) => {
    const nextUrl = req.query.next || "/store";
    const remember = req.query.remember === "1" ? "1" : "0";
    const statePayload = encodeURIComponent(JSON.stringify({ next: nextUrl, remember }));
    passport.authenticate("apple", { scope: ["name", "email"], state: statePayload })(req, res, next);
  });

  authRouter.post(
    "/apple/callback",
    passport.authenticate("apple", { failureRedirect: "/login", session: true }),
    async (req, res) => {
      const user = req.user;
      const tokenUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      let nextUrl = "/store";
      let remember = "0";
      try {
        if (req.query.state) {
          const state = JSON.parse(decodeURIComponent(req.query.state));
          nextUrl = state.next || "/store";
          remember = state.remember === "1" ? "1" : "0";
        }
      } catch (e) {
        // ignore state parse errors and fall back to defaults
      }
      const accessToken = jwt.sign(tokenUser, env.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
      const refreshToken = createRefreshToken();
      const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * (remember === "1" ? REMEMBER_REFRESH_TOKEN_DAYS : SESSION_REFRESH_TOKEN_DAYS));
      const loginAt = new Date();
      await addRefreshToken(user.id, refreshToken, refreshExpiresAt, remember === "1", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        loginAt
      });

      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: env.enforceSameSiteStrict ? "strict" : "lax",
        expires: refreshExpiresAt
      });
      const redirectUrl = new URL(`${env.clientOrigin}/login`);
      redirectUrl.searchParams.set("token", accessToken);
      redirectUrl.searchParams.set("name", user.name);
      redirectUrl.searchParams.set("email", user.email);
      redirectUrl.searchParams.set("role", user.role);
      redirectUrl.searchParams.set("next", nextUrl);
      redirectUrl.searchParams.set("remember", remember);
      redirectUrl.searchParams.set("loginAt", loginAt.toISOString());
      res.redirect(redirectUrl.toString());
    }
  );
} else {
  authRouter.get("/apple", (_req, res) => {
    res.status(501).json({ error: "Apple OAuth is not configured." });
  });
  authRouter.post("/apple/callback", (_req, res) => {
    res.status(501).json({ error: "Apple OAuth is not configured." });
  });
}

const profileUpdateSchema = z.object({
  country_code: z.string().length(2).optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional()
});

authRouter.put("/me", requireAuth, async (req, res, next) => {
  try {
    const payload = profileUpdateSchema.parse(req.body || {});
    const customers = await getCollection("customers");
    const updateFields = {};

    if (payload.country) updateFields.country = payload.country;
    if (payload.country_code) updateFields.country_code = payload.country_code;
    if (payload.phone) updateFields.phone = payload.phone;
    if (payload.address) updateFields.address = payload.address;
    if (payload.city) updateFields.city = payload.city;
    if (payload.postalCode) updateFields.postalCode = payload.postalCode;

    if (Object.keys(updateFields).length === 0) {
      res.status(400).json({ error: "No valid profile fields provided." });
      return;
    }

    await customers.updateOne({ id: req.user.id }, { $set: updateFields });
    const updatedUser = await customers.findOne(
      { id: req.user.id },
      { projection: { _id: 0, id: 1, name: 1, email: 1, role: 1, status: 1, country: 1, country_code: 1, phone: 1, address: 1, city: 1, postalCode: 1 } }
    );

    res.json({ user: updatedUser });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const field = err.errors[0]?.path?.[0] || "input";
      res.status(400).json({ error: `Invalid ${field}` });
      return;
    }
    next(err);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});