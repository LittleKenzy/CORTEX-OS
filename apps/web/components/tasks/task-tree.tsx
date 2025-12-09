'use client';

import { useState } from 'react';
import { TaskNode } from '@cortex/shared/types';
import { ChevronRight, ChevronDown, Circle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptimisticTask } from '@/hooks/use-optimistic-task';

interface TaskTreeProps {
  tasks: TaskNode[];
  level?: number;
}

export function TaskTree({ tasks, level = 0 }: TaskTreeProps) {
  return (
    <div className={cn('space-y-1', level > 0 && 'ml-6 mt-1')}>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} level={level} />
      ))}
    </div>
  );
}

function TaskItem({ task, level }: { task: TaskNode; level: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { updateTask } = useOptimisticTask();

  const hasChildren = task.children.length > 0;
  const isCompleted = task.status === 'COMPLETED';
  const isBlocked = task.status === 'BLOCKED';

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'text-red-600 dark:text-red-400';
    if (priority >= 60) return 'text-orange-600 dark:text-orange-400';
    if (priority >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const handleToggleComplete = async () => {
    await updateTask(task.id, {
      status: isCompleted ? 'TODO' : 'COMPLETED',
    });
  };

  const handleToggleExpand = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
          isCompleted && 'opacity-60'
        )}
      >
        {/* Expand/Collapse */}
        <button
          onClick={handleToggleExpand}
          className={cn(
            'flex-shrink-0 w-4 h-4',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Status Icon */}
        <button
          onClick={handleToggleComplete}
          className="flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : isBlocked ? (
            <AlertCircle className="w-5 h-5 text-red-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-medium truncate',
                isCompleted && 'line-through'
              )}
            >
              {task.title}
            </span>
            
            {/* Priority Badge */}
            {task.priority > 0 && (
              <span
                className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded',
                  getPriorityColor(task.priority)
                )}
              >
                {task.priority}
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            {task.dueDate && (
              <span>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.estimatedMinutes && (
              <span>{task.estimatedMinutes}m</span>
            )}
            {hasChildren && (
              <span>
                {Math.round(task.completionRate)}% complete
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            {/* Add subtask, edit, etc */}
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <TaskTree tasks={task.children} level={level + 1} />
      )}
    </div>
  );
}