import { createId } from "../../db/mongo.js";

function packageId(value, fallback = null) {
  const id = String(value || "").trim();
  return id || fallback || createId();
}

/**
 * New dispatches own packages[]. Legacy carrier/tracking fields are projected
 * as one package only when packages has never been stored on the dispatch.
 */
export function packagesForDispatch(dispatch = {}) {
  if (Array.isArray(dispatch.packages)) return dispatch.packages;
  if (!dispatch.carrier && !dispatch.tracking && !dispatch.tracking_url) return [];
  return [{
    id: "legacy",
    carrier: dispatch.carrier || null,
    carrier_code: dispatch.carrier_code || null,
    tracking: dispatch.tracking || null,
    tracking_url: dispatch.tracking_url || null,
    status: dispatch.status || null,
    items: Array.isArray(dispatch.items) ? dispatch.items : []
  }];
}

export function normalizePackage(source = {}, { fallbackId = null } = {}) {
  return {
    id: packageId(source.id || source.package_id || source.packageId || source.shipment_id || source.shipmentId || source.parcel_id || source.parcelId, fallbackId),
    carrier: source.carrier || source.carrier_name || source.carrierName || source.shipping_carrier || null,
    carrier_code: source.carrier_code || source.carrierCode || null,
    tracking: source.tracking || source.tracking_number || source.trackingNumber || source.trackingCode || null,
    tracking_url: source.tracking_url || source.trackingUrl || source.trackingURL || null,
    status: source.status || source.shipping_status || source.shippingStatus || null,
    ...(Array.isArray(source.items || source.products || source.lines) ? { items: source.items || source.products || source.lines } : {})
  };
}

export function replaceDispatchPackage(dispatch, packageIdToReplace, packageUpdate) {
  const packages = packagesForDispatch(dispatch).map((item) => normalizePackage(item));
  const target = String(packageIdToReplace || "");
  const index = target ? packages.findIndex((item) => item.id === target) : -1;
  const next = normalizePackage(packageUpdate, { fallbackId: target || null });
  if (index >= 0) packages[index] = { ...packages[index], ...next, id: packages[index].id };
  else packages.push(next);
  return { ...dispatch, packages };
}

export function removeDispatchPackage(dispatch, packageIdToRemove) {
  const target = String(packageIdToRemove || "");
  return {
    ...dispatch,
    // An empty explicit array means a legacy package was deliberately removed;
    // it must not be re-created from the old fallback fields.
    packages: packagesForDispatch(dispatch).filter((item) => item.id !== target)
  };
}
