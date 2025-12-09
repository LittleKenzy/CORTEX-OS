import Database from "better-sqlite3";
export declare class DecisionService {
    private db;
    constructor(db: Database.Database);
    createDecision(input: any): Promise<any>;
    updateDecision(id: string, input: any): Promise<any>;
    getDecision(id: string): Promise<{
        id: string;
    }>;
    getDecisions(): Promise<never[]>;
    analyzeBiases(decisionId: string): Promise<BiasAnalysisReport>;
    getBiasHistory(decisionId: string): Promise<never[]>;
}
//# sourceMappingURL=decision.service.d.ts.map