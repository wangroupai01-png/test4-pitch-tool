import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { rpc } }));

import { settleDailyChallenge, settleGameScore, settleLesson, settlePkScore } from './settlementService';

describe('settlement service', () => {
  beforeEach(() => rpc.mockReset());

  it('settles a lesson through the authenticated RPC', async () => {
    rpc.mockResolvedValue({ data: { passed: true, firstCompletion: true, totalXp: 120, currentLevel: 2, levelUp: true }, error: null });
    await expect(settleLesson('lesson-1', 90, 3)).resolves.toMatchObject({ passed: true, levelUp: true });
    expect(rpc).toHaveBeenCalledWith('mc_complete_lesson', { p_lesson_id: 'lesson-1', p_score: 90, p_stars: 3 });
  });

  it('uses dedicated RPCs for daily, game and PK settlement', async () => {
    rpc
      .mockResolvedValueOnce({ data: { bestScore: 80, firstCompletion: true, xpAwarded: 50 }, error: null })
      .mockResolvedValueOnce({ data: { bestScore: 200, bestLevel: 4, totalGames: 2 }, error: null })
      .mockResolvedValueOnce({ data: { completed: true, winnerId: null }, error: null });

    await settleDailyChallenge(80, 'quiz');
    await settleGameScore('sing', 200, 4, true);
    await settlePkScore('00000000-0000-0000-0000-000000000000', 80);

    expect(rpc.mock.calls.map(([name]) => name)).toEqual([
      'mc_submit_daily_challenge', 'mc_submit_game_score', 'mc_submit_pk_score',
    ]);
  });

  it('surfaces RPC failures without silently accepting a result', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'authentication required' } });
    await expect(settleLesson('lesson-1', 90, 3)).rejects.toThrow('authentication required');
  });
});
