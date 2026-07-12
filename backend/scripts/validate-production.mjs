import "dotenv/config";
import { connectMongo, getCollection } from "../src/db/mongo.js";
import { env } from "../src/config/env.js";
import { getStripeClient } from "../src/modules/payments/payment.service.js";

const strict = process.env.STRICT_PRODUCTION_VALIDATION === "true";
const runExternal = process.env.RUN_EXTERNAL_VALIDATION === "true";
const report = { checks: [], external: runExternal };

function check(name, ok, details = "") {
  report.checks.push({ name, ok: Boolean(ok), details });
}

async function paypalTokenCheck() {
  const base = env.paypalMode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const creds = Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString("base64");
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!response.ok) throw new Error(`PayPal token failed with ${response.status}`);
}

let client;
try {
  client = await connectMongo();
  check("MongoDB connection", true);

  const suppliers = await getCollection("suppliers");
  const paymentProviders = await getCollection("payment_providers");
  const connectedRealSuppliers = await suppliers.countDocuments({
    status: "Connected",
    api_url: /^https?:\/\//i
  });
  const stripeProvider = await paymentProviders.findOne({ provider_key: "stripe" });
  const paypalProvider = await paymentProviders.findOne({ provider_key: "paypal" });

  check("At least one connected real supplier", connectedRealSuppliers > 0, `${connectedRealSuppliers} connected real supplier(s)`);
  check("Stripe secret configured", Boolean(env.stripeSecretKey || stripeProvider?.config?.stripeSecretKey));
  check("Stripe webhook secret configured", Boolean(env.stripeWebhookSecret));
  check("PayPal credentials configured", Boolean(env.paypalClientId && env.paypalClientSecret));
  check("PayPal webhook id configured", Boolean(env.paypalWebhookId));

  if (runExternal) {
    try {
      const stripe = getStripeClient(stripeProvider?.config || {});
      if (!stripe) throw new Error("Stripe client missing");
      await stripe.balance.retrieve();
      check("Stripe API reachable", true);
    } catch (err) {
      check("Stripe API reachable", false, err.message);
    }

    try {
      await paypalTokenCheck();
      check("PayPal API reachable", true);
    } catch (err) {
      check("PayPal API reachable", false, err.message);
    }
  } else {
    check("External gateway validation run", !strict, "Set RUN_EXTERNAL_VALIDATION=true for Stripe/PayPal network checks");
  }

  const failed = report.checks.filter((item) => !item.ok);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = failed.length ? 1 : 0;
} catch (err) {
  check("Production validation crashed", false, err.message);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} finally {
  await client?.close();
}
