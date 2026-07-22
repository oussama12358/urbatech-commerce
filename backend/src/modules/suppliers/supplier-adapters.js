function cleanBaseUrl(value = "") {
  return value.replace(/\/+$/, "");
}

function joinUrl(base, path = "") {
  if (/^https?:\/\//i.test(path)) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBaseUrl(base)}${cleanPath}`;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getPath(source, path) {
  if (!path || !source) return undefined;
  return path.split(".").reduce((value, key) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value) && /^\d+$/.test(key)) return value[Number(key)];
    return value[key];
  }, source);
}

function firstValue(source, candidates, fallback) {
  const paths = String(candidates || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  for (const path of paths) {
    const value = getPath(source, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function parseObjectConfig(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const defaultEndpoints = {
  health: "/health",
  products: "/products",
  orders: "/orders",
  order_status: "/orders/:id",
  order_cancel: "/orders/:id/cancel"
};

const defaultProductMapping = {
  list: "data|products|items",
  sku: "sku|reference|ref",
  supplier_product_id: "supplier_product_id|id|sku|product_id",
  name: "name|title",
  description: "description|desc",
  price: "price|selling_price|retailPrice",
  cost_price: "cost_price|costPrice|cost|wholesale_price",
  stock: "stock|quantity|inventory",
  status: "status",
  brand: "brand|manufacturer|maker",
  manufacturer: "manufacturer|maker|brand",
  mpn: "mpn|manufacturer_part_number|part_number|model",
  barcode: "barcode|ean|upc|gtin",
  category: "category|category_name",
  specs: "specs|attributes",
  images: "images|image_urls"
};

const defaultOrderMapping = {
  order_id_key: "order_id",
  items_key: "items",
  product_id_key: "product_id",
  quantity_key: "quantity",
  customer_key: "customer",
  invoice_key: "invoice",
  metadata_key: "metadata"
};

const defaultOrderResponseMapping = {
  supplier_order_id: "supplier_order_id|order_id|id",
  tracking: "tracking|tracking_number|trackingCode",
  status: "status",
  invoice_number: "invoice_number|invoiceNumber|invoice.id",
  invoice_url: "invoice_url|invoiceUrl|invoice.url|invoice.pdf_url"
};

const defaultOrderStatusMapping = {
  status: "status|order_status",
  tracking: "tracking|tracking_number|trackingCode",
  carrier: "carrier|shipping_carrier",
  invoice_number: "invoice_number|invoiceNumber|invoice.id",
  invoice_url: "invoice_url|invoiceUrl|invoice.url|invoice.pdf_url"
};

export class SupplierAdapter {
  constructor(supplier) {
    this.supplier = supplier;
    this.endpoints = { ...defaultEndpoints, ...parseObjectConfig(supplier.endpoints) };
    this.productMapping = { ...defaultProductMapping, ...parseObjectConfig(supplier.product_mapping) };
    this.orderMapping = { ...defaultOrderMapping, ...parseObjectConfig(supplier.order_mapping) };
    this.orderResponseMapping = { ...defaultOrderResponseMapping, ...parseObjectConfig(supplier.order_response_mapping) };
    this.orderStatusMapping = { ...defaultOrderStatusMapping, ...parseObjectConfig(supplier.order_status_mapping) };
  }

  get headers() {
    const headers = { "Content-Type": "application/json", ...parseObjectConfig(this.supplier.custom_headers) };
    const authMode = this.supplier.auth_mode || "bearer";
    const apiKeyHeader = this.supplier.api_key_header || "X-API-Key";
    const apiSecretHeader = this.supplier.api_secret_header || "X-API-Secret";

    if (this.supplier.api_key && (authMode === "bearer" || authMode === "both")) {
      headers.Authorization = `Bearer ${this.supplier.api_key}`;
    }
    if (this.supplier.api_key && (authMode === "api-key" || authMode === "both")) {
      headers[apiKeyHeader] = this.supplier.api_key;
    }
    if (this.supplier.api_key && authMode === "basic") {
      const secret = this.supplier.api_secret || "";
      headers.Authorization = `Basic ${Buffer.from(`${this.supplier.api_key}:${secret}`).toString("base64")}`;
    }
    if (this.supplier.api_secret && authMode !== "basic") {
      headers[apiSecretHeader] = this.supplier.api_secret;
    }

    return {
      ...headers
    };
  }

  async request(path, options = {}) {
    const url = joinUrl(this.supplier.api_url, path);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...(options.headers || {})
      }
    });
    const body = await parseJson(response);
    if (!response.ok) {
      throw new Error(body.error || body.message || `Supplier API failed with ${response.status}`);
    }
    return body;
  }

  async testConnection() {
    try {
      await this.request(this.endpoints.health);
    } catch {
      await this.request(this.endpoints.products);
    }
    return { ok: true, api_health: "Online" };
  }

  normalizeProduct(product) {
    const price = Number(firstValue(product, this.productMapping.price, 0));
    const cost = Number(firstValue(product, this.productMapping.cost_price, price));
    const stock = Number(firstValue(product, this.productMapping.stock, 0));
    const specs = firstValue(product, this.productMapping.specs, []);
    const images = firstValue(product, this.productMapping.images, []);
    return {
      supplier_product_id: String(firstValue(product, this.productMapping.supplier_product_id, "")),
      sku: String(firstValue(product, this.productMapping.sku, firstValue(product, this.productMapping.supplier_product_id, "")) || ""),
      name: firstValue(product, this.productMapping.name, "Supplier product"),
      description: firstValue(product, this.productMapping.description, ""),
      price,
      cost_price: cost,
      stock,
      status: firstValue(product, this.productMapping.status, stock > 0 ? "In stock" : "Out of stock"),
      brand: firstValue(product, this.productMapping.brand, ""),
      manufacturer: firstValue(product, this.productMapping.manufacturer, ""),
      mpn: String(firstValue(product, this.productMapping.mpn, "") || ""),
      barcode: String(firstValue(product, this.productMapping.barcode, "") || ""),
      category: firstValue(product, this.productMapping.category, null),
      specs: Array.isArray(specs) ? specs : [],
      images: Array.isArray(images) ? images : []
    };
  }

  async syncProducts() {
    const json = await this.request(this.endpoints.products);
    const list = firstValue(json, this.productMapping.list, []);
    if (!Array.isArray(list)) {
      throw new Error("Supplier products response must be an array");
    }
    return list.map((item) => this.normalizeProduct(item));
  }

  buildSupplierOrderPayload(orderPayload) {
    const items = (orderPayload.items || []).map((item) => ({
      [this.orderMapping.product_id_key]: item.product_id,
      [this.orderMapping.quantity_key]: item.quantity,
      local_product_id: item.local_product_id,
      name: item.name,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      supplier_total: item.supplier_total,
      commission: item.commission,
      commission_rate: item.commission_rate
    }));

    const payload = {
      [this.orderMapping.order_id_key]: orderPayload.order_id,
      [this.orderMapping.items_key]: items,
      [this.orderMapping.customer_key]: orderPayload.customer
    };

    if (orderPayload.invoice) payload[this.orderMapping.invoice_key] = orderPayload.invoice;
    if (orderPayload.metadata) payload[this.orderMapping.metadata_key] = orderPayload.metadata;

    return payload;
  }

  async createOrder(orderPayload) {
    const json = await this.request(this.endpoints.orders, {
      method: "POST",
      body: JSON.stringify(this.buildSupplierOrderPayload(orderPayload))
    });
    return {
      supplier_order_id: firstValue(json, this.orderResponseMapping.supplier_order_id, null),
      tracking: firstValue(json, this.orderResponseMapping.tracking, null),
      status: firstValue(json, this.orderResponseMapping.status, "processing"),
      invoice_number: firstValue(json, this.orderResponseMapping.invoice_number, null),
      invoice_url: firstValue(json, this.orderResponseMapping.invoice_url, null)
    };
  }

  async getOrderStatus(supplierOrderId) {
    const path = this.endpoints.order_status.replace(":id", encodeURIComponent(supplierOrderId));
    const json = await this.request(path);
    return {
      status: firstValue(json, this.orderStatusMapping.status, null),
      tracking: firstValue(json, this.orderStatusMapping.tracking, null),
      carrier: firstValue(json, this.orderStatusMapping.carrier, null),
      invoice_number: firstValue(json, this.orderStatusMapping.invoice_number, null),
      invoice_url: firstValue(json, this.orderStatusMapping.invoice_url, null)
    };
  }

  async cancelOrder(supplierOrderId, payload = {}) {
    const path = this.endpoints.order_cancel.replace(":id", encodeURIComponent(supplierOrderId));
    const json = await this.request(path, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return {
      cancelled: firstValue(json, "cancelled|success|ok", true),
      status: firstValue(json, "status|order_status", "cancel_requested"),
      raw: json
    };
  }
}

export class CjDropshippingAdapter extends SupplierAdapter {}

export function getSupplierAdapter(supplier) {
  const adapter = (supplier.adapter || "generic").toLowerCase();
  if (adapter === "cj" || adapter === "cjdropshipping") return new CjDropshippingAdapter(supplier);
  return new SupplierAdapter(supplier);
}
