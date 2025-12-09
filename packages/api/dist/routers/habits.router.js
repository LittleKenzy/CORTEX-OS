"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.habitsRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const habit_service_1 = require("../services/habits/habit.service");
const pattern_detector_1 = require("../services/habits/pattern-detector");
exports.habitsRouter = (0, trpc_1.router)({
    // Create habit
    create: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        name: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        frequency: zod_1.z.enum(['DAILY', 'WEEKLY', 'CUSTOM']),
        targetCount: zod_1.z.number().int().positive().default(1),
        reminderTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
        color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const service = new habit_service_1.HabitService(ctx.db, ctx.userId);
        return service.createHabit(input);
    }),
    // Log habit completion
    logEntry: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        habitId: zod_1.z.string(),
        date: zod_1.z.date(),
        completed: zod_1.z.boolean().default(true),
        count: zod_1.z.number().int().positive().default(1),
        notes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const service = new habit_service_1.HabitService(ctx.db, ctx.userId);
        return service.logEntry(input);
    }),
    // Get habit with stats
    getWithStats: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        daysBack: zod_1.z.number().int().positive().default(90),
    }))
        .query(async ({ ctx, input }) => {
        const service = new habit_service_1.HabitService(ctx.db, ctx.userId);
        return service.getHabitWithStats(input.id, input.daysBack);
    }),
    // Get heatmap data
    getHeatmap: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        habitId: zod_1.z.string(),
        startDate: zod_1.z.date(),
        endDate: zod_1.z.date(),
    }))
        .query(async ({ ctx, input }) => {
        const service = new habit_service_1.HabitService(ctx.db, ctx.userId);
        return service.getHeatmapData(input.habitId, input.startDate, input.endDate);
    }),
    // Detect failure patterns
    detectPatterns: trpc_1.protectedProcedure
        .input(zod_1.z.object({ habitId: zod_1.z.string() }))
        .query(async ({ ctx, input }) => {
        const detector = new pattern_detector_1.PatternDetector(ctx.db, ctx.userId);
        return detector.analyzeHabit(input.habitId);
    }),
    // List all habits
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        includeArchived: zod_1.z.boolean().default(false),
    }))
        .query(async ({ ctx, input }) => {
        const service = new habit_service_1.HabitService(ctx.db, ctx.userId);
        return service.listHabits(input.includeArchived);
    }),
    // Archive habit
    archive: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        const service = new habit_service_1.HabitService(ctx.db, ctx.userId);
        return service.archiveHabit(input.id);
    }),
});
//# sourceMappingURL=habits.router.js.map