const permissions = [
  'search-kad:view',
  'catalog:view',
  'catalog:add-kad',
  'catalog:delete-kad',
  'usage:view',
  'usage:edit-comments',
  'register-usage:view',
  'manage-domains:manage',
  'manage-dimensions:manage',
  'manage-areas:manage',
  'manage-bus-probs:manage',
  'customer-profile:view',
  'customer-info:view',
  'password:change',
  'users-acl:manage',
];

const defaultAclByRole = {
  admin: {
    role: 'admin',
    permissionIds: permissions,
    capabilities: {
      canManageCatalog: true,
      canManageAcl: true,
      canViewCustomers: true,
    },
    domainIds: ['*'],
    customerIds: ['*'],
  },
  user: {
    role: 'user',
    permissionIds: [
      'search-kad:view',
      'catalog:view',
      'usage:view',
      'register-usage:view',
      'customer-profile:view',
      'password:change',
    ],
    capabilities: {
      canManageCatalog: false,
      canManageAcl: false,
      canViewCustomers: false,
    },
    domainIds: ['*'],
    customerIds: [],
  },
};

function aclForRole(role, overrideAcl = null) {
  return {
    ...(defaultAclByRole[role] || defaultAclByRole.user),
    ...(overrideAcl || {}),
    role,
  };
}

module.exports = { aclForRole, defaultAclByRole, permissions };
