import { create } from 'zustand';
import { TaskNode, TaskTreeView } from '@cortex/shared/types';

interface TaskStore {
  taskTree: TaskTreeView | null;
  selectedTaskId: string | null;
  filter: {
    status: string[];
    showCompleted: boolean;
  };
  isLoading: boolean;
  
  // Actions
  setTaskTree: (tree: TaskTreeView) => void;
  selectTask: (taskId: string | null) => void;
  updateFilter: (filter: Partial<TaskStore['filter']>) => void;
  setLoading: (isLoading: boolean) => void;
  
  // Optimistic updates
  optimisticallyAddTask: (task: TaskNode) => void;
  optimisticallyUpdateTask: (taskId: string, updates: Partial<TaskNode>) => void;
  optimisticallyDeleteTask: (taskId: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  taskTree: null,
  selectedTaskId: null,
  filter: {
    status: ['TODO', 'IN_PROGRESS'],
    showCompleted: false,
  },
  isLoading: false,

  setTaskTree: (tree) => set({ taskTree: tree }),

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  updateFilter: (filter) => set((state) => ({
    filter: { ...state.filter, ...filter },
  })),

  setLoading: (isLoading) => set({ isLoading }),

  optimisticallyAddTask: (task) => {
    const { taskTree } = get();
    if (!taskTree) return;

    if (!task.parentId) {
      // Add to roots
      set({
        taskTree: {
          ...taskTree,
          roots: [...taskTree.roots, task],
          totalTasks: taskTree.totalTasks + 1,
        },
      });
    } else {
      // Add to parent's children
      const addToTree = (nodes: TaskNode[]): TaskNode[] => {
        return nodes.map((node) => {
          if (node.id === task.parentId) {
            return {
              ...node,
              children: [...node.children, task],
            };
          }
          return {
            ...node,
            children: addToTree(node.children),
          };
        });
      };

      set({
        taskTree: {
          ...taskTree,
          roots: addToTree(taskTree.roots),
          totalTasks: taskTree.totalTasks + 1,
        },
      });
    }
  },

  optimisticallyUpdateTask: (taskId, updates) => {
    const { taskTree } = get();
    if (!taskTree) return;

    const updateInTree = (nodes: TaskNode[]): TaskNode[] => {
      return nodes.map((node) => {
        if (node.id === taskId) {
          return { ...node, ...updates };
        }
        return {
          ...node,
          children: updateInTree(node.children),
        };
      });
    };

    set({
      taskTree: {
        ...taskTree,
        roots: updateInTree(taskTree.roots),
        completedTasks: updates.status === 'COMPLETED' 
          ? taskTree.completedTasks + 1 
          : taskTree.completedTasks,
      },
    });
  },

  optimisticallyDeleteTask: (taskId) => {
    const { taskTree } = get();
    if (!taskTree) return;

    const deleteFromTree = (nodes: TaskNode[]): TaskNode[] => {
      return nodes
        .filter((node) => node.id !== taskId)
        .map((node) => ({
          ...node,
          children: deleteFromTree(node.children),
        }));
    };

    set({
      taskTree: {
        ...taskTree,
        roots: deleteFromTree(taskTree.roots),
        totalTasks: taskTree.totalTasks - 1,
      },
    });
  },
}));