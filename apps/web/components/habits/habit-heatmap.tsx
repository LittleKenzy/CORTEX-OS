'use client';

import { HabitHeatmapCell } from '@cortex/shared/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HabitHeatmapProps {
  data: HabitHeatmapCell[];
  onCellClick?: (cell: HabitHeatmapCell) => void;
}

export function HabitHeatmap({ data, onCellClick }: HabitHeatmapProps) {
  // Group by week
  const weeks: HabitHeatmapCell[][] = [];
  let currentWeek: HabitHeatmapCell[] = [];

  // Pad start to align with Sunday
  const firstDate = data[0]?.date;
  if (firstDate) {
    const dayOfWeek = firstDate.getDay();
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({
        date: new Date(firstDate.getTime() - (dayOfWeek - i) * 86400000),
        count: 0,
        completed: false,
        level: 0,
      });
    }
  }

  for (const cell of data) {
    currentWeek.push(cell);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getLevelColor = (level: number, completed: boolean) => {
    if (!completed) return 'bg-gray-100 dark:bg-gray-800';
    
    const colors = [
      'bg-gray-100 dark:bg-gray-800',
      'bg-green-200 dark:bg-green-900',
      'bg-green-300 dark:bg-green-800',
      'bg-green-500 dark:bg-green-700',
      'bg-green-700 dark:bg-green-600',
    ];
    
    return colors[level] || colors[0];
  };

  return (
    <div className="space-y-2">
      {/* Day labels */}
      <div className="flex gap-1">
        <div className="w-8" /> {/* Spacer for week numbers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="w-3 text-xs text-center text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <TooltipProvider>
        <div className="flex flex-col gap-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex gap-1">
              <div className="w-8 text-xs text-gray-500 flex items-center justify-end pr-1">
                {weekIdx + 1}
              </div>
              {week.map((cell, dayIdx) => (
                <Tooltip key={dayIdx}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onCellClick?.(cell)}
                      className={cn(
                        'w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-gray-400',
                        getLevelColor(cell.level, cell.completed)
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div className="font-semibold">
                        {cell.date.toLocaleDateString()}
                      </div>
                      <div>
                        {cell.completed ? `Completed ${cell.count}x` : 'Not completed'}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn('w-3 h-3 rounded-sm', getLevelColor(level, level > 0))}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}