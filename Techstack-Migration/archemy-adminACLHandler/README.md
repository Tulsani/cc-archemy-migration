# Archemy Admin ACL Handler

Lambda package for the new Archemy security model:

- invite users through Cognito
- write per-user ACL records to DynamoDB
- update/delete users and ACL records
- return the current user's ACL to API Gateway-authorized clients

The DynamoDB table is `Archemy-userACL` by default with `userId` as the partition key.

## User ACL Record

Each invited user is stored as:

```json
{
  "userId": "uuid",
  "email": "person@example.com",
  "firstName": "Person",
  "lastName": "Example",
  "displayName": "Person Example",
  "role": "admin",
  "status": "INVITED",
  "userACL": {
    "role": "admin",
    "permissionIds": ["catalog:view", "users-acl:manage"],
    "capabilities": {
      "canManageCatalog": true,
      "canManageAcl": true
    },
    "domainIds": ["*"],
    "customerIds": ["*"]
  },
  "createdAt": "2026-05-16T00:00:00.000Z",
  "updatedAt": "2026-05-16T00:00:00.000Z"
}
```

Cognito gets these custom attributes:

- `custom:userId`
- `custom:role`

Create those attributes in the user pool before using `invite-user`.

## Environment

Required:

```bash
USER_POOL_ID=<cognito-user-pool-id>
USER_ACL_TABLE=Archemy-userACL
```

Optional:

```bash
ADMIN_ROLE=admin
ALLOW_UNAUTHENTICATED_ADMIN=false
```

For early API Gateway testing without an authorizer, set `ALLOW_UNAUTHENTICATED_ADMIN=true`. Turn it off before sharing the endpoint.

## API Flows

POST body:

```json
{
  "flow_selected": "invite-user",
  "email": "person@example.com",
  "firstName": "Person",
  "lastName": "Example",
  "role": "user",
  "userACL": {
    "domainIds": [1, 2],
    "customerIds": ["customer-a"]
  }
}
```

Supported POST `flow_selected` values:

- `invite-user`
- `delete-user`
- `update-user-acl`
- `set-user-role`

Supported GET `queryType` values:

- `get-all-users`
- `get-user-by-id`
- `get-acl-by-user`
- `get-my-acl`
- `get-default-acl`

For the demo frontend, `get-acl-by-user` is intentionally readable by `userId` without forwarding a Cognito token. Lock this down later by using `get-my-acl` behind an API Gateway Cognito authorizer.



