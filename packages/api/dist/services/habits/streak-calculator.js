"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakCalculator = void 0;
class StreakCalculator {
    db;
    userId;
    constructor(db, userId) {
        this.db = db;
        this.userId = userId;
    }
    async calculateStreak(habitId) {
        const entries = await this.db.habitEntry.findMany({
            where: {
                habitId,
                userId: this.userId,
                completed: true,
            },
            orderBy: { date: 'desc' },
        });
        if (entries.length === 0) {
            return {
                current: 0,
                longest: 0,
                lastCompletedDate: null,
                isActiveToday: false,
            };
        }
        const today = this.normalizeDate(new Date());
        const lastCompletedDate = entries[0].date;
        const isActiveToday = this.isSameDay(lastCompletedDate, today);
        // Calculate current streak
        let currentStreak = 0;
        let currentDate = today;
        for (const entry of entries) {
            const entryDate = this.normalizeDate(entry.date);
            if (this.isSameDay(entryDate, currentDate) ||
                this.isPreviousDay(entryDate, currentDate)) {
                currentStreak++;
                currentDate = entryDate;
            }
            else {
                break;
            }
        }
        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        let prevDate = null;
        for (const entry of [...entries].reverse()) {
            const entryDate = this.normalizeDate(entry.date);
            if (!prevDate || this.isNextDay(entryDate, prevDate)) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            }
            else if (!this.isSameDay(entryDate, prevDate)) {
                tempStreak = 1;
            }
            prevDate = entryDate;
        }
        return {
            current: currentStreak,
            longest: longestStreak,
            lastCompletedDate,
            isActiveToday,
        };
    }
    async updateHabitStreaks(habitId) {
        const streakData = await this.calculateStreak(habitId);
        await this.db.habit.update({
            where: { id: habitId },
            data: {
                currentStreak: streakData.current,
                longestStreak: streakData.longest,
            },
        });
    }
    normalizeDate(date) {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    }
    isSameDay(date1, date2) {
        return this.normalizeDate(date1).getTime() === this.normalizeDate(date2).getTime();
    }
    isPreviousDay(date1, date2) {
        const diff = this.normalizeDate(date2).getTime() - this.normalizeDate(date1).getTime();
        return diff === 86400000; // 24 hours in ms
    }
    isNextDay(date1, date2) {
        const diff = this.normalizeDate(date1).getTime() - this.normalizeDate(date2).getTime();
        return diff === 86400000;
    }
}
exports.StreakCalculator = StreakCalculator;
//# sourceMappingURL=streak-calculator.js.map