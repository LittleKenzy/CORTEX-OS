import { PrismaClient } from '@prisma/client';
import { FailurePattern } from '@cortex/shared/types';
export declare class PatternDetector {
    private db;
    private userId;
    constructor(db: PrismaClient, userId: string);
    analyzeHabit(habitId: string): Promise<FailurePattern[]>;
    private detectDayOfWeekPattern;
    private detectAfterSuccessPattern;
    private detectAfterFailurePattern;
}
//# sourceMappingURL=pattern-detector.d.ts.map