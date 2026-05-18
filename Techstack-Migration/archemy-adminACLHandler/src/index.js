const aclStore = require('./aclStore');
const cognitoHandler = require('./cognitoHandler');
const {
  badRequest,
  forbidden,
  methodOf,
  noContent,
  notFound,
  ok,
  parseBody,
  queryOf,
  serverError,
} = require('./http');

const adminRole = process.env.ADMIN_ROLE || 'admin';
const allowUnauthenticatedAdmin = process.env.ALLOW_UNAUTHENTICATED_ADMIN === 'true';

exports.handler = async (event) => {
  console.log('Event', JSON.stringify(event));

  try {
    const method = methodOf(event);
    if (method === 'OPTIONS') return noContent();

    if (method === 'GET') return handleGet(event);
    if (method === 'POST') return handlePost(event);

    return notFound(`Unsupported method: ${method}`);
  } catch (error) {
    return serverError(error);
  }
};

async function handleGet(event) {
  const query = queryOf(event);
  const queryType = query.queryType;

  if (queryType === 'get-my-acl') {
    const userId = userIdFromClaims(event);
    if (!userId) return forbidden('Authenticated userId claim is required');
    const user = await aclStore.getUser(userId);
    return user ? ok({ success: true, user, userACL: user.userACL }) : notFound('ACL record not found');
  }

  if (queryType === 'get-acl-by-user') {
    const userId = query.userId || query.userid;
    return ok(await cognitoHandler.getUserById(userId));
  }

  if (!isAdmin(event)) return forbidden('Admin role is required');

  if (queryType === 'get-all-users') return ok(await cognitoHandler.getUsers());

  if (queryType === 'get-user-by-id') {
    const userId = query.userId || query.userid;
    return ok(await cognitoHandler.getUserById(userId));
  }

  if (queryType === 'get-default-acl') {
    const { defaultAclByRole, permissions } = require('./permissions');
    return ok({ success: true, defaultAclByRole, permissions });
  }

  return badRequest('Unsupported queryType', { queryType });
}

async function handlePost(event) {
  if (!isAdmin(event)) return forbidden('Admin role is required');

  const body = parseBody(event);
  const flow = body.flow_selected;

  if (flow === 'invite-user') {
    return ok(await cognitoHandler.inviteUser(body));
  }

  if (flow === 'delete-user') {
    return ok(await cognitoHandler.deleteUser(body.userId || body.userid));
  }

  if (flow === 'update-user-acl') {
    return ok(await cognitoHandler.updateUserAcl(body.userId || body.userid, body.userACL));
  }

  if (flow === 'set-user-role') {
    return ok(await cognitoHandler.setUserRole(body.userId || body.userid, body.role, body.userACL));
  }

  return badRequest('Unsupported flow_selected', { flow_selected: flow });
}

function isAdmin(event) {
  if (allowUnauthenticatedAdmin) return true;

  const claims = claimsFromEvent(event);
  const role = claims['custom:role'] || claims.role;
  const groups = String(claims['cognito:groups'] || '');

  return role === adminRole || groups.split(',').map((item) => item.trim()).includes(adminRole);
}

function userIdFromClaims(event) {
  const claims = claimsFromEvent(event);
  return claims['custom:userId'] || claims.userId || claims.sub || null;
}

function claimsFromEvent(event) {
  return event.requestContext?.authorizer?.jwt?.claims || event.requestContext?.authorizer?.claims || {};
}
