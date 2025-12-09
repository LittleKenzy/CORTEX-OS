// apps/web/lib/offline/indexed-db.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CortexDB extends DBSchema {
  notes: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      markdown: string;
      tags: Array<{ id: string; name: string }>;
      updatedAt: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-updated': number };
  };
  tasks: {
    key: string;
    value: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: number;
      parentId: string | null;
      dueDate: number | null;
      updatedAt: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-status': string; 'by-updated': number };
  };
  habits: {
    key: string;
    value: {
      id: string;
      name: string;
      frequency: string;
      currentStreak: number;
      updatedAt: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-updated': number };
  };
  habitEntries: {
    key: string;
    value: {
      id: string;
      habitId: string;
      date: number;
      completed: boolean;
      count: number;
      updatedAt: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-habit': string; 'by-date': number };
  };
  decisions: {
    key: string;
    value: {
      id: string;
      title: string;
      context: string;
      chosenOption: string;
      reasoning: string;
      updatedAt: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-updated': number };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      entity: 'note' | 'task' | 'habit' | 'habitEntry' | 'decision';
      entityId: string;
      operation: 'create' | 'update' | 'delete';
      payload: any;
      timestamp: number;
      retries: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

class IndexedDBManager {
  private db: IDBPDatabase<CortexDB> | null = null;
  private readonly DB_NAME = 'cortex-os';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    this.db = await openDB<CortexDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('by-updated', 'updatedAt');
        }

        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
          tasksStore.createIndex('by-status', 'status');
          tasksStore.createIndex('by-updated', 'updatedAt');
        }

        // Habits store
        if (!db.objectStoreNames.contains('habits')) {
          const habitsStore = db.createObjectStore('habits', { keyPath: 'id' });
          habitsStore.createIndex('by-updated', 'updatedAt');
        }

        // Habit entries store
        if (!db.objectStoreNames.contains('habitEntries')) {
          const entriesStore = db.createObjectStore('habitEntries', { keyPath: 'id' });
          entriesStore.createIndex('by-habit', 'habitId');
          entriesStore.createIndex('by-date', 'date');
        }

        // Decisions store
        if (!db.objectStoreNames.contains('decisions')) {
          const decisionsStore = db.createObjectStore('decisions', { keyPath: 'id' });
          decisionsStore.createIndex('by-updated', 'updatedAt');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }

  async getDB(): Promise<IDBPDatabase<CortexDB>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Generic CRUD operations
  async put<T extends keyof CortexDB>(
    storeName: T,
    data: CortexDB[T]['value']
  ): Promise<void> {
    const db = await this.getDB();
    await db.put(storeName, data);
  }

  async get<T extends keyof CortexDB>(
    storeName: T,
    key: string
  ): Promise<CortexDB[T]['value'] | undefined> {
    const db = await this.getDB();
    return db.get(storeName, key);
  }

  async getAll<T extends keyof CortexDB>(
    storeName: T
  ): Promise<CortexDB[T]['value'][]> {
    const db = await this.getDB();
    return db.getAll(storeName);
  }

  async delete<T extends keyof CortexDB>(
    storeName: T,
    key: string
  ): Promise<void> {
    const db = await this.getDB();
    await db.delete(storeName, key);
  }

  async clear<T extends keyof CortexDB>(storeName: T): Promise<void> {
    const db = await this.getDB();
    await db.clear(storeName);
  }

  // Sync queue operations
  async addToSyncQueue(item: Omit<CortexDB['syncQueue']['value'], 'id'>): Promise<void> {
    const db = await this.getDB();
    await db.add('syncQueue', {
      id: crypto.randomUUID(),
      ...item,
    });
  }

  async getSyncQueue(): Promise<CortexDB['syncQueue']['value'][]> {
    const db = await this.getDB();
    const index = db.transaction('syncQueue').store.index('by-timestamp');
    return index.getAll();
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('syncQueue', id);
  }
}

export const indexedDB = new IndexedDBManager();