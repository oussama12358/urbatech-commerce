import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8081",
        // ensure Host header matches target to avoid backend host checks
        changeOrigin: true,
        secure: false,
        // attach detailed logging handlers to help diagnose proxy errors (runs in dev server)
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // attach a request id header so we can trace this request through the backend
            const requestId = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
            try {
              proxyReq.setHeader('X-Request-Id', requestId);
            } catch (e) {}
            // log outgoing proxied request
            // eslint-disable-next-line no-console
            console.log('[vite-proxy] proxyReq', req.method, req.url, 'reqId=' + requestId);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // log proxied response status
            // eslint-disable-next-line no-console
            console.log('[vite-proxy] proxyRes', req.method, req.url, proxyRes.statusCode);
          });
          proxy.on('error', (err, req, res) => {
            // eslint-disable-next-line no-console
            console.error('[vite-proxy] error:', err && err.message, { url: req && req.url });
            // If the proxied server closed the connection unexpectedly, respond with a clean 502
            try {
              if (res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Proxy error', detail: err && err.message }));
                return;
              }
            } catch (e) {
              // ignore any residual errors while attempting to end the response
            }
          });
        }
      }
    }
  }
});
