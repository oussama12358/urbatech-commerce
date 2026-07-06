import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getCollection } from "../db/mongo.js";

async function verifyToken(token) {
  if (!token) return null;

  let tokenUser = null;
  for (const secret of env.jwtVerificationSecrets) {
    try {
      tokenUser = jwt.verify(token, secret);
      break;
    } catch (err) {
      if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        continue;
      }
      continue;
    }
  }

  return tokenUser;
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return next();
  }

  const tokenUser = await verifyToken(token);
  if (!tokenUser) {
    return next();
  }

  const customers = await getCollection("customers");
  const user = await customers.findOne(
    { id: tokenUser.id },
    { projection: { _id: 0, id: 1, name: 1, email: 1, role: 1 } }
  );

  if (user) {
    req.user = user;
  }

  next();
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }

  const tokenUser = await verifyToken(token);
  if (!tokenUser) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const customers = await getCollection("customers");
  const user = await customers.findOne(
    { id: tokenUser.id },
    { projection: { _id: 0, id: 1, name: 1, email: 1, role: 1 } }
  );

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role?.toLowerCase() !== role.toLowerCase()) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
}
