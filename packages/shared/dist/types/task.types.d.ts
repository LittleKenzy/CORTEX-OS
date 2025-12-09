export interface PriorityFactors {
    urgency: number;
    importance: number;
    effort: number;
    dependencies: number;
    age: number;
}
export interface PriorityScore {
    total: number;
    factors: PriorityFactors;
    computed: Date;
}
export interface TaskNode {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
    priority: number;
    dueDate: Date | null;
    estimatedMinutes: number | null;
    completionRate: number;
    children: TaskNode[];
    parentId: string | null;
    position: number;
}
export interface TaskTreeView {
    roots: TaskNode[];
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
}
export interface TaskRescheduleSuggestion {
    taskId: string;
    currentDate: Date | null;
    suggestedDate: Date;
    reason: 'overdue' | 'dependency_shift' | 'workload_balance';
    confidence: number;
}
//# sourceMappingURL=task.types.d.ts.map