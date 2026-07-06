let csrfToken = null;

export async function fetchCsrfToken() {
  const response = await fetch("/api/csrf-token", {
    method: "GET",
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Unable to fetch CSRF token");
  }
  const json = await response.json();
  csrfToken = json.csrfToken;
  return json;
}

async function getCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }
  const json = await fetchCsrfToken();
  return json.csrfToken;
}

export function createApiClient(token) {
  return async function apiFetch(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    if (method !== "GET" && method !== "HEAD") {
      headers["X-CSRF-Token"] = await getCsrfToken();
    }

    const requestOptions = { ...options, headers, credentials: "include" };
    delete requestOptions._csrfRetry;
    delete requestOptions._refreshAttempted;
    delete requestOptions._timeout;
    // implement up to 2 network retries with exponential backoff
    const maxNetworkRetries = 3;
    let attempt = 0;
    let lastErr;
    while (attempt <= maxNetworkRetries) {
      try {
        // set up timeout for this fetch
        const controller = new AbortController();
        requestOptions.signal = controller.signal;
        const timeoutMs = options._timeout || 5000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(`/api${path}`, requestOptions).finally(() => clearTimeout(timeoutId));
        // on success, break the loop
        lastErr = null;
        attempt = maxNetworkRetries + 1;
        // use the response outside the loop
        var finalResponse = response;
        break;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[api] network error on', path, err && err.message, { path, method, attempt });
        lastErr = err;
        attempt += 1;
        if (attempt > maxNetworkRetries) break;
        // exponential backoff: 150ms, 400ms
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, attempt === 1 ? 150 : 400));
      }
    }

    if (lastErr) throw lastErr;

    // log request id from response headers if present
    try {
      const respRequestId = finalResponse.headers.get('x-request-id');
      if (respRequestId) {
        // eslint-disable-next-line no-console
        console.log('[api] response requestId=', respRequestId, path);
      }
    } catch (e) {}
    if (finalResponse.status === 403 && method !== "GET" && !options._csrfRetry) {
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
          // ignore refresh failure and fall through to the original error
        }
      }

      if (finalResponse.status === 401 && token && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ut:auth-invalid"));
      }

      const contentType = finalResponse.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const json = await finalResponse.json().catch(() => null);
        const error = json?.error || json?.message;
        throw new Error(error || finalResponse.statusText);
      }

      const text = await finalResponse.text();
      throw new Error(text || finalResponse.statusText);
    }
    return finalResponse.json();
  };
}
