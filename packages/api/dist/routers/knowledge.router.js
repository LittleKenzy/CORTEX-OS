"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const knowledge_service_1 = require("../services/knowledge/knowledge.service");
const graph_service_1 = require("../services/knowledge/graph.service");
exports.knowledgeRouter = (0, trpc_1.router)({
    // Create note
    create: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        title: zod_1.z.string().min(1).max(500),
        markdown: zod_1.z.string(),
        tagIds: zod_1.z.array(zod_1.z.string()).optional(),
        linkToNoteIds: zod_1.z.array(zod_1.z.string()).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const service = new knowledge_service_1.KnowledgeService(ctx.db, ctx.userId);
        return service.createNote(input);
    }),
    // Update note with backlink detection
    update: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        title: zod_1.z.string().min(1).max(500).optional(),
        markdown: zod_1.z.string().optional(),
        tagIds: zod_1.z.array(zod_1.z.string()).optional(),
        isPinned: zod_1.z.boolean().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const service = new knowledge_service_1.KnowledgeService(ctx.db, ctx.userId);
        return service.updateNote(input.id, input);
    }),
    // Get note with all relations
    getById: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .query(async ({ ctx, input }) => {
        const service = new knowledge_service_1.KnowledgeService(ctx.db, ctx.userId);
        return service.getNoteWithRelations(input.id);
    }),
    // List notes with filters
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        tagIds: zod_1.z.array(zod_1.z.string()).optional(),
        search: zod_1.z.string().optional(),
        isPinned: zod_1.z.boolean().optional(),
        limit: zod_1.z.number().min(1).max(100).default(50),
        cursor: zod_1.z.string().optional(),
    }))
        .query(async ({ ctx, input }) => {
        const service = new knowledge_service_1.KnowledgeService(ctx.db, ctx.userId);
        return service.listNotes(input);
    }),
    // Get graph data
    getGraph: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        centerNoteId: zod_1.z.string().optional(),
        depth: zod_1.z.number().min(1).max(3).default(2),
    }))
        .query(async ({ ctx, input }) => {
        const graphService = new graph_service_1.GraphService(ctx.db, ctx.userId);
        return graphService.buildGraph(input.centerNoteId, input.depth);
    }),
    // Delete note
    delete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        const service = new knowledge_service_1.KnowledgeService(ctx.db, ctx.userId);
        return service.deleteNote(input.id);
    }),
});
//# sourceMappingURL=knowledge.router.js.map