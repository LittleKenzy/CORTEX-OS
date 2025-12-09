
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { HabitService } from '../services/habits/habit.service';
import { StreakCalculator } from '../services/habits/streak-calculator';
import { PatternDetector } from '../services/habits/pattern-detector';

export const habitsRouter = router({
  // Create habit
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']),
      targetCount: z.number().int().positive().default(1),
      reminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new HabitService(ctx.db, ctx.userId);
      return service.createHabit(input);
    }),

  // Log habit completion
  logEntry: protectedProcedure
    .input(z.object({
      habitId: z.string(),
      date: z.date(),
      completed: z.boolean().default(true),
      count: z.number().int().positive().default(1),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new HabitService(ctx.db, ctx.userId);
      return service.logEntry(input);
    }),

  // Get habit with stats
  getWithStats: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      daysBack: z.number().int().positive().default(90),
    }))
    .query(async ({ ctx, input }) => {
      const service = new HabitService(ctx.db, ctx.userId);
      return service.getHabitWithStats(input.id, input.daysBack);
    }),

  // Get heatmap data
  getHeatmap: protectedProcedure
    .input(z.object({
      habitId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new HabitService(ctx.db, ctx.userId);
      return service.getHeatmapData(input.habitId, input.startDate, input.endDate);
    }),

  // Detect failure patterns
  detectPatterns: protectedProcedure
    .input(z.object({ habitId: z.string() }))
    .query(async ({ ctx, input }) => {
      const detector = new PatternDetector(ctx.db, ctx.userId);
      return detector.analyzeHabit(input.habitId);
    }),

  // List all habits
  list: protectedProcedure
    .input(z.object({
      includeArchived: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const service = new HabitService(ctx.db, ctx.userId);
      return service.listHabits(input.includeArchived);
    }),

  // Archive habit
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new HabitService(ctx.db, ctx.userId);
      return service.archiveHabit(input.id);
    }),
});