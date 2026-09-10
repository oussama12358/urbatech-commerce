import { resolveTrackingUrl } from "../../utils/carriers.js";
import { packagesForDispatch } from "../suppliers/dispatch-packages.service.js";

function publicItem(item = {}) {
  return {
    product_id: item.product_id || item.local_product_id || null,
    name: item.name || item.product_id || item.local_product_id || "Product",
    qty: Number(item.quantity ?? item.qty ?? 0)
  };
}

function customerShipmentStatus(status) {
  const value = String(status || "").toLowerCase();
  if (!value) return null;
  if (value.includes("delivered")) return "Delivered";
  if (value.includes("out for delivery") || value.includes("out_for_delivery")) return "Out for delivery";
  if (value.includes("shipped") || value.includes("shipment")) return "Shipped";
  if (value.includes("cancel")) return "Cancelled";
  // Do not pass supplier-specific states such as "Manual fulfillment pending"
  // or adapter response labels through the customer API.
  return "Processing";
}

function itemsForDispatch(dispatch, orderItems) {
  // New dispatches persist this small order-item snapshot. Historical
  // dispatches are recovered from the order item supplier relation below.
  if (Array.isArray(dispatch.items) && dispatch.items.length) {
    return dispatch.items.map(publicItem);
  }

  if (dispatch.supplier_id) {
    return orderItems
      .filter((item) => item.supplier_id === dispatch.supplier_id)
      .map(publicItem);
  }

  // A manual/URBA TECH dispatch has no supplier. It owns the order items
  // without a supplier, which keeps supplier information out of this view.
  return orderItems
    .filter((item) => !item.supplier_id)
    .map(publicItem);
}

function publicPackageItems(packageRow, dispatchItems, orderItems) {
  if (!Array.isArray(packageRow.items) || !packageRow.items.length) return dispatchItems;
  const knownItems = [...dispatchItems, ...orderItems.map(publicItem)];
  return packageRow.items.map((item) => {
    const productId = item.local_product_id || item.product_id || null;
    const known = knownItems.find((candidate) => candidate.product_id === productId);
    // Never expose an unknown supplier product ID. Name remains safe when a
    // supplier provides it, otherwise use a generic customer-facing label.
    return known
      ? { ...known, qty: Number(item.quantity ?? item.qty ?? known.qty) }
      : { product_id: null, name: item.name || "Product", qty: Number(item.quantity ?? item.qty ?? 0) };
  });
}

/**
 * Customer-safe projection of the existing embedded supplier dispatches.
 * This is deliberately a serializer, not a second shipment store: carrier
 * and tracking remain owned by the supplier_dispatches records.
 */
export function buildCustomerShipments(order = {}, orderItems = []) {
  const dispatches = Array.isArray(order.supplier_dispatches) ? order.supplier_dispatches : [];

  if (dispatches.length) {
    return dispatches.map((dispatch, index) => {
      const dispatchItems = itemsForDispatch(dispatch, orderItems);
      const packages = packagesForDispatch(dispatch).map((packageRow, packageIndex) => ({
        id: `shipment-${index + 1}-package-${packageIndex + 1}`,
        status: customerShipmentStatus(packageRow.status || dispatch.status),
        carrier: packageRow.carrier || null,
        tracking: packageRow.tracking || null,
        tracking_url: resolveTrackingUrl({
          carrierCode: packageRow.carrier_code,
          carrier: packageRow.carrier,
          tracking: packageRow.tracking,
          customUrl: packageRow.tracking_url
        }),
        items: publicPackageItems(packageRow, dispatchItems, orderItems)
      }));
      const firstPackage = packages[0] || {};
      return {
      // Sequential public identifiers avoid exposing a supplier's own order ID.
      id: `shipment-${index + 1}`,
      status: customerShipmentStatus(dispatch.status),
      // Kept only as a convenient summary for a one-package shipment. The
      // packages array is the complete source for customer tracking.
      carrier: packages.length === 1 ? firstPackage.carrier : null,
      tracking: packages.length === 1 ? firstPackage.tracking : null,
      tracking_url: packages.length === 1 ? firstPackage.tracking_url : null,
      shipped_at: dispatch.shipped_at || dispatch.dispatched_at || dispatch.fulfilled_manually_at || null,
      items: dispatchItems,
      packages
    };
    });
  }

  // Historical single-shipment orders predate supplier_dispatches. Keep their
  // original order-level tracking readable without any migration.
  if (order.carrier || order.tracking || order.tracking_url) {
    const legacyPackage = {
      id: "shipment-1-package-1",
      status: customerShipmentStatus(order.status),
      carrier: order.carrier || null,
      tracking: order.tracking || null,
      tracking_url: resolveTrackingUrl({
        carrierCode: order.carrier_code,
        carrier: order.carrier,
        tracking: order.tracking,
        customUrl: order.tracking_url
      }),
      items: orderItems.map(publicItem)
    };
    return [{
      id: "shipment-1",
      status: order.status || null,
      carrier: legacyPackage.carrier,
      tracking: legacyPackage.tracking,
      tracking_url: legacyPackage.tracking_url,
      shipped_at: order.fulfillment_updated_at || null,
      items: orderItems.map(publicItem),
      packages: [legacyPackage]
    }];
  }

  return [];
}
