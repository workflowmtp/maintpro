// ============================================================
// MaintPro v3+ — Store (API-backed with local cache)
// ============================================================

import { STORAGE_PREFIX } from './config';

// Collections stored in PostgreSQL via API
const DB_COLLECTIONS = new Set([
  'users', 'poles', 'ateliers', 'techniciens', 'operateurs', 'chefs_atelier',
  'machines', 'organes', 'causes', 'pieces', 'interventions', 'actions',
  'stock_movements', 'demandes_achat', 'sous_traitances', 'taches_preventives',
  'signalements',
]);

// In-memory cache populated by DataProvider
const _cache: Record<string, any[]> = {};
// Single-object cache for non-array DB data (company_info, etc.)
const _singleCache: Record<string, any> = {};

const SINGLE_KEYS = new Set(['company_info']);

// Called by DataProvider to sync cache
export function _setCache(collection: string, items: any[]): void {
  _cache[collection] = items;
}

export function _setSingle(key: string, value: any): void {
  _singleCache[key] = value;
}

export function _getCache(): Record<string, any[]> {
  return _cache;
}

function _key(name: string): string {
  return STORAGE_PREFIX + name;
}

export function get<T = any>(name: string): T | null {
  // Single-object DB keys
  if (SINGLE_KEYS.has(name)) {
    return (_singleCache[name] as T) || null;
  }
  // For DB collections, return from cache
  if (DB_COLLECTIONS.has(name)) {
    return (_cache[name] as unknown as T) || null;
  }
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(_key(name));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function set(name: string, data: any): void {
  // Single-object DB keys
  if (SINGLE_KEYS.has(name)) {
    _singleCache[name] = data;
    // Persist to API
    fetch('/api/data/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'default', ...data }),
    }).catch((err) => console.error('Store.set API error:', err));
    return;
  }
  // For DB collections, update cache (API write happens via upsert)
  if (DB_COLLECTIONS.has(name)) {
    _cache[name] = data;
    return;
  }
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(_key(name), JSON.stringify(data));
  } catch (e) {
    console.error('Store.set error:', e);
  }
}

export function remove(name: string): void {
  if (DB_COLLECTIONS.has(name)) {
    delete _cache[name];
    return;
  }
  if (typeof window === 'undefined') return;
  localStorage.removeItem(_key(name));
}

export function getAll<T = any>(collection: string): T[] {
  if (DB_COLLECTIONS.has(collection)) {
    return (_cache[collection] || []) as T[];
  }
  return get<T[]>(collection) || [];
}

export function findById<T extends { id: string }>(collection: string, id: string): T | null {
  const items = getAll<T>(collection);
  return items.find((item) => item.id === id) || null;
}

export function upsert<T extends { id: string }>(collection: string, item: T): T {
  const items = getAll<T>(collection);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx !== -1) {
    items[idx] = item;
  } else {
    items.push(item);
  }

  if (DB_COLLECTIONS.has(collection)) {
    _cache[collection] = items;
    // Fire and forget API call
    fetch('/api/data/' + collection, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch((err) => console.error('Store.upsert API error:', err));
  } else {
    set(collection, items);
  }
  return item;
}

export function deleteById(collection: string, id: string): void {
  const items = getAll<{ id: string }>(collection);
  const filtered = items.filter((i) => i.id !== id);

  if (DB_COLLECTIONS.has(collection)) {
    _cache[collection] = filtered;
    fetch('/api/data/' + collection + '?id=' + id, { method: 'DELETE' })
      .catch((err) => console.error('Store.deleteById API error:', err));
  } else {
    set(collection, filtered);
  }
}

export function generateId(prefix: string = 'id'): string {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

export function clearAll(): void {
  // Clear DB cache
  Object.keys(_cache).forEach((k) => delete _cache[k]);
  // Clear localStorage
  if (typeof window === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.indexOf(STORAGE_PREFIX) === 0) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

// Convenience re-export as namespace-like object
const Store = {
  get,
  set,
  remove,
  getAll,
  findById,
  upsert,
  deleteById,
  generateId,
  clearAll,
  _setCache,
  _setSingle,
  _getCache,
};

export default Store;
