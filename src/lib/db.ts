// IndexedDB persistence for saved army lists (via idb).
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ArmyList } from './types';

interface New40kDB extends DBSchema {
  lists: {
    key: string;
    value: ArmyList;
    indexes: { 'by-updated': number };
  };
}

const DB_NAME = 'new40k';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<New40kDB>> | null = null;

function db(): Promise<IDBPDatabase<New40kDB>> {
  if (!dbPromise) {
    dbPromise = openDB<New40kDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const store = database.createObjectStore('lists', { keyPath: 'id' });
        store.createIndex('by-updated', 'updatedAt');
      },
    });
  }
  return dbPromise;
}

export async function getAllLists(): Promise<ArmyList[]> {
  const all = await (await db()).getAll('lists');
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getList(id: string): Promise<ArmyList | undefined> {
  return (await db()).get('lists', id);
}

export async function saveList(list: ArmyList): Promise<void> {
  await (await db()).put('lists', list);
}

export async function deleteList(id: string): Promise<void> {
  await (await db()).delete('lists', id);
}

/** Merge imported lists; existing ids are overwritten by the imported copy. */
export async function importLists(lists: ArmyList[]): Promise<number> {
  const conn = await db();
  const tx = conn.transaction('lists', 'readwrite');
  let n = 0;
  for (const l of lists) {
    if (l && typeof l.id === 'string') {
      await tx.store.put(l);
      n += 1;
    }
  }
  await tx.done;
  return n;
}
