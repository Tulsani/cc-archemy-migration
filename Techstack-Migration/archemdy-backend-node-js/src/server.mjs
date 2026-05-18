import http from 'node:http';
import { databaseConfig } from './config/rds-config.mjs';
import { parseRoute, sendJson } from './http/http-utils.mjs';
import { MockRepository } from './repositories/mock-repository.mjs';
import { RdsRepository } from './repositories/rds-repository.mjs';
import { AclService } from './services/acl-service.mjs';
import { CatalogService } from './services/catalog-service.mjs';
import { createRouter } from './routes.mjs';

const port = Number(process.env.PORT || 3000);

const repository = databaseConfig.enabled ? new RdsRepository(databaseConfig) : new MockRepository();
await repository.connect?.();

const catalogService = new CatalogService(repository);
const aclService = new AclService(repository);
const router = createRouter({ repository, catalogService, aclService });

const server = http.createServer(async (req, res) => {
  try {
    await router(req, res, parseRoute(req));
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'Internal server error', detail: error.message });
  }
});

server.listen(port, () => {
  console.log(`Archemy Node API listening on http://localhost:${port}`);
});
