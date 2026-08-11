import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { readStorage, writeStorage } from "../shared/lib/storage.js";
import { createApiClient } from "../shared/lib/api.js";
import { showToast } from "../shared/lib/toast.js";
import { t } from "../i18n.js";
import { defaultCurrencyForCountry } from "../shared/lib/currency.js";
import {
  getProductShipsTo,
  isProductAvailableInCountry,
  readShippingCountryCode
} from "../shared/lib/shipping.js";

const StoreContext = createContext(null);

const KEYS = {
  user: "ut_react_user",
  cart: "ut_react_cart",
  orders: "ut_react_orders",
  products: "ut_react_products",
  categories: "ut_react_categories",
  settings: "ut_react_settings",
  paymentProviders: "ut_react_payment_providers",
  currency: "ut_currency",
  currencyPreference: "ut_currency_preference"
};

const mergeCarts = (serverCart = {}, localCart = {}) => {
  const merged = { ...serverCart };
  Object.entries(localCart || {}).forEach(([id, qty]) => {
    merged[id] = Number(qty || 0);
  });
  return merged;
};

export function StoreProvider({ children }) {
  const [user, setUserState] = useState(() => readStorage(KEYS.user, null));
  const [authReady, setAuthReady] = useState(() => !readStorage(KEYS.user, null)?.token);
  const [cart, setCartState] = useState(() => readStorage(KEYS.cart, {}));
  const [orders, setOrdersState] = useState(() => readStorage(KEYS.orders, []));
  const [products, setProductsState] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categories, setCategoriesState] = useState([]);
  const [suppliers, setSuppliersState] = useState([]);
  const [settings, setSettingsState] = useState({ storefrontEnabled: true });
  const [paymentProviders, setPaymentProviders] = useState([]);
  const [currencyPreference, setCurrencyPreference] = useState(() => readStorage(KEYS.currencyPreference, "auto"));
  const [currency, setCurrencyState] = useState(() => {
    const saved = readStorage(KEYS.currency, null);
    if (saved) return saved;
    const storedUser = readStorage(KEYS.user, null);
    return storedUser?.country_code ? defaultCurrencyForCountry(storedUser.country_code) : null;
  });
  const [currencies, setCurrencies] = useState([]);
  const [shippingEstimate, setShippingEstimate] = useState(120);
  const cartRef = useRef(cart);
  const lastLocalCartChangeRef = useRef(0);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    let mounted = true;
    const refreshUser = async () => {
      const storedUser = readStorage(KEYS.user, null);
      if (!storedUser?.token) {
        if (mounted) setAuthReady(true);
        return;
      }

      try {
        const api = createApiClient(storedUser.token);
        const json = await api("/auth/me");
        if (json?.user && mounted) {
          const nextUser = { ...json.user, token: storedUser.token };
          setUserState(nextUser);
          writeStorage(KEYS.user, nextUser);
        }
      } catch {
        if (mounted) {
          setUserState(null);
          localStorage.removeItem(KEYS.user);
          setOrdersState([]);
          localStorage.removeItem(KEYS.orders);
          setCartState({});
          localStorage.removeItem(KEYS.cart);
        }
      } finally {
        if (mounted) setAuthReady(true);
      }
    };

    refreshUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (mounted) setProductsLoading(true);
      try {
        const api = createApiClient(user?.token);
        const [productsJson, categoriesJson, settingsJson, paymentProvidersJson, currenciesJson] = await Promise.all([
          api(currency ? `/products?currency=${encodeURIComponent(currency)}` : "/products"),
          api("/categories"),
          api("/settings"),
          api("/payments"),
          api("/currencies")
        ]);
        function sanitizeProducts(list) {
          if (!Array.isArray(list)) return [];
          return list.map((p) => {
            const statusRaw = String(p?.status || "").trim();
            const isLegacy = ["active", "inactive"].includes(statusRaw.toLowerCase());
            return {
              ...p,
              // remove legacy status text entirely
              status: isLegacy ? "" : p.status
            };
          });
        }

        if (productsJson?.data && mounted) {
          setProducts(sanitizeProducts(productsJson.data));
        }
        if (categoriesJson?.data && mounted) {
          setCategoriesState(categoriesJson.data);
        }
        if (settingsJson?.data && mounted) {
          setSettingsState(settingsJson.data);
        }
        if (paymentProvidersJson?.data && mounted) {
          setPaymentProviders(paymentProvidersJson.data);
        }
        if (currenciesJson?.data && mounted) setCurrencies(currenciesJson.data);
      } catch (err) {
        console.error('[StoreContext] Failed to load store data:', err?.message || err);
        localStorage.removeItem(KEYS.products);
        localStorage.removeItem(KEYS.categories);
        localStorage.removeItem(KEYS.settings);
        localStorage.removeItem(KEYS.paymentProviders);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [user?.token, currency]);

  const setCurrency = (nextCurrency) => {
    const next = String(nextCurrency || "USD").toUpperCase();
    setCurrencyState(next);
    writeStorage(KEYS.currency, next);
    setCurrencyPreference("manual");
    writeStorage(KEYS.currencyPreference, "manual");
  };

  const setAutomaticCurrencyForCountry = (countryCode) => {
    if (currencyPreference === "manual" || !countryCode) return;
    const next = defaultCurrencyForCountry(countryCode);
    setCurrencyState(next);
    writeStorage(KEYS.currency, next);
    setCurrencyPreference("auto");
    writeStorage(KEYS.currencyPreference, "auto");
  };

  const resetToProductCurrencies = () => {
    setCurrencyState(null);
    localStorage.removeItem(KEYS.currency);
    setCurrencyPreference("auto");
    writeStorage(KEYS.currencyPreference, "auto");
  };

  useEffect(() => {
    if (!currency) {
      setShippingEstimate(120);
      return;
    }
    const api = createApiClient(user?.token);
    api(`/currencies/convert?amount=120&from=USD&to=${encodeURIComponent(currency)}`)
      .then((json) => setShippingEstimate(Number(json?.data?.amount || 120)))
      .catch(() => setShippingEstimate(120));
  }, [currency, user?.token]);

  const syncCartFromServer = useCallback(
    async ({ mergeLocal = false } = {}) => {
      if (!user?.token) return cartRef.current;

      if (!mergeLocal && Date.now() - lastLocalCartChangeRef.current < 1500) {
        return cartRef.current;
      }

      const api = createApiClient(user.token);
      const cartJson = await api("/cart");
      const serverCart = cartJson?.data || {};
      const nextCart = mergeLocal ? mergeCarts(serverCart, cartRef.current) : serverCart;

      setCartState(nextCart);
      writeStorage(KEYS.cart, nextCart);

      if (mergeLocal && JSON.stringify(nextCart) !== JSON.stringify(serverCart)) {
        await api("/cart", { method: "POST", body: JSON.stringify(nextCart) });
      }

      return nextCart;
    },
    [user?.token]
  );

  const persistUser = async (next, options = { remember: true }) => {
    setUserState(next);
    setAuthReady(true);
    if (!next) {
      localStorage.removeItem(KEYS.user);
      sessionStorage.removeItem(KEYS.user);
      setOrdersState([]);
      localStorage.removeItem(KEYS.orders);
      // Clear cart on logout so items don't persist across sessions
      setCartState({});
      localStorage.removeItem(KEYS.cart);
      return;
    }

    // Persist user either to localStorage (remember) or sessionStorage (no remember)
    try {
      if (options && options.remember === false) {
        sessionStorage.setItem(KEYS.user, JSON.stringify(next));
        localStorage.removeItem(KEYS.user);
      } else {
        localStorage.setItem(KEYS.user, JSON.stringify(next));
        sessionStorage.removeItem(KEYS.user);
      }
    } catch (err) {
      // fallback: write to localStorage
      writeStorage(KEYS.user, next);
    }

    if (!next.token) return;

    const api = createApiClient(next.token);
    
    try {
      const ordersPath = next.role?.toLowerCase() === "admin" ? "/admin/orders" : "/orders";
      const ordersJson = await api(ordersPath);
      if (ordersJson?.data) {
        setOrdersState(ordersJson.data);
        writeStorage(KEYS.orders, ordersJson.data);
      }
    } catch {
      // ignore if order loading fails
    }

    // Load persisted cart for this user and merge with any local cart
    try {
      const cartJson = await api("/cart");
      const serverCart = cartJson?.data || {};
      const merged = mergeCarts(serverCart, cart);
      setCartState(merged);
      writeStorage(KEYS.cart, merged);
      // persist merged cart back to server
      await api("/cart", { method: "POST", body: JSON.stringify(merged) });
    } catch (err) {
      // ignore cart load/save errors
    }
  };

  // Session timeout: 4 hours (same as backend SESSION_MAX_DURATION_MS)
  const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000;

  useEffect(() => {
    const handleInvalidAuth = () => {
      persistUser(null);
    };
    const handleSessionExpired = () => {
      persistUser(null);
    };
    window.addEventListener("ut:auth-invalid", handleInvalidAuth);
    window.addEventListener("ut:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("ut:auth-invalid", handleInvalidAuth);
      window.removeEventListener("ut:session-expired", handleSessionExpired);
    };
  }, []);

  // Client-side session timeout: auto-logout after 4 hours from login
  useEffect(() => {
    if (!user?.token) return undefined;

    // Try to get loginAt from stored user data or from the token
    let loginTime = user.loginAt ? new Date(user.loginAt).getTime() : null;

    // If no loginAt stored, decode the JWT to get iat (issued at)
    if (!loginTime && user.token) {
      try {
        const payload = JSON.parse(atob(user.token.split('.')[1]));
        if (payload.iat) {
          loginTime = payload.iat * 1000;
        }
      } catch {
        // ignore parse errors
      }
    }

    if (!loginTime) return undefined;

    const elapsed = Date.now() - loginTime;
    const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);

    if (remaining <= 0) {
      // Session already expired
      persistUser(null);
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      persistUser(null);
    }, remaining);

    return () => clearTimeout(timeoutId);
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) return undefined;

    const refreshCart = () => {
      syncCartFromServer().catch(() => {
        /* ignore cart sync errors */
      });
    };

    refreshCart();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshCart();
      }
    };

    window.addEventListener("focus", refreshCart);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(refreshCart, 15000);

    return () => {
      window.removeEventListener("focus", refreshCart);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [syncCartFromServer, user?.token]);

  const setCart = (next) => {
    lastLocalCartChangeRef.current = Date.now();
    setCartState(next);
    writeStorage(KEYS.cart, next);
    // If user is authenticated, persist cart to server (fire-and-forget)
    if (user?.token) {
      const api = createApiClient(user.token);
      api("/cart", { method: "POST", body: JSON.stringify(next) }).catch(() => {
        /* ignore */
      });
    }
  };

  const setOrders = (next) => {
    setOrdersState(next);
    writeStorage(KEYS.orders, next);
  };

  const setProducts = (next) => {
    const sanitized = Array.isArray(next)
      ? next.map((p) => {
          const statusRaw = String(p?.status || "").trim();
          const isLegacy = ["active", "inactive"].includes(statusRaw.toLowerCase());
          return { ...p, status: isLegacy ? "" : p.status };
        })
      : next;
    setProductsState(sanitized);
  };

  const setCategories = (next) => {
    setCategoriesState(next);
  };

  const setSuppliers = (next) => {
    setSuppliersState(next);
  };

  const setSettings = (next) => {
    setSettingsState(next);
  };

  const refreshCategories = async () => {
    const api = createApiClient(user?.token);
    const json = await api("/categories");
    const next = json?.data || [];
    setCategories(next);
    return next;
  };

  const refreshSuppliers = async () => {
    if (!user?.token) return [];
    const api = createApiClient(user.token);
    const json = await api("/suppliers");
    const next = json?.data || [];
    setSuppliers(next);
    return next;
  };

  useEffect(() => {
    if (!user?.token || user?.role?.toLowerCase() !== "admin") {
      setSuppliers([]);
      return undefined;
    }
    refreshSuppliers().catch(() => {});
    return undefined;
  }, [user?.token, user?.role]);

  useEffect(() => {
    if (!user?.token) return undefined;
    const api = createApiClient(user.token);
    const ordersPath = user.role?.toLowerCase() === "admin" ? "/admin/orders" : "/orders";
    api(ordersPath)
      .then((json) => {
        if (json?.data) {
          setOrdersState(json.data);
          writeStorage(KEYS.orders, json.data);
        }
      })
      .catch(() => {});
    return undefined;
  }, [user?.token, user?.role]);

  const addToCart = (id, qty = 1) => {
    const product = products.find((item) => item.id === id);
    // Before a country/manual choice, the first item establishes a temporary
    // cart currency so cart totals never mix unrelated product currencies.
    if (!currency && product?.currency) {
      setCurrencyState(product.currency);
      writeStorage(KEYS.currency, product.currency);
    }
    if (product && product.stock <= 0) {
      return;
    }
    const shipCountryCode = user?.country_code || readShippingCountryCode();
    const availability = product ? isProductAvailableInCountry(product, shipCountryCode) : { available: true };
    const needsCountryCheck = product ? Boolean(getProductShipsTo(product)) : false;
    if (product && (availability.available === false || (availability.available === null && needsCountryCheck))) {
      return;
    }
    const existingQty = Number(cart[id] || 0);
    const desired = Number(qty || 0) + existingQty;
    // If product has a numeric stock, cap desired quantity to available stock
    const capped = product && typeof product.stock === "number" ? Math.max(0, Math.min(desired, Number(product.stock))) : Math.max(0, desired);
    if (capped <= 0) return;
    if (capped === existingQty) return;
    // Inform user if we capped their requested quantity due to stock limits
    if (product && typeof product.stock === "number" && capped < desired) {
      showToast(`${product.name} — ${t("onlyXLeftInStock").replace("{count}", String(product.stock))}`, "error");
    }
    setCart({ ...cart, [id]: capped });
  };

  const changeQty = (id, delta) => {
    const product = products.find((p) => p.id === id);
    const current = Number(cart[id] || 0);
    let nextQty = Number(current + delta || 0);
    if (nextQty <= 0) {
      const next = { ...cart };
      delete next[id];
      setCart(next);
      return;
    }
    if (product && typeof product.stock === "number") {
      if (nextQty > Number(product.stock)) {
        showToast(`${product.name} — ${t("onlyXLeftInStock").replace("{count}", String(product.stock))}`, "error");
        nextQty = Number(product.stock);
      }
    }
    setCart({ ...cart, [id]: nextQty });
  };

  const clearCart = () => setCart({});

  const createOrder = async (billing, options = { clearCartAfterCreate: true }) => {
    if (!user?.token) {
      throw new Error("Login required to create an order.");
    }

    const api = createApiClient(user.token);
    const payload = {
      billing,
      items: cartLines.map(({ id, name, price, qty }) => ({ id, name, price, qty }))
    };

    const json = await api("/orders", {
      method: "POST",
      body: JSON.stringify({ ...payload, currency })
    });

    if (!json?.data) {
      throw new Error("Unable to create order.");
    }

    const nextOrders = [json.data, ...orders];
    setOrders(nextOrders);
    writeStorage(KEYS.orders, nextOrders);

    const nextUser = user
      ? {
          ...user,
          phone: billing.phone || user.phone,
          address: billing.address || user.address,
          city: billing.city || user.city,
          country: billing.country || user.country,
          country_code: billing.country_code || user.country_code,
          postalCode: billing.postalCode || user.postalCode
        }
      : user;

    if (nextUser && JSON.stringify(nextUser) !== JSON.stringify(user)) {
      setUserState(nextUser);
      writeStorage(KEYS.user, nextUser);
    }

    if (options.clearCartAfterCreate !== false) {
      // Refresh product list to reflect decremented stock, then clear cart
      try {
        const productsJson = await api(currency ? `/products?currency=${encodeURIComponent(currency)}` : "/products");
        if (productsJson?.data) setProducts(productsJson.data);
      } catch (err) {
        // ignore product refresh errors
      }
      clearCart();
    }
    return json.data;
  };

  const updateProfile = async (profileUpdate) => {
    if (!user?.token) {
      throw new Error("Login required to update profile.");
    }
    const api = createApiClient(user.token);
    const json = await api("/auth/me", {
      method: "PUT",
      body: JSON.stringify(profileUpdate)
    });
    if (!json?.user) {
      throw new Error("Unable to update profile.");
    }
    const nextUser = { ...user, ...json.user };
    setUserState(nextUser);
    writeStorage(KEYS.user, nextUser);
    return nextUser;
  };

  const createStripeCheckout = async (orderId) => {
    return createCheckoutSession(orderId, "stripe");
  };

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = products.find((item) => item.id === id);
          return product ? { ...product, qty } : null;
        })
        .filter(Boolean),
    [cart, products]
  );

  const cartCount = cartLines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = cartLines.reduce((sum, line) => sum + line.price * line.qty, 0);
  // Product prices already include URBA TECH's margin; checkout does not add
  // a separate service fee.
  const service = 0;
  const shipping = subtotal ? shippingEstimate : 0;
  const totals = { subtotal, service, shipping, total: subtotal + service + shipping };

  const addOrder = (type, form) => {
    const order = {
      id: "UT-" + Date.now().toString().slice(-6),
      date: new Date().toISOString().slice(0, 10),
      status: "Payment pending",
      form,
      items: cartLines,
      total: totals.total
    };
    setOrders([order, ...orders]);
    clearCart();
    return order;
  };

  const addProduct = async (product) => {
    if (!user?.token) throw new Error('Admin authentication required');
    const api = createApiClient(user.token);
    const json = await api('/products', { method: 'POST', body: JSON.stringify(product) });
    if (!json?.data) throw new Error('Unable to create product');
    const next = [json.data, ...products];
    setProducts(next);
    await refreshCategories().catch(() => {});
    return json.data;
  };

  const addSupplier = async (supplier) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api("/suppliers", { method: "POST", body: JSON.stringify(supplier) });
    if (!json?.data) throw new Error("Unable to create supplier");
    const next = [...suppliers, json.data].sort((a, b) => a.company_name.localeCompare(b.company_name));
    setSuppliers(next);
    return json.data;
  };

  const updateSupplier = async (id, supplier) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(supplier) });
    if (!json?.data) throw new Error("Unable to update supplier");
    const next = suppliers.map((item) => (item.id === id ? json.data : item));
    setSuppliers(next);
    const productsJson = await api("/products");
    if (productsJson?.data) setProducts(productsJson.data);
    return json.data;
  };

  const deleteSupplier = async (id, deleteAction = "delete") => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    await api(`/suppliers/${id}?deleteAction=${encodeURIComponent(deleteAction)}`, { method: "DELETE" });
    const next = suppliers.filter((item) => item.id !== id);
    setSuppliers(next);
    const productsJson = await api("/products");
    if (productsJson?.data) setProducts(productsJson.data);
  };

  const testSupplier = async (id) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api(`/suppliers/${id}/test`, { method: "POST" });
    if (json?.data) setSuppliers(suppliers.map((item) => (item.id === id ? json.data : item)));
    return json?.data;
  };

  const syncSupplier = async (id) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api(`/suppliers/${id}/sync`, { method: "POST" });
    await refreshSuppliers().catch(() => {});
    const productsJson = await api("/products");
    if (productsJson?.data) setProducts(productsJson.data);
    return json?.data;
  };

  const importSupplierProducts = async (id, payload) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api(`/suppliers/${id}/import-products`, { method: "POST", body: JSON.stringify(payload) });
    if (!json?.data) throw new Error("Unable to import supplier products");
    if (!payload.dryRun) {
      await refreshSuppliers().catch(() => {});
      await refreshCategories().catch(() => {});
      const productsJson = await api("/products");
      if (productsJson?.data) setProducts(productsJson.data);
    }
    return json.data;
  };

  const listSupplierProductImports = async (id) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api(`/suppliers/${id}/imports`);
    return json?.data || [];
  };

  const updateProduct = async (id, product) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api(`/products/${id}`, { method: "PUT", body: JSON.stringify(product) });
    if (!json?.data) throw new Error("Unable to update product");
    const next = products.map((item) => (item.id === id ? json.data : item));
    setProducts(next);
    await refreshCategories().catch(() => {});
    return json.data;
  };

  const deleteProduct = async (id) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    await api(`/products/${id}`, { method: "DELETE" });
    const nextProducts = products.filter((item) => item.id !== id);
    setProducts(nextProducts);
    const nextCart = { ...cart };
    delete nextCart[id];
    setCart(nextCart);
    await refreshCategories().catch(() => {});
  };

  const addCategory = async (category) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api("/categories", { method: "POST", body: JSON.stringify(category) });
    if (!json?.data) throw new Error("Unable to create category");
    const next = [...categories, json.data].sort((a, b) => a.name.localeCompare(b.name));
    setCategories(next);
    return json.data;
  };

  const deleteCategory = async (id) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    try {
      const json = await api(`/categories/${id}`, { method: "DELETE" });
      setCategories(categories.filter((item) => item.id !== id));
      const deletedProductIds = json?.data?.deletedProductIds || [];
      if (deletedProductIds.length) {
        const nextCart = { ...cart };
        deletedProductIds.forEach((productId) => {
          delete nextCart[productId];
        });
        setCart(nextCart);
      }
      const productsJson = await api("/products");
      if (productsJson?.data) setProducts(productsJson.data);
    } catch (err) {
      await refreshCategories().catch(() => {});
      throw err;
    }
  };

  const refreshPaymentProviders = async () => {
    const api = createApiClient(user?.token);
    const json = await api("/payments");
    if (!json?.data) throw new Error("Unable to load payment providers");
    setPaymentProviders(json.data);
    return json.data;
  };

  const updatePaymentProvider = async (id, provider) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api(`/payments/${id}`, { method: "PUT", body: JSON.stringify(provider) });
    if (!json?.data) throw new Error("Unable to update payment provider");
    const next = paymentProviders.map((item) => (item.id === id ? json.data : item));
    setPaymentProviders(next);
    return json.data;
  };

  const createCheckoutSession = async (orderId, providerKey = "stripe") => {
    if (!user?.token) {
      throw new Error("Login required to pay for an order.");
    }
    const api = createApiClient(user.token);
    const json = await api("/checkout/session", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId, provider_key: providerKey, currency })
    });
    if (json?.url) return { url: json.url };
    if (json?.redirectUrl) return { redirectUrl: json.redirectUrl };
    throw new Error("Unable to start payment.");
  };

  const updateSettings = async (nextSettings) => {
    if (!user?.token) throw new Error("Admin authentication required");
    const api = createApiClient(user.token);
    const json = await api("/settings", { method: "PUT", body: JSON.stringify(nextSettings) });
    if (!json?.data) throw new Error("Unable to update settings");
    setSettings(json.data);
    return json.data;
  };

  const value = {
    user,
    authReady,
    login: persistUser,
    logout: () => persistUser(null),
    products,
    productsLoading,
    categories,
    suppliers,
    settings,
    paymentProviders,
    currencies,
    currency,
    setCurrency,
    resetToProductCurrencies,
    setAutomaticCurrencyForCountry,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    testSupplier,
    syncSupplier,
    importSupplierProducts,
    listSupplierProductImports,
    refreshSuppliers,
    refreshPaymentProviders,
    updatePaymentProvider,
    updateSettings,
    cart,
    cartLines,
    cartCount,
    totals,
    refreshCart: syncCartFromServer,
    addToCart,
    changeQty,
    clearCart,
    orders,
    addOrder,
    createOrder,
    updateProfile,
    createCheckoutSession
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
