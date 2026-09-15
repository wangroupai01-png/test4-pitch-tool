import { describe, expect, it } from 'vitest';
import { EMPTY_PROGRESS, completeTask, getUnlockedDay, getWeekSummary, localDateKey, recordAnswer, resolveSelectedDay } from './progress';

const now = '2026-09-15T08:00:00.000Z';

describe('30-day challenge progress', () => {
  it('requires tasks in order and unlocks the next day after reward', () => {
    let progress = structuredClone(EMPTY_PROGRESS);
    expect(completeTask(progress, 1, 'learn', now)).toEqual(progress);
    for (const task of ['warmup', 'learn', 'drill', 'challenge', 'reward'] as const) progress = completeTask(progress, 1, task, now, '2026-09-15');
    expect(getUnlockedDay(progress, '2026-09-15')).toBe(1);
    expect(getUnlockedDay(progress, '2026-09-16')).toBe(2);
    expect(progress.rewards).toEqual([1]);
  });

  it('does not allow skipping a locked day', () => {
    const progress = completeTask(structuredClone(EMPTY_PROGRESS), 2, 'warmup', now);
    expect(progress).toEqual(EMPTY_PROGRESS);
  });

  it('builds a real weekly accuracy summary', () => {
    let progress = recordAnswer(structuredClone(EMPTY_PROGRESS), 1, true);
    progress = recordAnswer(progress, 1, false);
    expect(getWeekSummary(progress, 1)).toMatchObject({ attempts: 2, correct: 1, accuracy: 50 });
  });

  it('supports the final two-day report window', () => {
    expect(getWeekSummary(structuredClone(EMPTY_PROGRESS), 5)).toMatchObject({ start: 29, end: 30, completed: 0 });
  });

  it('keeps an explicitly selected completed day after the next day unlocks', () => {
    expect(resolveSelectedDay(1, 2)).toBe(1);
    expect(resolveSelectedDay(null, 2)).toBe(2);
    expect(resolveSelectedDay(30, 2)).toBe(2);
  });

  it('uses the user local calendar date instead of UTC', () => {
    expect(localDateKey(new Date(2026, 8, 16, 0, 30))).toBe('2026-09-16');
  });
});
