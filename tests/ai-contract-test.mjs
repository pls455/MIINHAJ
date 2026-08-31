const url = process.env.MINHAJ_AI_URL || 'https://minhaj1.karamhahhss123.workers.dev';

async function request(path, options) {
  const response = await fetch(`${url}${path}`, options);
  const body = await response.json().catch(() => null);
  return { response, body };
}

const options = await request('/ai', { method: 'OPTIONS', headers: { Origin: 'https://pls455.github.io' } });
if (options.response.status !== 204) throw new Error(`AI CORS preflight failed: HTTP ${options.response.status}`);

const invalid = await request('/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'https://pls455.github.io' },
  body: JSON.stringify({ action: '__invalid__' })
});
if (invalid.response.status !== 400 || invalid.body?.ok !== false || invalid.body?.error !== 'Invalid action') {
  throw new Error(`AI contract validation failed: HTTP ${invalid.response.status}`);
}

console.log(`AI contract test passed: ${url}`);