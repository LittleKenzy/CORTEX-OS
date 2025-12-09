import { PrismaClient } from '@prisma/client';
import { StreakData } from '@cortex/shared/types';
export declare class StreakCalculator {
    private db;
    private userId;
    constructor(db: PrismaClient, userId: string);
    calculateStreak(habitId: string): Promise<StreakData>;
    updateHabitStreaks(habitId: string): Promise<void>;
    private normalizeDate;
    private isSameDay;
    private isPreviousDay;
    private isNextDay;
}
//# sourceMappingURL=streak-calculator.d.ts.map