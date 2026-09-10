import test from "node:test";
import assert from "node:assert/strict";
import { resolveTrackingUrl } from "../src/utils/carriers.js";
import { serializeOrder } from "../src/modules/orders/orders.routes.js";
import { buildCustomerShipments } from "../src/modules/orders/shipment-serialization.service.js";
import { replaceDispatchPackage } from "../src/modules/suppliers/dispatch-packages.service.js";
import { normalizeSupplierWebhook, packagesFromSupplierUpdate } from "../src/modules/suppliers/supplier.service.js";
import { SupplierAdapter } from "../src/modules/suppliers/supplier-adapters.js";

const items = [
  { product_id: "product-a", name: "Product A", quantity: 1, supplier_id: "supplier-a", cost_price: 80, supplier_total: 80 },
  { product_id: "product-b", name: "Product B", quantity: 2, supplier_id: "supplier-b", cost_price: 40, supplier_total: 80 }
];

test("customer shipment serializer keeps each supplier dispatch separate and safe", () => {
  const order = {
    id: "UT-1001",
    supplier_dispatches: [
      { supplier_id: "supplier-a", supplier_order_id: "SUP-A", status: "Shipped", carrier: "DHL", tracking: "DHL123", supplier_payable: 80 },
      { supplier_id: "supplier-b", supplier_order_id: "SUP-B", status: "Shipped", carrier: "FedEx", tracking: "FX456", supplier_payable: 80 }
    ]
  };
  const shipments = buildCustomerShipments(order, items);
  assert.equal(shipments.length, 2);
  assert.deepEqual(shipments[0].items, [{ product_id: "product-a", name: "Product A", qty: 1 }]);
  assert.deepEqual(shipments[1].items, [{ product_id: "product-b", name: "Product B", qty: 2 }]);
  assert.match(shipments[0].tracking_url, /DHL123/);
  assert.match(shipments[1].tracking_url, /FX456/);
  assert.equal(JSON.stringify(shipments).includes("supplier-a"), false);
  assert.equal(JSON.stringify(shipments).includes("supplier_payable"), false);
  assert.equal(JSON.stringify(shipments).includes("cost_price"), false);
});

test("multiple products in one dispatch stay grouped in one shipment", () => {
  const shipments = buildCustomerShipments({
    supplier_dispatches: [{
      supplier_id: "supplier-a",
      supplier_order_id: "SUP-A",
      carrier: "UPS",
      tracking: "UPS789",
      items: [
        { product_id: "product-a", name: "Product A", quantity: 1 },
        { product_id: "product-c", name: "Product C", quantity: 2 }
      ]
    }]
  }, items);
  assert.equal(shipments.length, 1);
  assert.equal(shipments[0].items.length, 2);
});

test("carrier and tracking remain visible when no tracking URL can be resolved", () => {
  const shipment = buildCustomerShipments({
    supplier_dispatches: [{ supplier_id: "supplier-a", supplier_order_id: "SUP-A", carrier: "Independent Carrier", tracking: "LOCAL-1" }]
  }, items)[0];
  assert.equal(shipment.carrier, "Independent Carrier");
  assert.equal(shipment.tracking, "LOCAL-1");
  assert.equal(shipment.tracking_url, null);
});

test("custom valid tracking URL is preferred and known-carrier URL remains available", () => {
  assert.equal(resolveTrackingUrl({ carrier: "DHL", tracking: "DHL123", customUrl: "https://example.test/track/DHL123" }), "https://example.test/track/DHL123");
  assert.match(resolveTrackingUrl({ carrier: "DHL", tracking: "DHL123" }), /DHL123/);
  assert.equal(resolveTrackingUrl({ carrier: "Unknown", tracking: "X" }), null);
});

test("historical order-level tracking remains readable, while public multi-shipment summary is not ambiguous", () => {
  const legacy = buildCustomerShipments({ carrier: "DHL", tracking: "OLD-1" }, items);
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].tracking, "OLD-1");

  const serialized = serializeOrder({
    id: "UT-1002",
    status: "Shipped",
    currency: "USD",
    supplier_dispatches: [
      { supplier_id: "supplier-a", supplier_order_id: "SUP-A", carrier: "DHL", tracking: "A" },
      { supplier_id: "supplier-b", supplier_order_id: "SUP-B", carrier: "UPS", tracking: "B" }
    ]
  }, items);
  assert.equal(serialized.shipments.length, 2);
  assert.equal(serialized.carrier, null);
  assert.equal(serialized.tracking, null);
  assert.equal(JSON.stringify(serialized).includes("supplier_product_id"), false);
});

test("one dispatch can expose two independent physical packages without supplier data", () => {
  const shipments = buildCustomerShipments({
    supplier_dispatches: [{
      supplier_id: "supplier-a",
      supplier_order_id: "SUP-A",
      supplier_payable: 120,
      items: [{ product_id: "product-a", name: "Product A", quantity: 1 }],
      packages: [
        { id: "package-1", carrier: "DHL", carrier_code: "dhl", tracking: "DHL123456", status: "Shipped", items: [{ product_id: "product-a", quantity: 1 }] },
        { id: "package-2", carrier: "FedEx", carrier_code: "fedex", tracking: "FEDEX789012", tracking_url: "https://example.test/fedex", status: "Processing" }
      ]
    }]
  }, items);
  assert.equal(shipments.length, 1);
  assert.equal(shipments[0].packages.length, 2);
  assert.equal(shipments[0].carrier, null);
  assert.equal(shipments[0].packages[0].tracking, "DHL123456");
  assert.equal(shipments[0].packages[1].tracking, "FEDEX789012");
  assert.match(shipments[0].packages[0].tracking_url, /DHL123456/);
  assert.equal(shipments[0].packages[1].tracking_url, "https://example.test/fedex");
  assert.equal(JSON.stringify(shipments).includes("supplier-a"), false);
  assert.equal(JSON.stringify(shipments).includes("supplier_payable"), false);
});

test("updating one package leaves the other package untouched", () => {
  const dispatch = {
    packages: [
      { id: "package-1", carrier: "DHL", tracking: "OLD-1" },
      { id: "package-2", carrier: "UPS", tracking: "UNCHANGED-2" }
    ]
  };
  const updated = replaceDispatchPackage(dispatch, "package-1", { carrier: "DHL", tracking: "NEW-1", status: "Shipped" });
  assert.equal(updated.packages[0].tracking, "NEW-1");
  assert.equal(updated.packages[1].tracking, "UNCHANGED-2");
  assert.equal(updated.packages[1].carrier, "UPS");
});

test("a legacy supplier status sync never guesses between two package tracking numbers", () => {
  const dispatch = { packages: [{ id: "one", tracking: "ONE" }, { id: "two", tracking: "TWO" }] };
  assert.equal(packagesFromSupplierUpdate(dispatch, { tracking: "AMBIGUOUS" }), undefined);
  const completeUpdate = packagesFromSupplierUpdate(dispatch, { packages: [{ id: "one", tracking: "NEW-ONE" }, { id: "two", tracking: "TWO" }] });
  assert.equal(completeUpdate[0].tracking, "NEW-ONE");
  assert.equal(completeUpdate[1].tracking, "TWO");
});

test("supplier adapter normalizes packages, shipments and parcels into one packages shape", () => {
  const adapter = new SupplierAdapter({ api_url: "https://supplier.example" });
  const packageRows = adapter.normalizePackages([{ id: "p1", carrier: "DHL", carrier_code: "dhl", tracking: "DHL-1", tracking_url: "https://example.test/dhl", status: "shipped", items: [{ product_id: "product-a", quantity: 1 }] }], adapter.orderStatusMapping);
  const shipmentRows = adapter.normalizePackages([{ shipmentId: "s1", carrierName: "FedEx", carrierCode: "fedex", trackingNumber: "FX-2", trackingURL: "https://example.test/fedex", shippingStatus: "delivered", products: [{ product_id: "product-b", quantity: 2 }] }], adapter.orderStatusMapping);
  const parcelRows = adapter.normalizePackages([{ parcel_id: "x1", shipping_carrier: "UPS", trackingCode: "UPS-3", shipping_status: "processing", lines: [{ product_id: "product-a", quantity: 1 }] }], adapter.orderStatusMapping);

  assert.deepEqual(packageRows[0], { id: "p1", carrier: "DHL", carrier_code: "dhl", tracking: "DHL-1", tracking_url: "https://example.test/dhl", status: "shipped", items: [{ product_id: "product-a", quantity: 1 }] });
  assert.deepEqual(shipmentRows[0], { id: "s1", carrier: "FedEx", carrier_code: "fedex", tracking: "FX-2", tracking_url: "https://example.test/fedex", status: "delivered", items: [{ product_id: "product-b", quantity: 2 }] });
  assert.deepEqual(parcelRows[0], { id: "x1", carrier: "UPS", carrier_code: null, tracking: "UPS-3", tracking_url: null, status: "processing", items: [{ product_id: "product-a", quantity: 1 }] });
});

test("supplier webhook reuses adapter package normalization", () => {
  const webhook = normalizeSupplierWebhook({
    api_url: "https://supplier.example",
    webhook_mapping: { packages: "shipment_data" }
  }, {
    supplier_order_id: "SUP-1",
    shipment_data: [{ parcelId: "parcel-1", carrierName: "DHL", trackingNumber: "DHL-9", trackingURL: "https://example.test/dhl-9" }]
  });
  assert.equal(webhook.packages[0].id, "parcel-1");
  assert.equal(webhook.packages[0].tracking, "DHL-9");
});
