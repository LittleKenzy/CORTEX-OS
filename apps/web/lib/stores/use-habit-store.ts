import { create } from 'zustand';
import { HabitWithStats, HabitHeatmapCell } from '@cortex/shared/types';

interface HabitStore {
  habits: HabitWithStats[];
  selectedHabitId: string | null;
  heatmapData: Map<string, HabitHeatmapCell[]>;
  dateRange: {
    start: Date;
    end: Date;
  };
  isLoading: boolean;

  // Actions
  setHabits: (habits: HabitWithStats[]) => void;
  selectHabit: (habitId: string | null) => void;
  setHeatmapData: (habitId: string, data: HabitHeatmapCell[]) => void;
  setDateRange: (start: Date, end: Date) => void;
  setLoading: (isLoading: boolean) => void;

  // Optimistic updates
  optimisticallyLogEntry: (habitId: string, date: Date, completed: boolean) => void;
  optimisticallyUpdateStreak: (habitId: string, streakDelta: number) => void;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  selectedHabitId: null,
  heatmapData: new Map(),
  dateRange: {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    end: new Date(),
  },
  isLoading: false,

  setHabits: (habits) => set({ habits }),

  selectHabit: (habitId) => set({ selectedHabitId: habitId }),

  setHeatmapData: (habitId, data) => {
    set((state) => {
      const newMap = new Map(state.heatmapData);
      newMap.set(habitId, data);
      return { heatmapData: newMap };
    });
  },

  setDateRange: (start, end) => set({ dateRange: { start, end } }),

  setLoading: (isLoading) => set({ isLoading }),

  optimisticallyLogEntry: (habitId, date, completed) => {
    set((state) => ({
      habits: state.habits.map((habit) => {
        if (habit.id === habitId) {
          return {
            ...habit,
            stats: {
              ...habit.stats,
              totalCompletions: habit.stats.totalCompletions + (completed ? 1 : 0),
            },
          };
        }
        return habit;
      }),
    }));

    // Update heatmap data
    const heatmap = get().heatmapData.get(habitId);
    if (heatmap) {
      const updatedHeatmap = heatmap.map((cell) => {
        if (cell.date.getTime() === date.getTime()) {
          return {
            ...cell,
            completed,
            count: completed ? cell.count + 1 : cell.count,
            level: completed ? Math.min(4, cell.level + 1) as 0 | 1 | 2 | 3 | 4 : 0,
          };
        }
        return cell;
      });
      get().setHeatmapData(habitId, updatedHeatmap);
    }
  },

  optimisticallyUpdateStreak: (habitId, streakDelta) => {
    set((state) => ({
      habits: state.habits.map((habit) => {
        if (habit.id === habitId) {
          const newCurrent = habit.streak.current + streakDelta;
          return {
            ...habit,
            streak: {
              ...habit.streak,
              current: Math.max(0, newCurrent),
              longest: Math.max(habit.streak.longest, newCurrent),
            },
          };
        }
        return habit;
      }),
    }));
  },
}));