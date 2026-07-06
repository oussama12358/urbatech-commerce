import { strict as assert } from 'assert';

const url = 'http://127.0.0.1:8081';
let cookies = [];

function updateCookies(setCookieHeaders) {
  if (!setCookieHeaders) return;
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  headers.forEach((header) => {
    const [cookiePair] = header.split(';');
    const [name, value] = cookiePair.split('=');
    const existingIndex = cookies.findIndex((c) => c.startsWith(`${name}=`));
    const entry = `${name}=${value}`;
    if (existingIndex === -1) cookies.push(entry);
    else cookies[existingIndex] = entry;
  });
}

async function apiFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (cookies.length) headers.Cookie = cookies.join('; ');
  const response = await fetch(`${url}${path}`, { ...opts, headers });
  updateCookies(response.headers.get('set-cookie'));
  return response;
}

async function main() {
  const csrfRes = await apiFetch('/api/csrf-token');
  console.log('csrf status', csrfRes.status);
  const csrfJson = await csrfRes.json();
  console.log('csrf token', csrfJson.csrfToken);

  const email = `debug-${Date.now()}@example.com`;
  const signupRes = await apiFetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfJson.csrfToken },
    body: JSON.stringify({ name: 'Debug User', email, password: 'Debug@1234' })
  });
  console.log('signup status', signupRes.status);
  const signupBody = await signupRes.text();
  console.log('signup body', signupBody);
  if (signupRes.status !== 201) {
    console.error('Signup failed');
    process.exit(1);
  }
  const signupJson = JSON.parse(signupBody);
  const token = signupJson.token;
  assert(token, 'No token');

  const csrf2 = await apiFetch('/api/csrf-token');
  const csrfJson2 = await csrf2.json();
  const cartRes = await apiFetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfJson2.csrfToken,
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ 'environment-mini': 1 })
  });
  console.log('cart post status', cartRes.status);
  console.log('cart post body', await cartRes.text());

  const cartGet = await apiFetch('/api/cart', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('cart get status', cartGet.status);
  console.log('cart get body', await cartGet.text());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
