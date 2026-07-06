// Polyfill global.fetch using node-fetch only when fetch is not available.
// Use dynamic import so we don't require node-fetch to be installed when running on Node 18+.
if (typeof global.fetch === 'undefined') {
  try {
    const mod = await import('node-fetch');
    // node-fetch exports the fetch function as default in ESM
    global.fetch = mod.default || mod;
    // eslint-disable-next-line no-console
    console.log('[polyfill] node-fetch loaded as global.fetch');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[polyfill] node-fetch not available; global.fetch remains undefined');
  }
} else {
  // eslint-disable-next-line no-console
  console.log('[polyfill] global.fetch is already available');
}
