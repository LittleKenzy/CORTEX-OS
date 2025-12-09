
export interface PriorityFactors {
  urgency: number;        // 0-1 (based on due date)
  importance: number;     // 0-1 (user set or derived)
  effort: number;         // 0-1 (inverse of estimated time)
  dependencies: number;   // 0-1 (blocking other tasks)
  age: number;           // 0-1 (time since creation)
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
  completionRate: number; // For parent tasks: % of children completed
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
