import { supabase } from '../lib/supabase';
import { showAchievementToast } from '../components/game/AchievementToast';
import { claimAchievementsSecurely, updateStreakSecurely } from '../services/settlementService';

interface AchievementRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

// The database decides eligibility, idempotency and XP. The browser only
// renders notifications for achievement IDs returned by the authenticated RPC.
export const checkAndUnlockAchievements = async (_userId?: string): Promise<void> => {
  void _userId; // Compatibility with existing call sites; RPC uses auth.uid().
  try {
    const { unlockedIds } = await claimAchievementsSecurely();
    if (unlockedIds.length === 0) return;

    const { data, error } = await supabase
      .from('achievements')
      .select('id, name, description, icon, xp_reward')
      .in('id', unlockedIds);
    if (error) throw error;

    (data as AchievementRow[] | null)?.forEach((achievement) => {
      showAchievementToast(achievement);
    });
  } catch (error) {
    console.error('[AchievementChecker] Secure claim failed:', error);
  }
};

export const updateStreak = async (_userId?: string): Promise<void> => {
  void _userId; // Compatibility with existing call sites; RPC uses auth.uid().
  try {
    await updateStreakSecurely();
  } catch (error) {
    console.error('[AchievementChecker] Secure streak update failed:', error);
  }
};
