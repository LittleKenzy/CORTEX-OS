import { PrismaClient } from '@prisma/client';
import { PriorityScore } from '@cortex/shared/types';
export declare class PriorityScorer {
    private db;
    private userId;
    constructor(db: PrismaClient, userId: string);
    calculatePriority(taskId: string): Promise<PriorityScore>;
    private calculateUrgency;
    private calculateEffort;
    private calculateImportance;
    private calculateDependencies;
    private calculateAge;
    recalculateAllPriorities(): Promise<void>;
}
//# sourceMappingURL=priority-scorer.d.ts.map