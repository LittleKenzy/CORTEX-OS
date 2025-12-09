import { PrismaClient } from '@prisma/client';
import { CognitiveBias, BiasAnalysisReport } from '@cortex/shared/types';
export declare class BiasAnalyzer {
    private db;
    constructor(db: PrismaClient);
    analyzeDecision(decisionId: string): Promise<CognitiveBias[]>;
    private detectConfirmationBias;
    private detectOptimismBias;
    private detectAnchoring;
    private detectSunkCost;
    generateReport(userId: string, startDate: Date, endDate: Date): Promise<BiasAnalysisReport>;
    private calculateOutcomeSimilarity;
    private generateRecommendations;
}
//# sourceMappingURL=bias-analyzer.d.ts.map