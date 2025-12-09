import { PrismaClient } from '@prisma/client';
import { FailurePattern } from '@cortex/shared/types';

export class PatternDetector {
  constructor(
    private db: PrismaClient,
    private userId: string
  ) {}

  async analyzeHabit(habitId: string): Promise<FailurePattern[]> {
    const entries = await this.db.habitEntry.findMany({
      where: { habitId, userId: this.userId },
      orderBy: { date: 'asc' },
    });

    const habit = await this.db.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit || entries.length < 14) {
      // Need at least 2 weeks of data
      return [];
    }

    const patterns: FailurePattern[] = [];

    // Detect day-of-week patterns
    const dayOfWeekPattern = this.detectDayOfWeekPattern(entries);
    if (dayOfWeekPattern) patterns.push(dayOfWeekPattern);

    // Detect after-success failures
    const afterSuccessPattern = this.detectAfterSuccessPattern(entries);
    if (afterSuccessPattern) patterns.push(afterSuccessPattern);

    // Detect after-failure cascades
    const afterFailurePattern = this.detectAfterFailurePattern(entries);
    if (afterFailurePattern) patterns.push(afterFailurePattern);

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private detectDayOfWeekPattern(entries: any[]): FailurePattern | null {
    const dayStats: Record<number, { total: number; failures: number }> = {};
    
    for (let i = 0; i < 7; i++) {
      dayStats[i] = { total: 0, failures: 0 };
    }

    for (const entry of entries) {
      const dayOfWeek = new Date(entry.date).getDay();
      dayStats[dayOfWeek].total++;
      if (!entry.completed) {
        dayStats[dayOfWeek].failures++;
      }
    }

    // Find worst performing day
    let worstDay = 0;
    let worstRate = 0;

    for (const [day, stats] of Object.entries(dayStats)) {
      if (stats.total < 2) continue; // Need minimum data
      const failureRate = stats.failures / stats.total;
      if (failureRate > worstRate) {
        worstRate = failureRate;
        worstDay = parseInt(day);
      }
    }

    if (worstRate < 0.6) return null; // Must fail at least 60% of the time

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      type: 'day_of_week',
      description: `You tend to miss this habit on ${dayNames[worstDay]}s`,
      occurrences: dayStats[worstDay].failures,
      confidence: Math.min(worstRate, 0.95),
    };
  }

  private detectAfterSuccessPattern(entries: any[]): FailurePattern | null {
    let afterSuccessFailures = 0;
    let afterSuccessTotal = 0;

    for (let i = 1; i < entries.length; i++) {
      if (entries[i - 1].completed) {
        afterSuccessTotal++;
        if (!entries[i].completed) {
          afterSuccessFailures++;
        }
      }
    }

    if (afterSuccessTotal < 5) return null;
    
    const failureRate = afterSuccessFailures / afterSuccessTotal;
    if (failureRate < 0.4) return null;

    return {
      type: 'after_success',
      description: 'You often skip this habit right after completing it successfully',
      occurrences: afterSuccessFailures,
      confidence: Math.min(failureRate, 0.9),
    };
  }

  private detectAfterFailurePattern(entries: any[]): FailurePattern | null {
    let cascadeCount = 0;
    let currentFailStreak = 0;

    for (const entry of entries) {
      if (!entry.completed) {
        currentFailStreak++;
        if (currentFailStreak >= 3) {
          cascadeCount++;
        }
      } else {
        currentFailStreak = 0;
      }
    }

    if (cascadeCount < 2) return null;

    return {
      type: 'after_failure',
      description: 'Missing once tends to lead to multiple consecutive misses',
      occurrences: cascadeCount,
      confidence: Math.min(0.7, cascadeCount / (entries.length / 30)),
    };
  }
}