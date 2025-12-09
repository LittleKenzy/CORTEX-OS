export interface SyncQueueItem {
    id: string;
    entity: 'NOTE' | 'TASK' | 'HABIT' | 'HABIT_ENTRY' | 'DECISION';
    entityId: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    payload: unknown;
    retryCount: number;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: Date;
}
export interface SyncState {
    isOnline: boolean;
    isSyncing: boolean;
    pendingChanges: number;
    lastSyncAt: Date | null;
    failedItems: number;
}
export interface OptimisticUpdate<T> {
    tempId: string;
    data: T;
    operation: 'create' | 'update' | 'delete';
    timestamp: Date;
    synced: boolean;
}
//# sourceMappingURL=sync.types.d.ts.map