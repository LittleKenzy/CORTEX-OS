export interface DecisionOption {
    id: string;
    description: string;
    pros: string[];
    cons: string[];
    estimatedOutcome: string;
}
export interface CognitiveBias {
    type: 'confirmation_bias' | 'anchoring' | 'sunk_cost' | 'availability_heuristic' | 'optimism_bias' | 'loss_aversion' | 'groupthink';
    confidence: number;
    indicators: string[];
}
export interface DecisionOutcome {
    expected: string;
    actual: string | null;
    variance: 'better' | 'as_expected' | 'worse' | null;
    reviewedAt: Date | null;
}
export interface DecisionWithAnalysis {
    id: string;
    title: string;
    context: string;
    options: DecisionOption[];
    chosenOption: string;
    reasoning: string;
    outcome: DecisionOutcome;
    biases: CognitiveBias[];
    emotionalState: string | null;
    cognitiveLoad: number | null;
    confidenceLevel: number | null;
    tags: string[];
    createdAt: Date;
    reviewDate: Date | null;
}
export interface BiasAnalysisReport {
    userId: string;
    period: {
        start: Date;
        end: Date;
    };
    totalDecisions: number;
    mostCommonBiases: Array<{
        type: CognitiveBias['type'];
        occurrences: number;
        percentage: number;
    }>;
    accuracyRate: number;
    averageConfidence: number;
    recommendations: string[];
}
//# sourceMappingURL=decision.types.d.ts.map