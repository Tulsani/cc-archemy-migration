# Archemy Node API

Node.js migration backend for the ADF `ArchemySearchAM` business logic.

This backend now uses the RDS-backed repository by default for the core Archemy catalog tables. ACL/user data is still an in-memory placeholder because the target design moves that work to Cognito plus DynamoDB.

## Run locally

Fill in the temporary RDS password placeholder first:

```js
// src/config/rds-config.mjs
password: '<your-rds-password>'
```

Then run:

```bash
npm install
npm start
```

Default URL: `http://localhost:3000`

The RDS connection is currently hardcoded in `src/config/rds-config.mjs` for quick validation:

- Host: `archemy-database-1.ckvcqmcakbxd.us-east-1.rds.amazonaws.com`
- Port: `3306`
- User: `admin`
- Database: `archemy`



## Useful endpoints

- `GET /health`
- `GET /api/bootstrap`
- `POST /api/catalog/search`
- `POST /api/kads`
- `DELETE /api/kads/:id`
- `POST /api/kads/:id/hit`
- `GET /api/kads/:id/usage-summary`
- `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- `POST /api/roles`, `PUT /api/roles/:id`, `DELETE /api/roles/:id`


## Docker

```bash
docker build -t archemy-node-app .
docker run -p 3000:3000 archemy-node-app
```

The Docker image copies the same `src/config/rds-config.mjs` file. Keep the placeholder for source control, then switch to environment/secret injection before publishing the image.
