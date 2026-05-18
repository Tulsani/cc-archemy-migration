import { createSeedState } from '../data/seed.mjs';

export class MockRepository {
  constructor() {
    this.state = structuredClone(createSeedState());
  }

  snapshot() {
    return structuredClone(this.state);
  }

  reset() {
    this.state = structuredClone(createSeedState());
    return this.snapshot();
  }

  list(collection) {
    return structuredClone(this.state[collection] ?? []);
  }

  replaceCollection(collection, rows) {
    this.state[collection] = structuredClone(rows);
    return this.list(collection);
  }

  upsert(collection, idField, row) {
    const rows = this.state[collection];
    const index = rows.findIndex((item) => String(item[idField]) === String(row[idField]));
    if (index >= 0) rows[index] = { ...rows[index], ...row };
    else rows.push(row);
    return structuredClone(index >= 0 ? rows[index] : row);
  }

  delete(collection, idField, id) {
    const before = this.state[collection].length;
    this.state[collection] = this.state[collection].filter((item) => String(item[idField]) !== String(id));
    return before !== this.state[collection].length;
  }

  nextId(collection, idField = 'id') {
    return Math.max(0, ...this.state[collection].map((item) => Number(item[idField]) || 0)) + 1;
  }
}
