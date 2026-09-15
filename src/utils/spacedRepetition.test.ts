import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateNextReview, getReviewStatus, scoreToQuality, type ReviewItem } from './spacedRepetition';

const item: ReviewItem = {
  lessonId: 'lesson-1',
  easeFactor: 2.5,
  intervalDays: 6,
  repetitions: 2,
  nextReviewDate: new Date('2026-09-15T00:00:00+08:00'),
};

describe('spaced repetition', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date('2026-09-15T10:00:00+08:00')));
  afterEach(() => vi.useRealTimers());

  it('resets repetition after a failed review', () => {
    expect(calculateNextReview(item, 2)).toMatchObject({
      repetitions: 0,
      intervalDays: 1,
      easeFactor: 2.3,
    });
  });

  it('grows the interval after a successful review', () => {
    expect(calculateNextReview(item, 5)).toMatchObject({
      repetitions: 3,
      intervalDays: 15,
      easeFactor: 2.6,
    });
  });

  it.each([
    [100, 5], [95, 5], [94, 4], [85, 4], [70, 3], [50, 2], [30, 1], [0, 0],
  ])('maps score %i to quality %i', (score, quality) => {
    expect(scoreToQuality(score)).toBe(quality);
  });

  it('classifies dates relative to today', () => {
    expect(getReviewStatus(new Date('2026-09-14T18:00:00+08:00')).status).toBe('overdue');
    expect(getReviewStatus(new Date('2026-09-15T20:00:00+08:00')).status).toBe('today');
    expect(getReviewStatus(new Date('2026-09-17T00:00:00+08:00')).status).toBe('upcoming');
  });
});
