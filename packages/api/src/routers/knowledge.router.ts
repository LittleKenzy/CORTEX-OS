import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { KnowledgeService } from '../services/knowledge/knowledge.service';
import { GraphService } from '../services/knowledge/graph.service';

export const knowledgeRouter = router({
  // Create note
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(500),
      markdown: z.string(),
      tagIds: z.array(z.string()).optional(),
      linkToNoteIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new KnowledgeService(ctx.db, ctx.userId);
      return service.createNote(input);
    }),

  // Update note with backlink detection
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(500).optional(),
      markdown: z.string().optional(),
      tagIds: z.array(z.string()).optional(),
      isPinned: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new KnowledgeService(ctx.db, ctx.userId);
      return service.updateNote(input.id, input);
    }),

  // Get note with all relations
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new KnowledgeService(ctx.db, ctx.userId);
      return service.getNoteWithRelations(input.id);
    }),

  // List notes with filters
  list: protectedProcedure
    .input(z.object({
      tagIds: z.array(z.string()).optional(),
      search: z.string().optional(),
      isPinned: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new KnowledgeService(ctx.db, ctx.userId);
      return service.listNotes(input);
    }),

  // Get graph data
  getGraph: protectedProcedure
    .input(z.object({
      centerNoteId: z.string().optional(),
      depth: z.number().min(1).max(3).default(2),
    }))
    .query(async ({ ctx, input }) => {
      const graphService = new GraphService(ctx.db, ctx.userId);
      return graphService.buildGraph(input.centerNoteId, input.depth);
    }),

  // Delete note
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new KnowledgeService(ctx.db, ctx.userId);
      return service.deleteNote(input.id);
    }),
});