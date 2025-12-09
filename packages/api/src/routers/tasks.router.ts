
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TaskService } from '../services/tasks/task.service';
import { PriorityScorer } from '../services/tasks/priority-scorer';
import { SchedulerService } from '../services/tasks/scheduler.service';

const taskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED']);

export const tasksRouter = router({
  // Create task
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      parentId: z.string().optional(),
      dueDate: z.date().optional(),
      estimatedMinutes: z.number().positive().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new TaskService(ctx.db, ctx.userId);
      return service.createTask(input);
    }),

  // Update task with priority recalculation
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: taskStatusEnum.optional(),
      dueDate: z.date().nullable().optional(),
      estimatedMinutes: z.number().nullable().optional(),
      actualMinutes: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new TaskService(ctx.db, ctx.userId);
      return service.updateTask(input.id, input);
    }),

  // Get task tree
  getTree: protectedProcedure
    .input(z.object({
      status: taskStatusEnum.optional(),
      includeCompleted: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const service = new TaskService(ctx.db, ctx.userId);
      return service.getTaskTree(input);
    }),

  // Recalculate all priorities
  recalculatePriorities: protectedProcedure
    .mutation(async ({ ctx }) => {
      const scorer = new PriorityScorer(ctx.db, ctx.userId);
      return scorer.recalculateAllPriorities();
    }),

  // Get reschedule suggestions
  getRescheduleSuggestions: protectedProcedure
    .query(async ({ ctx }) => {
      const scheduler = new SchedulerService(ctx.db, ctx.userId);
      return scheduler.generateRescheduleSuggestions();
    }),

  // Move task in tree
  moveTask: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      newParentId: z.string().nullable(),
      position: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new TaskService(ctx.db, ctx.userId);
      return service.moveTask(input.taskId, input.newParentId, input.position);
    }),

  // Delete task and reorder siblings
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new TaskService(ctx.db, ctx.userId);
      return service.deleteTask(input.id);
    }),
});