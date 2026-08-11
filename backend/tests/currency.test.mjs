import test from "node:test";
import assert from "node:assert/strict";
import {
  PAYPAL_CURRENCIES,
  minorUnitMultiplier,
  providerSupportsCurrency,
  roundCurrency,
  normalizeCurrency,
  currencyRegistry
} from "../src/modules/currencies/currency.service.js";

test("PayPal registry includes documented major checkout currencies", () => {
  for (const currency of ["EUR", "USD", "GBP", "JPY", "TWD"]) assert.equal(PAYPAL_CURRENCIES.has(currency), true);
});

test("zero-decimal currencies use whole payment units", () => {
  assert.equal(minorUnitMultiplier("JPY"), 1);
  assert.equal(minorUnitMultiplier("HUF"), 1);
  assert.equal(roundCurrency(123.7, "JPY"), 124);
  assert.equal(minorUnitMultiplier("USD"), 100);
});

test("gateway configuration can restrict the global currency registry", () => {
  assert.equal(providerSupportsCurrency("stripe", "EUR", { supportedCurrencies: ["EUR", "USD"] }), true);
  assert.equal(providerSupportsCurrency("stripe", "CAD", { supportedCurrencies: ["EUR", "USD"] }), false);
  assert.equal(providerSupportsCurrency("paypal", "TND"), false);
});

test("local storefront currencies can be displayed even when no gateway supports them", () => {
  assert.equal(normalizeCurrency("TMT"), "TMT");
  assert.equal(currencyRegistry().some((currency) => currency.code === "TMT"), true);
  assert.equal(providerSupportsCurrency("stripe", "TMT"), false);
});
