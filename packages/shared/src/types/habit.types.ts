export interface StreakData {
  current: number;
  longest: number;
  lastCompletedDate: Date | null;
  isActiveToday: boolean;
}

export interface HabitHeatmapCell {
  date: Date;
  count: number;
  completed: boolean;
  level: 0 | 1 | 2 | 3 | 4; // Intensity for visualization
}

export interface HabitStats {
  totalCompletions: number;
  averagePerWeek: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // % of expected completions
  lastSevenDays: number;
  lastThirtyDays: number;
}

export interface FailurePattern {
  type: 'day_of_week' | 'time_of_day' | 'after_success' | 'after_failure';
  description: string;
  occurrences: number;
  confidence: number;
}

export interface HabitWithStats {
  id: string;
  name: string;
  description: string | null;
  frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  targetCount: number;
  color: string | null;
  stats: HabitStats;
  streak: StreakData;
  failurePatterns: FailurePattern[];
  recentEntries: Array<{
    date: Date;
    completed: boolean;
    count: number;
  }>;
}