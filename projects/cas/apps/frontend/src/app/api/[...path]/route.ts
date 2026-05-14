const PROXY_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const;

type ProxyMethod = (typeof PROXY_METHODS)[number];

export const runtime = 'nodejs';

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;

async function proxy(request: Request, context: ProxyContext): Promise<Response> {
  const backendBase = process.env.NEXT_PUBLIC_CAS_API_URL;
  if (!backendBase) {
    return Response.json({ error: 'Backend URL not configured' }, { status: 503 });
  }

  const params = await Promise.resolve(context.params);
  const path = (params.path ?? []).join('/');
  const target = new URL(`${backendBase.replace(/\/+$/, '')}/${path}`);
  target.search = new URL(request.url).search;

  if (path.startsWith('sse/')) {
    return Response.redirect(target, 307);
  }

  const headers = new Headers();
  copyHeader(request.headers, headers, 'accept');
  copyHeader(request.headers, headers, 'authorization');
  copyHeader(request.headers, headers, 'content-type');

  const method = request.method.toUpperCase() as ProxyMethod;
  const hasBody = method !== 'GET' && method !== 'OPTIONS';
  const upstream = await fetch(target, {
    method,
    headers,
    ...(hasBody ? { body: await request.text() } : {}),
  });

  const responseHeaders = new Headers();
  copyHeader(upstream.headers, responseHeaders, 'content-type');
  copyHeader(upstream.headers, responseHeaders, 'cache-control');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

function copyHeader(source: Headers, target: Headers, key: string): void {
  const value = source.get(key);
  if (value) target.set(key, value);
}

interface ProxyContext {
  params: Promise<{ path?: string[] }> | { path?: string[] };
}
