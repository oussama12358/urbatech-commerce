import { Router } from "express";
import { convertAmount, currencyRegistry, normalizeCurrency } from "./currency.service.js";

export const currenciesRouter = Router();

currenciesRouter.get("/", (_req, res) => {
  res.json({ data: currencyRegistry(), rate_mode: "dynamic", cache_ttl_ms: 6 * 60 * 60 * 1000 });
});

currenciesRouter.get("/convert", async (req, res, next) => {
  try {
    const amount = Number(req.query.amount || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      res.status(400).json({ error: "amount must be a positive number" });
      return;
    }
    const from = normalizeCurrency(req.query.from || "USD");
    const to = normalizeCurrency(req.query.to || "USD");
    res.json({ data: { amount: await convertAmount(amount, from, to), currency: to } });
  } catch (error) {
    next(error);
  }
});
