function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

export class AclService {
  constructor(repository) {
    this.repository = repository;
  }

  decodePrincipal(req) {
    const mockUser = req.headers['x-mock-user'];
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';

    if (!token) return { userId: mockUser || 'admin.user', tokenClaims: null };

    try {
      const [, payload] = token.split('.');
      const claims = JSON.parse(decodeBase64Url(payload));
      return {
        userId: mockUser || claims['custom:userId'] || claims['cognito:username'] || claims.username || claims.sub || 'admin.user',
        tokenClaims: claims,
      };
    } catch {
      return { userId: mockUser || 'admin.user', tokenClaims: null };
    }
  }

  permissionsForUser(userId, tokenClaims = null) {
    const state = this.repository.state;
    const tokenAcl = tokenClaims?.['custom:acl'] || tokenClaims?.acl;
    if (Array.isArray(tokenAcl)) return tokenAcl;
    if (typeof tokenAcl === 'string' && tokenAcl.trim()) return tokenAcl.split(',').map((item) => item.trim());

    const user = state.users.find((item) => item.id === userId);
    if (!user || user.status !== 'Active') return [];

    const permissions = new Set();
    for (const roleId of user.roleIds) {
      const role = state.accessRoles.find((item) => item.id === roleId);
      role?.permissionIds.forEach((permissionId) => permissions.add(permissionId));
    }
    return Array.from(permissions);
  }

  require(req, permissionId) {
    const principal = this.decodePrincipal(req);
    const permissions = this.permissionsForUser(principal.userId, principal.tokenClaims);
    return {
      ...principal,
      permissions,
      allowed: permissions.includes(permissionId),
    };
  }
}
