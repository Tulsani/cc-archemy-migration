import mysql from 'mysql2/promise';
import { createSeedState } from '../data/seed.mjs';

const passthroughCollections = new Set(['permissions', 'accessRoles', 'users']);

export class RdsRepository {
  constructor(config) {
    this.config = config;
    this.pool = null;
    this.state = structuredClone(createSeedState());
  }

  async connect() {
    if (!this.config.password) {
      throw new Error('RDS password is blank. Fill password in node-app/src/config/rds-config.mjs before starting the server.');
    }

    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      ssl: this.config.ssl ? { rejectUnauthorized: true } : undefined,
    });

    await this.reload();
    console.log(`Connected to RDS MySQL ${this.config.host}/${this.config.database}`);
  }

  async reload() {
    const [domains, dimensions, areas, businessProblems, kads, kadAreas, registrations, customers] = await Promise.all([
      this.query('SELECT DOMAIN_ID, DOMAIN_NAME, DOMAIN_DESCRIPTION FROM domains ORDER BY DOMAIN_NAME'),
      this.query('SELECT DIMENSION_ID, DIMENSION_NAME, DOMAIN_ID FROM dimensions ORDER BY DIMENSION_NAME'),
      this.query('SELECT AREA_ID, AREA_PARENT_ID, AREA_ORDER_NO, AREA_DEPTH_LEVEL, DIMENSION_ID, AREA_NAME FROM areas ORDER BY DIMENSION_ID, AREA_DEPTH_LEVEL, CAST(AREA_ORDER_NO AS UNSIGNED), AREA_NAME'),
      this.query('SELECT ID, BUSINESS_PROBLEM, CONTEXT, TYPE, DESCRIPTION FROM recurring_bus_problem ORDER BY ID'),
      this.query('SELECT KAD_ID, KAD_NAME, DOMAIN_ID, KAD_LINK, KAD_LINK_PUBLIC, KAD_HIT_COUNTER, RECURRING_BUS_PROBLEM_ID FROM kads ORDER BY KAD_ID'),
      this.query('SELECT ID, KAD_ID, DIMENSION_ID, AREA_ID, AREA_PARENT_ID FROM kad_dimensions_area ORDER BY KAD_ID, DIMENSION_ID, ID'),
      this.query('SELECT ID, USER_ID, KAD_ID, MATURITY_RATING, DEPLOYMENT_STATUS, APPLICABILITY_EXTENT, BENEFIT_RATING, COMMENTS FROM kad_registration ORDER BY ID'),
      this.query('SELECT USER_ID, CUSTOMER_NAME, INDUSTRY FROM customer_info ORDER BY USER_ID'),
    ]);

    this.state.domains = domains.map((row) => ({
      id: row.DOMAIN_ID,
      name: row.DOMAIN_NAME,
      description: row.DOMAIN_DESCRIPTION ?? '',
    }));
    this.state.dimensions = dimensions.map((row) => ({
      id: row.DIMENSION_ID,
      name: row.DIMENSION_NAME,
      domainId: row.DOMAIN_ID,
    }));
    this.state.areas = areas.map((row) => ({
      id: row.AREA_ID,
      parentId: row.AREA_PARENT_ID,
      orderNo: row.AREA_ORDER_NO,
      depth: row.AREA_DEPTH_LEVEL,
      dimensionId: row.DIMENSION_ID,
      name: row.AREA_NAME,
    }));
    this.state.businessProblems = businessProblems.map((row) => ({
      id: row.ID,
      businessProblem: row.BUSINESS_PROBLEM,
      context: row.CONTEXT ?? '',
      type: row.TYPE ?? '',
      description: row.DESCRIPTION ?? '',
    }));
    this.state.kads = kads.map((row) => ({
      id: row.KAD_ID,
      name: row.KAD_NAME,
      domainId: row.DOMAIN_ID,
      link: row.KAD_LINK,
      publicLink: row.KAD_LINK_PUBLIC,
      hitCounter: row.KAD_HIT_COUNTER ?? 0,
      businessProblemId: row.RECURRING_BUS_PROBLEM_ID,
    }));
    this.state.kadAreas = kadAreas.map((row) => ({
      id: row.ID,
      kadId: row.KAD_ID,
      dimensionId: row.DIMENSION_ID,
      areaId: row.AREA_ID,
      areaParentId: row.AREA_PARENT_ID,
    }));
    this.state.registrations = registrations.map((row) => ({
      id: row.ID,
      userId: row.USER_ID,
      kadId: row.KAD_ID,
      maturityRating: row.MATURITY_RATING,
      deploymentStatus: row.DEPLOYMENT_STATUS,
      applicabilityExtent: row.APPLICABILITY_EXTENT,
      benefitRating: row.BENEFIT_RATING,
      comments: row.COMMENTS ?? '',
    }));
    this.state.customers = customers.map((row) => ({
      userId: row.USER_ID,
      customerName: row.CUSTOMER_NAME ?? '',
      industry: row.INDUSTRY ?? '',
    }));

    return this.snapshot();
  }

  snapshot() {
    return structuredClone(this.state);
  }

  async reset() {
    return this.reload();
  }

  list(collection) {
    return structuredClone(this.state[collection] ?? []);
  }

  replaceCollection(collection, rows) {
    this.state[collection] = structuredClone(rows);
    return this.list(collection);
  }

  nextId(collection, idField = 'id') {
    return Math.max(0, ...this.state[collection].map((item) => Number(item[idField]) || 0)) + 1;
  }

  async upsert(collection, idField, row) {
    if (passthroughCollections.has(collection)) return this.upsertMemory(collection, idField, row);

    if (collection === 'domains') return this.upsertDomain(row);
    if (collection === 'dimensions') return this.upsertDimension(row);
    if (collection === 'areas') return this.upsertArea(row);
    if (collection === 'businessProblems') return this.upsertBusinessProblem(row);
    if (collection === 'registrations') return this.upsertRegistration(row);
    if (collection === 'customers') return this.upsertCustomer(row);

    throw new Error(`Unsupported RDS upsert collection: ${collection}`);
  }

  async delete(collection, idField, id) {
    if (passthroughCollections.has(collection)) return this.deleteMemory(collection, idField, id);

    const tableByCollection = {
      domains: ['domains', 'DOMAIN_ID'],
      dimensions: ['dimensions', 'DIMENSION_ID'],
      areas: ['areas', 'AREA_ID'],
      businessProblems: ['recurring_bus_problem', 'ID'],
      registrations: ['kad_registration', 'ID'],
      customers: ['customer_info', 'USER_ID'],
    };
    const target = tableByCollection[collection];
    if (!target) throw new Error(`Unsupported RDS delete collection: ${collection}`);

    const [table, column] = target;
    const [result] = await this.pool.execute(`DELETE FROM ${table} WHERE ${column} = ?`, [id]);
    await this.reload();
    return result.affectedRows > 0;
  }

  async createKad(input, criteria = []) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO kads
          (KAD_NAME, DOMAIN_ID, KAD_LINK, KAD_LINK_PUBLIC, KAD_HIT_COUNTER, RECURRING_BUS_PROBLEM_ID)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [input.name, Number(input.domainId), input.link ?? '', input.publicLink ?? '', Number(input.businessProblemId)],
      );

      const kadId = result.insertId;
      for (const item of criteria.filter((row) => row.dimensionId)) {
        await connection.execute(
          `INSERT INTO kad_dimensions_area (KAD_ID, DIMENSION_ID, AREA_ID, AREA_PARENT_ID)
           VALUES (?, ?, ?, ?)`,
          [
            kadId,
            Number(item.dimensionId),
            item.areaChildId ? Number(item.areaChildId) : item.areaId ? Number(item.areaId) : null,
            item.areaChildId ? Number(item.areaId) : 0,
          ],
        );
      }

      await connection.commit();
      await this.reload();
      return structuredClone(this.state.kads.find((kad) => kad.id === kadId));
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async removeKad(kadId) {
    await this.pool.execute('DELETE FROM kads WHERE KAD_ID = ?', [Number(kadId)]);
    await this.reload();
  }

  async incrementKadHit(kadId) {
    const [result] = await this.pool.execute('UPDATE kads SET KAD_HIT_COUNTER = COALESCE(KAD_HIT_COUNTER, 0) + 1 WHERE KAD_ID = ?', [
      Number(kadId),
    ]);
    if (!result.affectedRows) return null;

    const [rows] = await this.pool.execute('SELECT KAD_HIT_COUNTER FROM kads WHERE KAD_ID = ?', [Number(kadId)]);
    const hitCounter = rows[0]?.KAD_HIT_COUNTER ?? null;
    const kad = this.state.kads.find((item) => item.id === Number(kadId));
    if (kad) kad.hitCounter = hitCounter;
    return hitCounter;
  }

  async query(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }

  upsertMemory(collection, idField, row) {
    const rows = this.state[collection];
    const index = rows.findIndex((item) => String(item[idField]) === String(row[idField]));
    if (index >= 0) rows[index] = { ...rows[index], ...row };
    else rows.push(row);
    return structuredClone(index >= 0 ? rows[index] : row);
  }

  deleteMemory(collection, idField, id) {
    const before = this.state[collection].length;
    this.state[collection] = this.state[collection].filter((item) => String(item[idField]) !== String(id));
    return before !== this.state[collection].length;
  }

  async upsertDomain(row) {
    await this.pool.execute(
      `INSERT INTO domains (DOMAIN_ID, DOMAIN_NAME, DOMAIN_DESCRIPTION)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE DOMAIN_NAME = VALUES(DOMAIN_NAME), DOMAIN_DESCRIPTION = VALUES(DOMAIN_DESCRIPTION)`,
      [row.id, row.name, row.description ?? null],
    );
    await this.reload();
    return structuredClone(this.state.domains.find((item) => item.id === Number(row.id)));
  }

  async upsertDimension(row) {
    await this.pool.execute(
      `INSERT INTO dimensions (DIMENSION_ID, DIMENSION_NAME, DOMAIN_ID)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE DIMENSION_NAME = VALUES(DIMENSION_NAME), DOMAIN_ID = VALUES(DOMAIN_ID)`,
      [row.id, row.name, Number(row.domainId)],
    );
    await this.reload();
    return structuredClone(this.state.dimensions.find((item) => item.id === Number(row.id)));
  }

  async upsertArea(row) {
    await this.pool.execute(
      `INSERT INTO areas (AREA_ID, AREA_PARENT_ID, AREA_ORDER_NO, AREA_DEPTH_LEVEL, DIMENSION_ID, AREA_NAME)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         AREA_PARENT_ID = VALUES(AREA_PARENT_ID),
         AREA_ORDER_NO = VALUES(AREA_ORDER_NO),
         AREA_DEPTH_LEVEL = VALUES(AREA_DEPTH_LEVEL),
         DIMENSION_ID = VALUES(DIMENSION_ID),
         AREA_NAME = VALUES(AREA_NAME)`,
      [row.id, row.parentId ?? null, row.orderNo ?? null, row.depth ?? 0, Number(row.dimensionId), row.name],
    );
    await this.reload();
    return structuredClone(this.state.areas.find((item) => item.id === Number(row.id)));
  }

  async upsertBusinessProblem(row) {
    await this.pool.execute(
      `INSERT INTO recurring_bus_problem (ID, BUSINESS_PROBLEM, CONTEXT, TYPE, DESCRIPTION)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         BUSINESS_PROBLEM = VALUES(BUSINESS_PROBLEM),
         CONTEXT = VALUES(CONTEXT),
         TYPE = VALUES(TYPE),
         DESCRIPTION = VALUES(DESCRIPTION)`,
      [row.id, row.businessProblem, row.context ?? null, row.type ?? null, row.description ?? null],
    );
    await this.reload();
    return structuredClone(this.state.businessProblems.find((item) => item.id === Number(row.id)));
  }

  async upsertRegistration(row) {
    await this.pool.execute(
      `INSERT INTO kad_registration
        (ID, USER_ID, KAD_ID, MATURITY_RATING, DEPLOYMENT_STATUS, APPLICABILITY_EXTENT, BENEFIT_RATING, COMMENTS)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         USER_ID = VALUES(USER_ID),
         KAD_ID = VALUES(KAD_ID),
         MATURITY_RATING = VALUES(MATURITY_RATING),
         DEPLOYMENT_STATUS = VALUES(DEPLOYMENT_STATUS),
         APPLICABILITY_EXTENT = VALUES(APPLICABILITY_EXTENT),
         BENEFIT_RATING = VALUES(BENEFIT_RATING),
         COMMENTS = VALUES(COMMENTS)`,
      [
        row.id,
        row.userId,
        Number(row.kadId),
        Number(row.maturityRating) || 0,
        row.deploymentStatus ?? '',
        row.applicabilityExtent ?? '',
        Number(row.benefitRating) || 0,
        row.comments ?? null,
      ],
    );
    await this.reload();
    return structuredClone(this.state.registrations.find((item) => item.id === Number(row.id)));
  }

  async upsertCustomer(row) {
    await this.pool.execute(
      `INSERT INTO customer_info (USER_ID, CUSTOMER_NAME, INDUSTRY)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE CUSTOMER_NAME = VALUES(CUSTOMER_NAME), INDUSTRY = VALUES(INDUSTRY)`,
      [row.userId, row.customerName ?? '', row.industry ?? ''],
    );
    await this.reload();
    return structuredClone(this.state.customers.find((item) => item.userId === row.userId));
  }
}
