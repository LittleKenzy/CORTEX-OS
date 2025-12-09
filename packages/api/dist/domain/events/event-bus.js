"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvents = exports.eventBus = void 0;
class EventBus {
    handlers = new Map();
    subscribe(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event).push(handler);
    }
    async publish(event, data) {
        const handlers = this.handlers.get(event) || [];
        await Promise.all(handlers.map((handler) => handler(data)));
    }
}
exports.eventBus = new EventBus();
// packages/api/src/domain/events/domain-events.ts
exports.DomainEvents = {
    TASK_COMPLETED: 'task.completed',
    HABIT_STREAK_BROKEN: 'habit.streak_broken',
    HABIT_MILESTONE: 'habit.milestone',
    NOTE_CREATED: 'note.created',
    DECISION_REVIEWED: 'decision.reviewed',
};
// Usage in service:
// eventBus.publish(DomainEvents.TASK_COMPLETED, { taskId, userId });
//# sourceMappingURL=event-bus.js.map