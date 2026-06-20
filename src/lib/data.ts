// Data-loading layer: fetches the static JSON in /public/data on demand.
// The per-faction files are loaded lazily and cached in-memory so we never
// pull all 24 factions at once.
import type { FactionData, FactionIndexEntry, Rules } from './types';

export interface FactionIndex {
  factions: FactionIndexEntry[];
  last_update: string;
}

let indexCache: FactionIndex | null = null;
let rulesCache: Rules | null = null;
const factionCache = new Map<string, FactionData>();

const BASE = import.meta.env.BASE_URL || '/';

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`.replace(/\/{2,}/g, '/'));
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function loadIndex(): Promise<FactionIndex> {
  if (!indexCache) indexCache = await getJSON<FactionIndex>('data/index.json');
  return indexCache;
}

export async function loadRules(): Promise<Rules> {
  if (!rulesCache) rulesCache = await getJSON<Rules>('data/rules.json');
  return rulesCache;
}

export async function loadFaction(slug: string): Promise<FactionData> {
  const hit = factionCache.get(slug);
  if (hit) return hit;
  const data = await getJSON<FactionData>(`data/factions/${slug}.json`);
  factionCache.set(slug, data);
  return data;
}

export async function findFactionEntry(
  factionId: string,
): Promise<FactionIndexEntry | undefined> {
  const idx = await loadIndex();
  return idx.factions.find((f) => f.id === factionId);
}

/** Load a faction's full data by its faction id (resolves slug via index). */
export async function loadFactionById(
  factionId: string,
): Promise<FactionData | undefined> {
  const entry = await findFactionEntry(factionId);
  if (!entry) return undefined;
  return loadFaction(entry.slug);
}
