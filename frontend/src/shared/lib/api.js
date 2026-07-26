import { t } from "../../i18n.js";

let csrfToken = null;

// Read CSRF token from cookie set by backend (csurf middleware)
function getCsrfFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Get CSRF token (from cache → cookie → fetch endpoint)
async function getCsrfToken() {
  if (csrfToken && csrfToken !== "disabled") return csrfToken;

  const fromCookie = getCsrfFromCookie();
  if (fromCookie && fromCookie !== "disabled") {
    csrfToken = fromCookie;
    return csrfToken;
  }

  try {
    const res = await fetch("/api/csrf-token", { method: "GET", credentials: "include" });
    if (!res.ok) { csrfToken = "disabled"; return ""; }
    const json = await res.json();
    csrfToken = json.csrfToken;
    return csrfToken || "";
  } catch {
    csrfToken = "disabled";
    return "";
  }
}

// Translate error message from errorKey if available
function translateError(error) {
  if (error && error.errorKey) {
    let translated = t(error.errorKey);
    const params = error.errorParams || {};
    Object.keys(params).forEach((k) => {
      translated = translated.replace(`{${k}}`, String(params[k]));
    });
    return translated;
  }
  return error?.message || String(error || "");
}

export function createApiClient(token) {
  return async function apiFetch(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    // Add CSRF token only for mutation requests (needed for /auth/refresh which uses cookies)
    if (method !== "GET" && method !== "HEAD") {
      const csrf = await getCsrfToken();
      if (csrf) {
        headers["X-CSRF-Token"] = csrf;
      }
    }

    const requestOptions = { ...options, headers, credentials: "include" };
    delete requestOptions._csrfRetry;
    delete requestOptions._refreshAttempted;
    delete requestOptions._timeout;

    const maxNetworkRetries = 3;
    let attempt = 0;
    let lastErr;
    while (attempt <= maxNetworkRetries) {
      try {
        const controller = new AbortController();
        requestOptions.signal = controller.signal;
        const timeoutMs = options._timeout || 15000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(`/api${path}`, requestOptions).finally(() => clearTimeout(timeoutId));
        lastErr = null;
        attempt = maxNetworkRetries + 1;
        var finalResponse = response;
        break;
      } catch (err) {
        console.error('[api] network error on', path, err && err.message, { path, method, attempt });
        lastErr = err;
        attempt += 1;
        if (attempt > maxNetworkRetries) break;
        await new Promise((r) => setTimeout(r, attempt === 1 ? 150 : 400));
      }
    }

    if (lastErr) throw lastErr;

    if (finalResponse.status === 403 && method !== "GET" && !options._csrfRetry) {
      // CSRF token might be invalid - clear and retry once
      csrfToken = null;
      return apiFetch(path, { ...options, _csrfRetry: true });
    }

    if (!finalResponse.ok) {
      if (finalResponse.status === 401 && token && !options._refreshAttempted) {
        try {
          const refreshJson = await apiFetch("/auth/refresh", {
            method: "POST",
            _refreshAttempted: true
          });
          if (refreshJson?.token) {
            token = refreshJson.token;
            headers.Authorization = `Bearer ${token}`;
            const retryOptions = { ...options, headers, _refreshAttempted: true };
            return apiFetch(path, retryOptions);
          }
        } catch (refreshError) {
          // ignore
        }
      }

      // Check if session explicitly expired (4-hour limit reached)
      if (finalResponse.status === 401 && token && typeof window !== "undefined") {
        if (finalResponse.headers.get("Content-Type")?.includes("application/json")) {
          const jsonErr = await finalResponse.json().catch(() => null);
          if (jsonErr?.sessionExpired) {
            window.dispatchEvent(new CustomEvent("ut:session-expired"));
            const err = new Error(jsonErr.error || "Session expired");
            err.status = 401;
            err.sessionExpired = true;
            throw err;
          }
        }
        window.dispatchEvent(new CustomEvent("ut:auth-invalid"));
      }

      const contentType = finalResponse.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const json = await finalResponse.json().catch(() => null);
        // If backend returned a structured error object, preserve key and params
        if (json && typeof json.error === "object" && json.error !== null && (json.error.key || json.error.params || json.error.message)) {
          const err = new Error(json.error.message || JSON.stringify(json.error) || finalResponse.statusText);
          err.status = finalResponse.status;
          err.errorKey = json.error.key || json.errorKey || null;
          err.errorParams = json.error.params || json.errorParams || null;
          err.requestId = json.requestId || null;
          // Translate error message to current language
          if (err.errorKey) {
            err.message = translateError(err);
          }
          throw err;
        }

        const error = json?.error || json?.message;
        const err = new Error(error || finalResponse.statusText);
        err.status = finalResponse.status;
        // Detect legacy raw supplier error string and attach structured key for localization
        try {
          const m = String(err.message || "").match(/Supplier API failed with\s*(\d+)/i);
          if (m) {
            err.errorKey = "supplierApiFailedWithStatus";
            err.errorParams = { code: m[1] };
            err.message = translateError(err);
          }
        } catch {}
        throw err;
      }

      const text = await finalResponse.text();
      const err = new Error(text || finalResponse.statusText);
      err.status = finalResponse.status;
      try {
        const m = String(err.message || "").match(/Supplier API failed with\s*(\d+)/i);
        if (m) {
          err.errorKey = "supplierApiFailedWithStatus";
          err.errorParams = { code: m[1] };
          err.message = translateError(err);
        }
      } catch {}
      throw err;
    }
    return finalResponse.json();
  };
}