mport { indexedDB } from './indexed-db';
import { trpc } from '../trpc/client';

type SyncEntity = 'note' | 'task' | 'habit' | 'habitEntry' | 'decision';
type SyncOperation = 'create' | 'update' | 'delete';

interface SyncResult {
  success: number;
  failed: number;
  conflicts: number;
}

export class SyncEngine {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  async startAutoSync(intervalMs: number = 30000): Promise<void> {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
      }
    }, intervalMs);

    // Also sync immediately if online
    if (navigator.onLine) {
      await this.sync();
    }
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;

    try {
      const result: SyncResult = { success: 0, failed: 0, conflicts: 0 };
      const queue = await indexedDB.getSyncQueue();

      console.log(`Syncing ${queue.length} items...`);

      for (const item of queue) {
        try {
          await this.syncItem(item);
          await indexedDB.removeSyncQueueItem(item.id);
          result.success++;
        } catch (error) {
          console.error(`Failed to sync ${item.entity} ${item.entityId}:`, error);
          
          // Increment retry count
          if (item.retries < 3) {
            await indexedDB.put('syncQueue', {
              ...item,
              retries: item.retries + 1,
            });
          } else {
            // Max retries reached, mark as failed
            result.failed++;
            await indexedDB.removeSyncQueueItem(item.id);
          }
        }
      }

      console.log('Sync complete:', result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncItem(item: any): Promise<void> {
    const { entity, entityId, operation, payload } = item;

    switch (entity) {
      case 'note':
        await this.syncNote(entityId, operation, payload);
        break;
      case 'task':
        await this.syncTask(entityId, operation, payload);
        break;
      case 'habit':
        await this.syncHabit(entityId, operation, payload);
        break;
      case 'habitEntry':
        await this.syncHabitEntry(entityId, operation, payload);
        break;
      case 'decision':
        await this.syncDecision(entityId, operation, payload);
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  private async syncNote(id: string, operation: string, payload: any): Promise<void> {
    const client = trpc.knowledge;

    switch (operation) {
      case 'create':
        await client.create.mutate(payload);
        break;
      case 'update':
        await client.update.mutate({ id, ...payload });
        break;
      case 'delete':
        await client.delete.mutate({ id });
        break;
    }

    // Update local sync status
    const localNote = await indexedDB.get('notes', id);
    if (localNote && operation !== 'delete') {
      await indexedDB.put('notes', {
        ...localNote,
        syncStatus: 'synced',
      });
    } else if (operation === 'delete') {
      await indexedDB.delete('notes', id);
    }
  }

  private async syncTask(id: string, operation: string, payload: any): Promise<void> {
    const client = trpc.tasks;

    switch (operation) {
      case 'create':
        await client.create.mutate(payload);
        break;
      case 'update':
        await client.update.mutate({ id, ...payload });
        break;
      case 'delete':
        await client.delete.mutate({ id });
        break;
    }

    const localTask = await indexedDB.get('tasks', id);
    if (localTask && operation !== 'delete') {
      await indexedDB.put('tasks', {
        ...localTask,
        syncStatus: 'synced',
      });
    } else if (operation === 'delete') {
      await indexedDB.delete('tasks', id);
    }
  }

  private async syncHabit(id: string, operation: string, payload: any): Promise<void> {
    const client = trpc.habits;

    switch (operation) {
      case 'create':
        await client.create.mutate(payload);
        break;
      case 'update':
        // Habit updates would be handled here
        break;
      case 'delete':
        await client.archive.mutate({ id });
        break;
    }

    const localHabit = await indexedDB.get('habits', id);
    if (localHabit && operation !== 'delete') {
      await indexedDB.put('habits', {
        ...localHabit,
        syncStatus: 'synced',
      });
    } else if (operation === 'delete') {
      await indexedDB.delete('habits', id);
    }
  }

  private async syncHabitEntry(id: string, operation: string, payload: any): Promise<void> {
    const client = trpc.habits;

    if (operation === 'create') {
      await client.logEntry.mutate(payload);
    }

    const localEntry = await indexedDB.get('habitEntries', id);
    if (localEntry) {
      await indexedDB.put('habitEntries', {
        ...localEntry,
        syncStatus: 'synced',
      });
    }
  }

  private async syncDecision(id: string, operation: string, payload: any): Promise<void> {
    const client = trpc.decisions;

    switch (operation) {
      case 'create':
        await client.create.mutate(payload);
        break;
      case 'update':
        if (payload.actualOutcome) {
          await client.updateOutcome.mutate({ id, actualOutcome: payload.actualOutcome });
        }
        break;
      case 'delete':
        // Decisions typically aren't deleted
        break;
    }

    const localDecision = await indexedDB.get('decisions', id);
    if (localDecision && operation !== 'delete') {
      await indexedDB.put('decisions', {
        ...localDecision,
        syncStatus: 'synced',
      });
    }
  }

  async pullLatestData(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      // Pull notes
      const notes = await trpc.knowledge.list.query({ limit: 100 });
      for (const note of notes.items || []) {
        await indexedDB.put('notes', {
          id: note.id,
          title: note.title,
          content: note.content,
          markdown: note.markdown,
          tags: note.tags,
          updatedAt: new Date(note.updatedAt).getTime(),
          syncStatus: 'synced',
        });
      }

      // Pull tasks
      const taskTree = await trpc.tasks.getTree.query({});
      const flattenTasks = (nodes: any[]): any[] => {
        return nodes.flatMap(node => [node, ...flattenTasks(node.children || [])]);
      };
      const allTasks = flattenTasks(taskTree.roots || []);
      
      for (const task of allTasks) {
        await indexedDB.put('tasks', {
          id: task.id,
          title: task.title,
          description: task.description || null,
          status: task.status,
          priority: task.priority,
          parentId: task.parentId,
          dueDate: task.dueDate ? new Date(task.dueDate).getTime() : null,
          updatedAt: Date.now(),
          syncStatus: 'synced',
        });
      }

      console.log('Latest data pulled successfully');
    } catch (error) {
      console.error('Failed to pull latest data:', error);
    }
  }
}

export const syncEngine = new SyncEngine();