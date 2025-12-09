import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { DecisionService } from '../services/decisions/decision.service';
import { BiasAnalyzer } from '../services/decisions/bias-analyzer';

const decisionOptionSchema = z.object({
  id: z.string(),
  description: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  estimatedOutcome: z.string(),
});

export const decisionsRouter = router({
  // Create decision
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      context: z.string(),
      options: z.array(decisionOptionSchema),
      chosenOption: z.string(),
      reasoning: z.string(),
      expectedOutcome: z.string().optional(),
      emotionalState: z.string().optional(),
      cognitiveLoad: z.number().int().min(1).max(10).optional(),
      confidenceLevel: z.number().int().min(1).max(10).optional(),
      reviewDate: z.date().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new DecisionService(ctx.db, ctx.userId);
      return service.createDecision(input);
    }),

  // Update outcome
  updateOutcome: protectedProcedure
    .input(z.object({
      id: z.string(),
      actualOutcome: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new DecisionService(ctx.db, ctx.userId);
      return service.updateOutcome(input.id, input.actualOutcome);
    }),

  // Analyze decision for biases
  analyzeBiases: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const analyzer = new BiasAnalyzer(ctx.db);
      return analyzer.analyzeDecision(input.id);
    }),

  // Get bias report for period
  getBiasReport: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const analyzer = new BiasAnalyzer(ctx.db);
      return analyzer.generateReport(ctx.userId, input.startDate, input.endDate);
    }),

  // List decisions
  list: protectedProcedure
    .input(z.object({
      tags: z.array(z.string()).optional(),
      needsReview: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new DecisionService(ctx.db, ctx.userId);
      return service.listDecisions(input);
    }),

  // Get single decision
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new DecisionService(ctx.db, ctx.userId);
      return service.getDecisionWithAnalysis(input.id);
    }),
});