"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decisionsRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const decision_service_1 = require("../services/decisions/decision.service");
const bias_analyzer_1 = require("../services/decisions/bias-analyzer");
const decisionOptionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    description: zod_1.z.string(),
    pros: zod_1.z.array(zod_1.z.string()),
    cons: zod_1.z.array(zod_1.z.string()),
    estimatedOutcome: zod_1.z.string(),
});
exports.decisionsRouter = (0, trpc_1.router)({
    // Create decision
    create: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        title: zod_1.z.string().min(1),
        context: zod_1.z.string(),
        options: zod_1.z.array(decisionOptionSchema),
        chosenOption: zod_1.z.string(),
        reasoning: zod_1.z.string(),
        expectedOutcome: zod_1.z.string().optional(),
        emotionalState: zod_1.z.string().optional(),
        cognitiveLoad: zod_1.z.number().int().min(1).max(10).optional(),
        confidenceLevel: zod_1.z.number().int().min(1).max(10).optional(),
        reviewDate: zod_1.z.date().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const service = new decision_service_1.DecisionService(ctx.db, ctx.userId);
        return service.createDecision(input);
    }),
    // Update outcome
    updateOutcome: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        actualOutcome: zod_1.z.string(),
    }))
        .mutation(async ({ ctx, input }) => {
        const service = new decision_service_1.DecisionService(ctx.db, ctx.userId);
        return service.updateOutcome(input.id, input.actualOutcome);
    }),
    // Analyze decision for biases
    analyzeBiases: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .query(async ({ ctx, input }) => {
        const analyzer = new bias_analyzer_1.BiasAnalyzer(ctx.db);
        return analyzer.analyzeDecision(input.id);
    }),
    // Get bias report for period
    getBiasReport: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        startDate: zod_1.z.date(),
        endDate: zod_1.z.date(),
    }))
        .query(async ({ ctx, input }) => {
        const analyzer = new bias_analyzer_1.BiasAnalyzer(ctx.db);
        return analyzer.generateReport(ctx.userId, input.startDate, input.endDate);
    }),
    // List decisions
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        needsReview: zod_1.z.boolean().optional(),
        limit: zod_1.z.number().min(1).max(100).default(50),
        cursor: zod_1.z.string().optional(),
    }))
        .query(async ({ ctx, input }) => {
        const service = new decision_service_1.DecisionService(ctx.db, ctx.userId);
        return service.listDecisions(input);
    }),
    // Get single decision
    getById: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .query(async ({ ctx, input }) => {
        const service = new decision_service_1.DecisionService(ctx.db, ctx.userId);
        return service.getDecisionWithAnalysis(input.id);
    }),
});
//# sourceMappingURL=decisions.router.js.map