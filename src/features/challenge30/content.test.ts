import { describe, expect, it } from 'vitest';
import { buildQuestions, CHALLENGE_DAYS } from './content';

describe('30-day challenge content', () => {
  it('contains a complete ordered 30-day map', () => {
    expect(CHALLENGE_DAYS).toHaveLength(30);
    expect(CHALLENGE_DAYS.map((day) => day.day)).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
    expect(new Set(CHALLENGE_DAYS.map((day) => day.title)).size).toBe(30);
    expect(CHALLENGE_DAYS.every((day) => day.notePool.length >= 3 && day.theory.length > 20)).toBe(true);
  });

  it('builds deterministic questions whose answer is always available', () => {
    const questions = buildQuestions(CHALLENGE_DAYS[0], 5, 42);
    expect(questions).toHaveLength(5);
    for (const question of questions) {
      expect(question.options.map((option) => option.value)).toContain(question.answer);
      expect(new Set(question.options.map((option) => option.value)).size).toBe(question.options.length);
    }
    expect(buildQuestions(CHALLENGE_DAYS[0], 5, 42)).toEqual(questions);
  });

  it('uses genuinely different training modes across the four chapters', () => {
    expect(CHALLENGE_DAYS.slice(0, 7).every((day) => day.mode === 'pitch')).toBe(true);
    expect(CHALLENGE_DAYS.slice(7, 14).every((day) => day.mode === 'interval')).toBe(true);
    expect(CHALLENGE_DAYS.slice(14, 21).every((day) => day.mode === 'sing')).toBe(true);
    expect(CHALLENGE_DAYS.slice(21, 25).every((day) => day.mode === 'chord')).toBe(true);
    expect(CHALLENGE_DAYS.slice(25).every((day) => day.mode === 'melody')).toBe(true);
  });
});
