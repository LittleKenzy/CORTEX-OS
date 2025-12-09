import { trpc } from '../lib/trpc/client';
import { useTaskStore } from '../lib/stores/use-task-store';
import { useSyncStore } from '../lib/stores/use-sync-store';
import { indexedDB } from '../lib/offline/indexed-db';
import { TaskNode } from '@cortex/shared/types';

export function useOptimisticTask() {
  const { optimisticallyAddTask, optimisticallyUpdateTask, optimisticallyDeleteTask } = useTaskStore();
  const { isOnline, incrementPendingChanges } = useSyncStore();
  
  const createTask = async (input: {
    title: string;
    description?: string;
    parentId?: string;
    dueDate?: Date;
    estimatedMinutes?: number;
  }) => {
    const tempId = `temp_${crypto.randomUUID()}`;
    
    // Optimistic update
    const optimisticTask: TaskNode = {
      id: tempId,
      title: input.title,
      status: 'TODO',
      priority: 0,
      dueDate: input.dueDate || null,
      estimatedMinutes: input.estimatedMinutes || null,
      completionRate: 0,
      children: [],
      parentId: input.parentId || null,
      position: 0,
    };

    optimisticallyAddTask(optimisticTask);

    // Store in IndexedDB for sync
    await indexedDB.put('tasks', {
      id: tempId,
      title: input.title,
      description: input.description || null,
      status: 'TODO',
      priority: 0,
      parentId: input.parentId || null,
      dueDate: input.dueDate ? input.dueDate.getTime() : null,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    });

    // Add to sync queue
    await indexedDB.addToSyncQueue({
      entity: 'task',
      entityId: tempId,
      operation: 'create',
      payload: input,
      timestamp: Date.now(),
      retries: 0,
    });

    incrementPendingChanges();

    // If online, sync immediately
    if (isOnline) {
      try {
        const result = await trpc.tasks.create.mutate(input);
        
        // Update with real ID
        optimisticallyDeleteTask(tempId);
        optimisticallyAddTask({
          ...optimisticTask,
          id: result.id,
        });
        
        await indexedDB.delete('tasks', tempId);
        await indexedDB.put('tasks', {
          id: result.id,
          title: result.title,
          description: result.description || null,
          status: result.status,
          priority: result.priority,
          parentId: result.parentId || null,
          dueDate: result.dueDate ? new Date(result.dueDate).getTime() : null,
          updatedAt: Date.now(),
          syncStatus: 'synced',
        });
      } catch (error) {
        console.error('Failed to create task online:', error);
        // Keep optimistic update and let background sync handle it
      }
    }

    return optimisticTask;
  };

  const updateTask = async (taskId: string, updates: {
    title?: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
    dueDate?: Date | null;
  }) => {
    // Optimistic update
    optimisticallyUpdateTask(taskId, updates as Partial<TaskNode>);

    // Store in IndexedDB
    const existingTask = await indexedDB.get('tasks', taskId);
    if (existingTask) {
      await indexedDB.put('tasks', {
        ...existingTask,
        ...updates,
        dueDate: updates.dueDate ? updates.dueDate.getTime() : existingTask.dueDate,
        updatedAt: Date.now(),
        syncStatus: 'pending',
      });
    }

    // Add to sync queue
    await indexedDB.addToSyncQueue({
      entity: 'task',
      entityId: taskId,
      operation: 'update',
      payload: updates,
      timestamp: Date.now(),
      retries: 0,
    });

    incrementPendingChanges();

    // If online, sync immediately
    if (isOnline) {
      try {
        await trpc.tasks.update.mutate({ id: taskId, ...updates });
        
        if (existingTask) {
          await indexedDB.put('tasks', {
            ...existingTask,
            ...updates,
            syncStatus: 'synced',
          });
        }
      } catch (error) {
        console.error('Failed to update task online:', error);
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    // Optimistic update
    optimisticallyDeleteTask(taskId);

    // Add to sync queue before deleting from IndexedDB
    await indexedDB.addToSyncQueue({
      entity: 'task',
      entityId: taskId,
      operation: 'delete',
      payload: {},
      timestamp: Date.now(),
      retries: 0,
    });

    incrementPendingChanges();

    // If online, sync immediately
    if (isOnline) {
      try {
        await trpc.tasks.delete.mutate({ id: taskId });
        await indexedDB.delete('tasks', taskId);
      } catch (error) {
        console.error('Failed to delete task online:', error);
      }
    }
  };

  return {
    createTask,
    updateTask,
    deleteTask,
  };
}