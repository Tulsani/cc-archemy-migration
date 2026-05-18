import { forbidden, notFound, readJson, sendJson, sendNoContent } from './http/http-utils.mjs';

const collectionConfig = {
  domains: { stateKey: 'domains', idField: 'id', permission: 'manage-domains:manage' },
  dimensions: { stateKey: 'dimensions', idField: 'id', permission: 'manage-dimensions:manage' },
  areas: { stateKey: 'areas', idField: 'id', permission: 'manage-areas:manage' },
  'business-problems': { stateKey: 'businessProblems', idField: 'id', permission: 'manage-bus-probs:manage' },
  registrations: { stateKey: 'registrations', idField: 'id', permission: 'register-usage:view' },
  customers: { stateKey: 'customers', idField: 'userId', permission: 'customer-info:view' },
};

export function createRouter({ repository, catalogService, aclService }) {
  return async function route(req, res, routeInfo) {
    const { method, path, parts } = routeInfo;

    if (method === 'OPTIONS') return sendNoContent(res);
    if (method === 'GET' && path === '/health') return sendJson(res, 200, { ok: true, service: 'archemy-node-app' });

    if (method === 'GET' && path === '/api/bootstrap') {
      const principal = aclService.decodePrincipal(req);
      return sendJson(res, 200, {
        ...repository.snapshot(),
        principal: {
          userId: principal.userId,
          permissions: aclService.permissionsForUser(principal.userId, principal.tokenClaims),
        },
      });
    }

    if (method === 'POST' && path === '/api/reset') {
      if (!requirePermission(req, res, aclService, 'users-acl:manage')) return;
      return sendJson(res, 200, await repository.reset());
    }

    if (method === 'POST' && path === '/api/snapshot') {
      if (!requirePermission(req, res, aclService, 'users-acl:manage')) return;
      const body = await readJson(req);
      for (const key of [
        'users',
        'accessRoles',
        'permissions',
        'domains',
        'dimensions',
        'areas',
        'businessProblems',
        'kads',
        'kadAreas',
        'registrations',
        'customers',
      ]) {
        if (Array.isArray(body[key])) repository.state[key] = structuredClone(body[key]);
      }
      return sendJson(res, 200, repository.snapshot());
    }

    if (method === 'POST' && path === '/api/catalog/search') {
      if (!requirePermission(req, res, aclService, 'catalog:view')) return;
      const body = await readJson(req);
      return sendJson(res, 200, {
        results: catalogService.searchAndRankKad(body.criteria ?? [], body.businessProblemId ?? null),
      });
    }

    if (method === 'POST' && path === '/api/kads') {
      if (!requirePermission(req, res, aclService, 'catalog:add-kad')) return;
      const body = await readJson(req);
      return sendJson(res, 201, await catalogService.addKad(body.kad ?? body, body.criteria ?? []));
    }

    if (method === 'DELETE' && parts[0] === 'api' && parts[1] === 'kads' && parts[2]) {
      if (!requirePermission(req, res, aclService, 'catalog:delete-kad')) return;
      await catalogService.removeKad(parts[2]);
      return sendNoContent(res);
    }

    if (method === 'POST' && parts[0] === 'api' && parts[1] === 'kads' && parts[2] && parts[3] === 'hit') {
      if (!requirePermission(req, res, aclService, 'catalog:view')) return;
      const hitCounter = await catalogService.incrementHitCount(parts[2]);
      return hitCounter === null ? notFound(res) : sendJson(res, 200, { hitCounter });
    }

    if (method === 'GET' && parts[0] === 'api' && parts[1] === 'kads' && parts[2] && parts[3] === 'usage-summary') {
      if (!requirePermission(req, res, aclService, 'usage:view')) return;
      return sendJson(res, 200, { rows: catalogService.summaryForKad(parts[2]) });
    }

    if (parts[0] === 'api' && parts[1] === 'users') return handleUsers(req, res, parts, repository, aclService);
    if (parts[0] === 'api' && parts[1] === 'roles') return handleRoles(req, res, parts, repository, aclService);

    if (parts[0] === 'api' && collectionConfig[parts[1]]) {
      return handleCollection(req, res, parts, repository, aclService, collectionConfig[parts[1]]);
    }

    return notFound(res);
  };
}

async function handleCollection(req, res, parts, repository, aclService, config) {
  if (req.method === 'GET') return sendJson(res, 200, { rows: repository.list(config.stateKey) });
  if (!requirePermission(req, res, aclService, config.permission)) return;

  if (req.method === 'POST') {
    const body = await readJson(req);
    const row = { ...body, [config.idField]: body[config.idField] ?? repository.nextId(config.stateKey, config.idField) };
    return sendJson(res, 201, await repository.upsert(config.stateKey, config.idField, row));
  }

  if (req.method === 'PUT' && parts[2]) {
    const body = await readJson(req);
    return sendJson(res, 200, await repository.upsert(config.stateKey, config.idField, { ...body, [config.idField]: coerceId(parts[2]) }));
  }

  if (req.method === 'DELETE' && parts[2]) {
    await repository.delete(config.stateKey, config.idField, parts[2]);
    return sendNoContent(res);
  }

  return notFound(res);
}

async function handleUsers(req, res, parts, repository, aclService) {
  if (!requirePermission(req, res, aclService, 'users-acl:manage')) return;

  if (req.method === 'GET') return sendJson(res, 200, { rows: repository.list('users') });
  if (req.method === 'POST') {
    const body = await readJson(req);
    return sendJson(res, 201, await repository.upsert('users', 'id', body));
  }
  if (req.method === 'PUT' && parts[2]) {
    const body = await readJson(req);
    return sendJson(res, 200, await repository.upsert('users', 'id', { ...body, id: parts[2] }));
  }
  if (req.method === 'DELETE' && parts[2]) {
    await repository.delete('users', 'id', parts[2]);
    repository.state.customers = repository.state.customers.filter((customer) => customer.userId !== parts[2]);
    repository.state.registrations = repository.state.registrations.filter((registration) => registration.userId !== parts[2]);
    return sendNoContent(res);
  }
  return notFound(res);
}

async function handleRoles(req, res, parts, repository, aclService) {
  if (!requirePermission(req, res, aclService, 'users-acl:manage')) return;

  if (req.method === 'GET') return sendJson(res, 200, { rows: repository.list('accessRoles') });
  if (req.method === 'POST') {
    const body = await readJson(req);
    return sendJson(res, 201, await repository.upsert('accessRoles', 'id', body));
  }
  if (req.method === 'PUT' && parts[2]) {
    const body = await readJson(req);
    return sendJson(res, 200, await repository.upsert('accessRoles', 'id', { ...body, id: parts[2] }));
  }
  if (req.method === 'DELETE' && parts[2]) {
    await repository.delete('accessRoles', 'id', parts[2]);
    repository.state.users.forEach((user) => {
      user.roleIds = user.roleIds.filter((roleId) => roleId !== parts[2]);
    });
    return sendNoContent(res);
  }
  return notFound(res);
}

function requirePermission(req, res, aclService, permission) {
  const result = aclService.require(req, permission);
  if (!result.allowed) {
    forbidden(res, permission);
    return false;
  }
  return true;
}

function coerceId(id) {
  return Number.isNaN(Number(id)) ? id : Number(id);
}
