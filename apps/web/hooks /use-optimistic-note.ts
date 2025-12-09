import { trpc } from '../lib/trpc/client';
import { useKnowledgeStore } from '../lib/stores/use-knowledge-store';
import { useSyncStore } from '../lib/stores/use-sync-store';
import { indexedDB } from '../lib/offline/indexed-db';
import { NoteWithRelations } from '@cortex/shared/types';

export function useOptimisticNote() {
  const { optimisticallyAddNote, optimisticallyUpdateNote, optimisticallyDeleteNote } = useKnowledgeStore();
  const { isOnline, incrementPendingChanges } = useSyncStore();

  const createNote = async (input: {
    title: string;
    markdown: string;
    tagIds?: string[];
  }) => {
    const tempId = `temp_${crypto.randomUUID()}`;
    
    const optimisticNote: NoteWithRelations = {
      id: tempId,
      title: input.title,
      content: input.markdown,
      markdown: input.markdown,
      excerpt: input.markdown.slice(0, 200),
      tags: [],
      backlinks: [],
      forwardLinks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
    };

    optimisticallyAddNote(optimisticNote);

    await indexedDB.put('notes', {
      id: tempId,
      title: input.title,
      content: input.markdown,
      markdown: input.markdown,
      tags: [],
      updatedAt: Date.now(),
      syncStatus: 'pending',
    });

    await indexedDB.addToSyncQueue({
      entity: 'note',
      entityId: tempId,
      operation: 'create',
      payload: input,
      timestamp: Date.now(),
      retries: 0,
    });

    incrementPendingChanges();

    if (isOnline) {
      try {
        const result = await trpc.knowledge.create.mutate(input);
        
        optimisticallyDeleteNote(tempId);
        optimisticallyAddNote({
          ...optimisticNote,
          id: result.id,
        });
        
        await indexedDB.delete('notes', tempId);
        await indexedDB.put('notes', {
          id: result.id,
          title: result.title,
          content: result.content,
          markdown: result.markdown,
          tags: result.tags,
          updatedAt: Date.now(),
          syncStatus: 'synced',
        });
      } catch (error) {
        console.error('Failed to create note online:', error);
      }
    }

    return optimisticNote;
  };

  const updateNote = async (noteId: string, updates: {
    title?: string;
    markdown?: string;
    tagIds?: string[];
    isPinned?: boolean;
  }) => {
    optimisticallyUpdateNote(noteId, updates as Partial<NoteWithRelations>);

    const existingNote = await indexedDB.get('notes', noteId);
    if (existingNote) {
      await indexedDB.put('notes', {
        ...existingNote,
        ...updates,
        updatedAt: Date.now(),
        syncStatus: 'pending',
      });
    }

    await indexedDB.addToSyncQueue({
      entity: 'note',
      entityId: noteId,
      operation: 'update',
      payload: updates,
      timestamp: Date.now(),
      retries: 0,
    });

    incrementPendingChanges();

    if (isOnline) {
      try {
        await trpc.knowledge.update.mutate({ id: noteId, ...updates });
        
        if (existingNote) {
          await indexedDB.put('notes', {
            ...existingNote,
            ...updates,
            syncStatus: 'synced',
          });
        }
      } catch (error) {
        console.error('Failed to update note online:', error);
      }
    }
  };

  const deleteNote = async (noteId: string) => {
    optimisticallyDeleteNote(noteId);

    await indexedDB.addToSyncQueue({
      entity: 'note',
      entityId: noteId,
      operation: 'delete',
      payload: {},
      timestamp: Date.now(),
      retries: 0,
    });

    incrementPendingChanges();

    if (isOnline) {
      try {
        await trpc.knowledge.delete.mutate({ id: noteId });
        await indexedDB.delete('notes', noteId);
      } catch (error) {
        console.error('Failed to delete note online:', error);
      }
    }
  };

  return {
    createNote,
    updateNote,
    deleteNote,
  };
}