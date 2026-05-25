import { getAdapter } from "../driver.js";
import { parseJson, stringifyJson } from "./jsonCol.js";

// Per-scope in-memory cache for getAll() (hot path for model aliases)
const _kvAllCache = new Map();
const _kvAllTs = new Map();
const KV_CACHE_TTL_MS = 5000;

function invalidateKvScope(scope) {
  _kvAllCache.delete(scope);
  _kvAllTs.delete(scope);
}

export function makeKv(scope) {
  return {
    async get(key, fallback = null) {
      const db = await getAdapter();
      const row = db.get(`SELECT value FROM kv WHERE scope = ? AND key = ?`, [scope, key]);
      return row ? parseJson(row.value, fallback) : fallback;
    },
    async getAll() {
      const now = Date.now();
      const ts = _kvAllTs.get(scope) || 0;
      if (_kvAllCache.has(scope) && (now - ts) < KV_CACHE_TTL_MS) {
        return _kvAllCache.get(scope);
      }
      const db = await getAdapter();
      const rows = db.all(`SELECT key, value FROM kv WHERE scope = ?`, [scope]);
      const out = {};
      for (const r of rows) out[r.key] = parseJson(r.value);
      _kvAllCache.set(scope, out);
      _kvAllTs.set(scope, now);
      return out;
    },
    async set(key, value) {
      invalidateKvScope(scope);
      const db = await getAdapter();
      db.run(`INSERT INTO kv(scope, key, value) VALUES(?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`, [scope, key, stringifyJson(value)]);
    },
    async setMany(obj) {
      invalidateKvScope(scope);
      const db = await getAdapter();
      db.transaction(() => {
        for (const [k, v] of Object.entries(obj)) {
          db.run(`INSERT INTO kv(scope, key, value) VALUES(?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`, [scope, k, stringifyJson(v)]);
        }
      });
    },
    async remove(key) {
      invalidateKvScope(scope);
      const db = await getAdapter();
      db.run(`DELETE FROM kv WHERE scope = ? AND key = ?`, [scope, key]);
    },
    async clear() {
      invalidateKvScope(scope);
      const db = await getAdapter();
      db.run(`DELETE FROM kv WHERE scope = ?`, [scope]);
    },
  };
}
