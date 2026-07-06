import { Router } from "express";
import { z } from "zod";
import {
  ensureDefaultPaymentProviders,
  getPaymentProviders,
  getPaymentProviderById,
  updatePaymentProvider
} from "./payment.service.js";
import { optionalAuth, requireAuth, requireRole } from "../../middleware/auth.js";

const paymentProvidersRouter = Router();

const paymentProviderSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.any()).optional()
});

paymentProvidersRouter.get("/", optionalAuth, async (req, res, next) => {
  try {
    await ensureDefaultPaymentProviders();
    const providers = await getPaymentProviders({ admin: Boolean(req.user && req.user.role?.toLowerCase() === "admin") });
    res.json({ data: providers });
  } catch (err) {
    next(err);
  }
});

paymentProvidersRouter.use(requireAuth, requireRole("admin"));

paymentProvidersRouter.put("/:id", async (req, res, next) => {
  try {
    const payload = paymentProviderSchema.parse(req.body);
    const provider = await getPaymentProviderById(req.params.id);
    if (!provider) {
      res.status(404).json({ error: "Payment provider not found" });
      return;
    }
    const updated = await updatePaymentProvider(req.params.id, payload);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

export { paymentProvidersRouter };
