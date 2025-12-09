"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiasAnalyzer = void 0;
class BiasAnalyzer {
    db;
    constructor(db) {
        this.db = db;
    }
    async analyzeDecision(decisionId) {
        const decision = await this.db.decision.findUnique({
            where: { id: decisionId },
        });
        if (!decision)
            throw new Error('Decision not found');
        const biases = [];
        // Detect confirmation bias
        const confirmationBias = this.detectConfirmationBias(decision);
        if (confirmationBias)
            biases.push(confirmationBias);
        // Detect optimism bias
        const optimismBias = this.detectOptimismBias(decision);
        if (optimismBias)
            biases.push(optimismBias);
        // Detect anchoring
        const anchoringBias = this.detectAnchoring(decision);
        if (anchoringBias)
            biases.push(anchoringBias);
        // Detect sunk cost fallacy
        const sunkCostBias = this.detectSunkCost(decision);
        if (sunkCostBias)
            biases.push(sunkCostBias);
        return biases;
    }
    detectConfirmationBias(decision) {
        const reasoning = decision.reasoning.toLowerCase();
        const indicators = [];
        // Check for one-sided reasoning
        const prosCount = (reasoning.match(/pro|benefit|advantage|positive/g) || []).length;
        const consCount = (reasoning.match(/con|drawback|disadvantage|negative|risk/g) || []).length;
        if (prosCount > consCount * 3) {
            indicators.push('Reasoning heavily focuses on positive aspects');
        }
        // Check for dismissive language about alternatives
        if (reasoning.includes('obviously') || reasoning.includes('clearly')) {
            indicators.push('Uses absolutist language dismissing alternatives');
        }
        if (indicators.length === 0)
            return null;
        return {
            type: 'confirmation_bias',
            confidence: Math.min(indicators.length * 0.3, 0.85),
            indicators,
        };
    }
    detectOptimismBias(decision) {
        if (!decision.expectedOutcome)
            return null;
        const outcome = decision.expectedOutcome.toLowerCase();
        const indicators = [];
        // Check for overly positive language
        if (outcome.match(/perfect|ideal|best|excellent|amazing/)) {
            indicators.push('Uses extremely positive language in expected outcome');
        }
        // Check for absence of risk consideration
        if (!outcome.match(/risk|challenge|problem|difficulty|issue/)) {
            indicators.push('No risk factors mentioned in expected outcome');
        }
        // High confidence with little evidence
        if (decision.confidenceLevel >= 8 && decision.cognitiveLoad <= 3) {
            indicators.push('High confidence despite low cognitive effort');
        }
        if (indicators.length < 2)
            return null;
        return {
            type: 'optimism_bias',
            confidence: Math.min(indicators.length * 0.25, 0.8),
            indicators,
        };
    }
    detectAnchoring(decision) {
        const context = decision.context.toLowerCase();
        const reasoning = decision.reasoning.toLowerCase();
        const indicators = [];
        // Check for references to initial information
        if (reasoning.match(/first|initial|originally|started with/)) {
            indicators.push('Heavy reliance on initial information');
        }
        // Check for numerical anchoring
        const numbers = context.match(/\$[\d,]+|\d+%/g);
        if (numbers && numbers.length > 0) {
            const reasoningNumbers = reasoning.match(/\$[\d,]+|\d+%/g);
            if (reasoningNumbers && reasoningNumbers.includes(numbers[0])) {
                indicators.push('Decision anchored to initial numerical value');
            }
        }
        if (indicators.length === 0)
            return null;
        return {
            type: 'anchoring',
            confidence: 0.6,
            indicators,
        };
    }
    detectSunkCost(decision) {
        const context = decision.context.toLowerCase();
        const reasoning = decision.reasoning.toLowerCase();
        const indicators = [];
        // Check for past investment mentions
        if (reasoning.match(/already invested|spent so much|come this far|waste/)) {
            indicators.push('References to past investments driving decision');
        }
        // Check for emotional attachment language
        if (reasoning.match(/can't give up|too late to stop|committed/)) {
            indicators.push('Emotional attachment to prior commitment');
        }
        if (indicators.length === 0)
            return null;
        return {
            type: 'sunk_cost',
            confidence: Math.min(indicators.length * 0.35, 0.9),
            indicators,
        };
    }
    async generateReport(userId, startDate, endDate) {
        const decisions = await this.db.decision.findMany({
            where: {
                userId,
                createdAt: { gte: startDate, lte: endDate },
            },
        });
        const biasFrequency = new Map();
        let totalWithOutcome = 0;
        let accurateOutcomes = 0;
        let totalConfidence = 0;
        for (const decision of decisions) {
            const biases = await this.analyzeDecision(decision.id);
            for (const bias of biases) {
                biasFrequency.set(bias.type, (biasFrequency.get(bias.type) || 0) + 1);
            }
            if (decision.actualOutcome) {
                totalWithOutcome++;
                // Simple text similarity check (in production, use better NLP)
                const similarity = this.calculateOutcomeSimilarity(decision.expectedOutcome || '', decision.actualOutcome);
                if (similarity > 0.7)
                    accurateOutcomes++;
            }
            if (decision.confidenceLevel) {
                totalConfidence += decision.confidenceLevel;
            }
        }
        const mostCommonBiases = Array.from(biasFrequency.entries())
            .map(([type, occurrences]) => ({
            type: type,
            occurrences,
            percentage: (occurrences / decisions.length) * 100,
        }))
            .sort((a, b) => b.occurrences - a.occurrences);
        return {
            userId,
            period: { start: startDate, end: endDate },
            totalDecisions: decisions.length,
            mostCommonBiases,
            accuracyRate: totalWithOutcome > 0 ? (accurateOutcomes / totalWithOutcome) * 100 : 0,
            averageConfidence: decisions.length > 0 ? totalConfidence / decisions.length : 0,
            recommendations: this.generateRecommendations(mostCommonBiases),
        };
    }
    calculateOutcomeSimilarity(expected, actual) {
        // Simplified Jaccard similarity
        const words1 = new Set(expected.toLowerCase().split(/\s+/));
        const words2 = new Set(actual.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
    generateRecommendations(biases) {
        const recommendations = [];
        if (biases.find(b => b.type === 'confirmation_bias')) {
            recommendations.push('Actively seek disconfirming evidence before making decisions');
        }
        if (biases.find(b => b.type === 'optimism_bias')) {
            recommendations.push('List potential risks and worst-case scenarios explicitly');
        }
        if (biases.find(b => b.type === 'sunk_cost')) {
            recommendations.push('Evaluate decisions based on future value, not past investment');
        }
        return recommendations;
    }
}
exports.BiasAnalyzer = BiasAnalyzer;
//# sourceMappingURL=bias-analyzer.js.map