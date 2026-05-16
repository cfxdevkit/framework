export function mockFetch(
  responses: Record<string, { status?: number; body: unknown }>,
): typeof fetch {
  return async (input, init) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    const path = url.replace('http://localhost:52000', '');
    const method = (init?.method ?? 'GET').toUpperCase();
    const key = `${method} ${path}`;
    const entry = responses[key] ?? responses[path];
    if (!entry) throw new Error(`Unexpected fetch: ${key}`);
    const status = entry.status ?? 200;
    const text = JSON.stringify(entry.body);
    return new Response(text, {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };
}
