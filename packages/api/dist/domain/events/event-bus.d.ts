type EventHandler<T = any> = (data: T) => Promise<void> | void;
declare class EventBus {
    private handlers;
    subscribe<T>(event: string, handler: EventHandler<T>): void;
    publish<T>(event: string, data: T): Promise<void>;
}
export declare const eventBus: EventBus;
export declare const DomainEvents: {
    readonly TASK_COMPLETED: "task.completed";
    readonly HABIT_STREAK_BROKEN: "habit.streak_broken";
    readonly HABIT_MILESTONE: "habit.milestone";
    readonly NOTE_CREATED: "note.created";
    readonly DECISION_REVIEWED: "decision.reviewed";
};
export {};
//# sourceMappingURL=event-bus.d.ts.map