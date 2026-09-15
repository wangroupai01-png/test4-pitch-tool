import { supabase } from '../lib/supabase';

export interface LessonSettlement {
  passed: boolean;
  firstCompletion: boolean;
  totalXp: number | null;
  currentLevel: number | null;
  levelUp: boolean;
  skillFirstCompletion?: boolean;
  nextLessonId?: string | null;
}

export interface GameSettlement {
  bestScore: number;
  bestLevel: number;
  totalGames: number;
}

const unwrapRpc = <T>(data: unknown, error: { message?: string } | null): T => {
  if (error) throw new Error(error.message || '结算失败，请稍后重试');
  return data as T;
};

export const settleLesson = async (lessonId: string, score: number, stars: number) => {
  const { data, error } = await supabase.rpc('mc_complete_lesson', {
    p_lesson_id: lessonId, p_score: score, p_stars: stars,
  });
  return unwrapRpc<LessonSettlement>(data, error);
};

export const settleDailyChallenge = async (score: number, challengeType: string) => {
  const { data, error } = await supabase.rpc('mc_submit_daily_challenge', {
    p_score: score, p_challenge_type: challengeType,
  });
  return unwrapRpc<{ bestScore: number; firstCompletion: boolean; xpAwarded: number }>(data, error);
};

export const settleGameScore = async (mode: 'quiz' | 'sing', score: number, level: number, countGame: boolean) => {
  const { data, error } = await supabase.rpc('mc_submit_game_score', {
    p_game_mode: mode, p_score: score, p_level: level, p_count_game: countGame,
  });
  return unwrapRpc<GameSettlement>(data, error);
};

export const settlePkScore = async (challengeId: string, score: number) => {
  const { data, error } = await supabase.rpc('mc_submit_pk_score', {
    p_challenge_id: challengeId, p_score: score,
  });
  return unwrapRpc<{ completed: boolean; winnerId: string | null }>(data, error);
};

export const updateStreakSecurely = async () => {
  const { data, error } = await supabase.rpc('mc_update_streak');
  return unwrapRpc<{ currentStreak: number; longestStreak: number }>(data, error);
};

export const claimAchievementsSecurely = async () => {
  const { data, error } = await supabase.rpc('mc_claim_achievements');
  return unwrapRpc<{ unlockedIds: string[] }>(data, error);
};

export const respondToPk = async (challengeId: string, accept: boolean) => {
  const { data, error } = await supabase.rpc('mc_respond_pk', { p_challenge_id: challengeId, p_accept: accept });
  return unwrapRpc<boolean>(data, error);
};
