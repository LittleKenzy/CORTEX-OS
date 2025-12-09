import { create } from 'zustand';
import { SyncState } from '@cortex/shared/types';
import { syncEngine } from '../offline/sync-engine';

interface SyncStore extends SyncState {
  setOnlineStatus: (isOnline: boolean) => void;
  startSync: () => Promise<void>;
  updateSyncState: (state: Partial<SyncState>) => void;
  incrementPendingChanges: () => void;
  decrementPendingChanges: () => void;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingChanges: 0,
  lastSyncAt: null,
  failedItems: 0,

  setOnlineStatus: (isOnline) => {
    set({ isOnline });
    if (isOnline && !get().isSyncing) {
      get().startSync();
    }
  },

  startSync: async () => {
    const { isSyncing, isOnline } = get();
    if (isSyncing || !isOnline) return;

    set({ isSyncing: true });

    try {
      const result = await syncEngine.sync();
      set({
        isSyncing: false,
        lastSyncAt: new Date(),
        pendingChanges: 0,
        failedItems: result.failed,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      set({ isSyncing: false });
    }
  },

  updateSyncState: (state) => set(state),

  incrementPendingChanges: () => set((s) => ({ pendingChanges: s.pendingChanges + 1 })),
  
  decrementPendingChanges: () => set((s) => ({ 
    pendingChanges: Math.max(0, s.pendingChanges - 1) 
  })),
}));