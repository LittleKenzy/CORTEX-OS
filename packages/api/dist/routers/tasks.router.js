"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const task_service_1 = require("../services/tasks/task.service");
const priority_scorer_1 = require("../services/tasks/priority-scorer");
const scheduler_service_1 = require("../services/tasks/scheduler.service");
const taskStatusEnum = zod_1.z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']);
exports.tasksRouter = (0, trpc_1.router)({
    // Create task
    create: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        parentId: zod_1.z.string().optional(),
        dueDate: zod_1.z.date().optional(),
        estimatedMinutes: zod_1.z.number().positive().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const service = new task_service_1.TaskService(ctx.db, ctx.userId);
        return service.createTask(input);
    }),
    // Update task with priority recalculation
    update: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        status: taskStatusEnum.optional(),
        dueDate: zod_1.z.date().nullable().optional(),
        estimatedMinutes: zod_1.z.number().nullable().optional(),
        actualMinutes: zod_1.z.number().nullable().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const service = new task_service_1.TaskService(ctx.db, ctx.userId);
        return service.updateTask(input.id, input);
    }),
    // Get task tree
    getTree: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        status: taskStatusEnum.optional(),
        includeCompleted: zod_1.z.boolean().default(false),
    }))
        .query(async ({ ctx, input }) => {
        const service = new task_service_1.TaskService(ctx.db, ctx.userId);
        return service.getTaskTree(input);
    }),
    // Recalculate all priorities
    recalculatePriorities: trpc_1.protectedProcedure
        .mutation(async ({ ctx }) => {
        const scorer = new priority_scorer_1.PriorityScorer(ctx.db, ctx.userId);
        return scorer.recalculateAllPriorities();
    }),
    // Get reschedule suggestions
    getRescheduleSuggestions: trpc_1.protectedProcedure
        .query(async ({ ctx }) => {
        const scheduler = new scheduler_service_1.SchedulerService(ctx.db, ctx.userId);
        return scheduler.generateRescheduleSuggestions();
    }),
    // Move task in tree
    moveTask: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        taskId: zod_1.z.string(),
        newParentId: zod_1.z.string().nullable(),
        position: zod_1.z.number().int().min(0),
    }))
        .mutation(async ({ ctx, input }) => {
        const service = new task_service_1.TaskService(ctx.db, ctx.userId);
        return service.moveTask(input.taskId, input.newParentId, input.position);
    }),
    // Delete task and reorder siblings
    delete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        const service = new task_service_1.TaskService(ctx.db, ctx.userId);
        return service.deleteTask(input.id);
    }),
});
//# sourceMappingURL=tasks.router.js.map