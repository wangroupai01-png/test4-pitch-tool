import { supabase } from '../lib/supabase';
import { showAchievementToast } from '../components/game/AchievementToast';

interface UserStats {
  lessonsCompleted: number;
  skillsCompleted: number;
  currentStreak: number;
  totalXp: number;
  currentLevel: number;
}

// 获取用户统计数据
export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // 获取完成的课程数
    const { count: lessonsCount } = await supabase
      .from('user_lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // 获取完成的技能数
    const { count: skillsCount } = await supabase
      .from('user_skill_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // 获取打卡天数
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .maybeSingle();

    // 获取 XP 和等级
    const { data: xpData } = await supabase
      .from('user_xp')
      .select('total_xp, current_level')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      lessonsCompleted: lessonsCount || 0,
      skillsCompleted: skillsCount || 0,
      currentStreak: streakData?.current_streak || 0,
      totalXp: xpData?.total_xp || 0,
      currentLevel: xpData?.current_level || 1,
    };
  } catch (err) {
    console.error('[AchievementChecker] Error getting user stats:', err);
    return {
      lessonsCompleted: 0,
      skillsCompleted: 0,
      currentStreak: 0,
      totalXp: 0,
      currentLevel: 1,
    };
  }
};

// 检查并解锁成就
export const checkAndUnlockAchievements = async (userId: string): Promise<void> => {
  try {
    console.log('[AchievementChecker] Checking achievements for user:', userId);

    // 获取用户统计
    const stats = await getUserStats(userId);
    console.log('[AchievementChecker] User stats:', stats);

    // 获取所有成就
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*');

    if (achievementsError || !achievements) {
      console.error('[AchievementChecker] Error loading achievements:', achievementsError);
      return;
    }

    // 获取用户已解锁的成就
    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);

    // 检查每个成就
    for (const achievement of achievements) {
      // 跳过已解锁的
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.condition_type) {
        case 'lessons_completed':
          shouldUnlock = stats.lessonsCompleted >= achievement.condition_value;
          break;
        case 'skills_completed':
          shouldUnlock = stats.skillsCompleted >= achievement.condition_value;
          break;
        case 'streak_days':
          shouldUnlock = stats.currentStreak >= achievement.condition_value;
          break;
        case 'total_xp':
          shouldUnlock = stats.totalXp >= achievement.condition_value;
          break;
        case 'level':
          shouldUnlock = stats.currentLevel >= achievement.condition_value;
          break;
        default:
          break;
      }

      if (shouldUnlock) {
        console.log('[AchievementChecker] Unlocking achievement:', achievement.name);

        // 记录解锁
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
          });

        if (insertError) {
          console.error('[AchievementChecker] Error unlocking achievement:', insertError);
          continue;
        }

        // 添加 XP 奖励
        if (achievement.xp_reward > 0) {
          const { data: xpData } = await supabase
            .from('user_xp')
            .select('total_xp')
            .eq('user_id', userId)
            .maybeSingle();

          const newTotalXp = (xpData?.total_xp || 0) + achievement.xp_reward;

          await supabase
            .from('user_xp')
            .upsert({
              user_id: userId,
              total_xp: newTotalXp,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          // 记录 XP 日志
          await supabase
            .from('xp_logs')
            .insert({
              user_id: userId,
              xp_amount: achievement.xp_reward,
              source: 'achievement',
              source_id: achievement.id,
            });
        }

        // 显示成就弹窗
        showAchievementToast({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          xp_reward: achievement.xp_reward,
        });
      }
    }
  } catch (err) {
    console.error('[AchievementChecker] Error checking achievements:', err);
  }
};

// 更新打卡记录
export const updateStreak = async (userId: string): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 获取当前打卡记录
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!streakData) {
      // 首次打卡
      await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        });
      console.log('[AchievementChecker] First streak recorded');
      return;
    }

    const lastDate = streakData.last_activity_date;
    
    // 如果今天已经打卡，不重复计算
    if (lastDate === today) {
      console.log('[AchievementChecker] Already checked in today');
      return;
    }

    // 计算日期差
    const lastDateObj = new Date(lastDate);
    const todayObj = new Date(today);
    const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = 1;
    if (diffDays === 1) {
      // 连续打卡
      newStreak = streakData.current_streak + 1;
    }
    // 如果超过1天，重置为1

    const newLongestStreak = Math.max(newStreak, streakData.longest_streak || 0);

    await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    console.log('[AchievementChecker] Streak updated:', { newStreak, newLongestStreak });
  } catch (err) {
    console.error('[AchievementChecker] Error updating streak:', err);
  }
};
