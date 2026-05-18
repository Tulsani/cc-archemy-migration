const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization,x-mock-user',
  'access-control-max-age': '86400',
};

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

export function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    ...corsHeaders,
  });
  res.end(JSON.stringify(payload));
}

export function sendNoContent(res) {
  res.writeHead(204, {
    ...corsHeaders,
  });
  res.end();
}

export function notFound(res) {
  sendJson(res, 404, { error: 'Not found' });
}

export function forbidden(res, permission) {
  sendJson(res, 403, { error: 'Forbidden', permission });
}

export function parseRoute(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return {
    method: req.method,
    path: url.pathname,
    parts: url.pathname.split('/').filter(Boolean),
    query: url.searchParams,
  };
}
