type EventHandler<T = any> = (data: T) => Promise<void> | void;

class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  subscribe<T>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  async publish<T>(event: string, data: T): Promise<void> {
    const handlers = this.handlers.get(event) || [];
    await Promise.all(handlers.map((handler) => handler(data)));
  }
}

export const eventBus = new EventBus();

// packages/api/src/domain/events/domain-events.ts

export const DomainEvents = {
  TASK_COMPLETED: 'task.completed',
  HABIT_STREAK_BROKEN: 'habit.streak_broken',
  HABIT_MILESTONE: 'habit.milestone',
  NOTE_CREATED: 'note.created',
  DECISION_REVIEWED: 'decision.reviewed',
} as const;

// Usage in service:
// eventBus.publish(DomainEvents.TASK_COMPLETED, { taskId, userId });