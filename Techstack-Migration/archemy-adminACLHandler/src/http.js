const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization,x-api-key',
  'access-control-max-age': '86400',
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
    body: JSON.stringify(body ?? {}),
  };
}

function noContent() {
  return { statusCode: 204, headers: corsHeaders, body: '' };
}

function ok(body) {
  return response(200, body);
}

function created(body) {
  return response(201, body);
}

function badRequest(message, details = undefined) {
  return response(400, { success: false, message, details });
}

function forbidden(message = 'Forbidden') {
  return response(403, { success: false, message });
}

function notFound(message = 'Not found') {
  return response(404, { success: false, message });
}

function serverError(error) {
  console.error(error);
  return response(500, {
    success: false,
    message: 'Internal server error',
    detail: error.message,
  });
}

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function methodOf(event) {
  return event.requestContext?.http?.method || event.httpMethod || 'GET';
}

function queryOf(event) {
  return event.queryStringParameters || {};
}

module.exports = {
  badRequest,
  created,
  forbidden,
  methodOf,
  noContent,
  notFound,
  ok,
  parseBody,
  queryOf,
  response,
  serverError,
};
