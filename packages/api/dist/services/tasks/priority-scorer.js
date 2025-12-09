"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityScorer = void 0;
class PriorityScorer {
    db;
    userId;
    constructor(db, userId) {
        this.db = db;
        this.userId = userId;
    }
    async calculatePriority(taskId) {
        const task = await this.db.task.findUnique({
            where: { id: taskId, userId: this.userId },
            include: {
                children: {
                    where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
                },
            },
        });
        if (!task)
            throw new Error('Task not found');
        const now = new Date();
        // Calculate urgency (0-1 based on due date)
        const urgency = this.calculateUrgency(task.dueDate, now);
        // Calculate importance (derived from completion of blocking tasks)
        const importance = await this.calculateImportance(taskId);
        // Calculate effort (inverse of estimated time, normalized)
        const effort = this.calculateEffort(task.estimatedMinutes);
        // Calculate dependencies (how many tasks this blocks)
        const dependencies = await this.calculateDependencies(taskId);
        // Calculate age factor (older tasks get slight boost)
        const age = this.calculateAge(task.createdAt, now);
        const factors = {
            urgency,
            importance,
            effort,
            dependencies,
            age,
        };
        // Weighted scoring algorithm
        const total = urgency * 0.35 +
            importance * 0.25 +
            effort * 0.15 +
            dependencies * 0.15 +
            age * 0.10;
        // Normalize to 0-100
        const normalizedScore = Math.round(total * 100);
        return {
            total: normalizedScore,
            factors,
            computed: now,
        };
    }
    calculateUrgency(dueDate, now) {
        if (!dueDate)
            return 0.3; // Default medium urgency
        const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysUntilDue < 0)
            return 1.0; // Overdue
        if (daysUntilDue < 1)
            return 0.95; // Due today
        if (daysUntilDue < 3)
            return 0.85; // Due within 3 days
        if (daysUntilDue < 7)
            return 0.7; // Due this week
        if (daysUntilDue < 30)
            return 0.5; // Due this month
        return 0.3; // Due later
    }
    calculateEffort(estimatedMinutes) {
        if (!estimatedMinutes)
            return 0.5;
        // Quick tasks (< 30 min) score higher
        // Longer tasks score lower
        if (estimatedMinutes <= 30)
            return 1.0;
        if (estimatedMinutes <= 60)
            return 0.8;
        if (estimatedMinutes <= 120)
            return 0.6;
        if (estimatedMinutes <= 240)
            return 0.4;
        return 0.2;
    }
    async calculateImportance(taskId) {
        // Check how many tasks depend on this one (are blocked by it)
        const blockingCount = await this.db.task.count({
            where: {
                parentId: taskId,
                userId: this.userId,
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
        });
        // More blockers = more important
        if (blockingCount === 0)
            return 0.5;
        if (blockingCount <= 2)
            return 0.7;
        if (blockingCount <= 5)
            return 0.85;
        return 1.0;
    }
    async calculateDependencies(taskId) {
        const childCount = await this.db.task.count({
            where: {
                parentId: taskId,
                userId: this.userId,
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
        });
        if (childCount === 0)
            return 0.3;
        if (childCount <= 3)
            return 0.6;
        if (childCount <= 7)
            return 0.8;
        return 1.0;
    }
    calculateAge(createdAt, now) {
        const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 1)
            return 0.1;
        if (daysOld < 7)
            return 0.3;
        if (daysOld < 30)
            return 0.5;
        if (daysOld < 90)
            return 0.7;
        return 0.9;
    }
    async recalculateAllPriorities() {
        const tasks = await this.db.task.findMany({
            where: {
                userId: this.userId,
                status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
            select: { id: true },
        });
        // Update in batches to avoid overwhelming the DB
        for (const task of tasks) {
            const score = await this.calculatePriority(task.id);
            await this.db.task.update({
                where: { id: task.id },
                data: { priority: score.total },
            });
        }
    }
}
exports.PriorityScorer = PriorityScorer;
//# sourceMappingURL=priority-scorer.js.map