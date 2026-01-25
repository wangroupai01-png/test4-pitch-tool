import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

const MotionDiv = motion.div as any;

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export const Achievements = () => {
  const { user } = useUserStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    try {
      // 加载所有成就
      const { data: achievementsData, error } = await supabase
        .from('achievements')
        .select('*')
        .order('condition_type, condition_value');

      if (error) {
        console.error('[Achievements] Error loading achievements:', error);
        return;
      }

      setAchievements(achievementsData || []);

      // 如果用户已登录，加载已解锁的成就
      if (user) {
        const { data: userAchievements } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user.id);

        const unlockedIds = new Set(userAchievements?.map((a: UserAchievement) => a.achievement_id) || []);
        setUnlockedAchievements(unlockedIds);
      }
    } catch (err) {
      console.error('[Achievements] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (conditionType: string) => {
    switch (conditionType) {
      case 'lessons_completed': return '📚 学习成就';
      case 'skills_completed': return '🎯 技能成就';
      case 'streak_days': return '🔥 坚持成就';
      case 'level': return '⬆️ 等级成就';
      case 'total_xp': return '💰 经验成就';
      default: return '🏆 其他成就';
    }
  };

  // 按类型分组
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.condition_type || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryOrder = ['lessons_completed', 'skills_completed', 'streak_days', 'level', 'total_xp'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg pattern-grid-lg">
        <MotionDiv
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const unlockedCount = unlockedAchievements.size;
  const totalCount = achievements.length;

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg">
      {/* Header */}
      <header className="bg-white border-b-3 border-dark p-4 sticky top-0 z-10 shadow-neo-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/profile">
            <MotionDiv 
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-slate-100 rounded-xl border-2 border-dark hover:shadow-neo-sm transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-dark" />
            </MotionDiv>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-black text-dark">🏆 我的成就</h1>
          </div>
          <div className="px-3 py-1 bg-yellow-400 text-dark font-black rounded-lg border-2 border-dark">
            {unlockedCount}/{totalCount}
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-2xl mx-auto pb-24">
        {/* Progress Summary */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="!p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-dark">成就进度</span>
              <span className="font-black text-primary">
                {Math.round((unlockedCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden border-2 border-dark">
              <MotionDiv
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </Card>
        </MotionDiv>

        {/* Achievements by Category */}
        <div className="space-y-6">
          {categoryOrder.map((category, catIndex) => {
            const categoryAchievements = groupedAchievements[category];
            if (!categoryAchievements || categoryAchievements.length === 0) return null;

            return (
              <MotionDiv
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 }}
              >
                <h2 className="font-black text-lg text-dark mb-3">
                  {getCategoryLabel(category)}
                </h2>
                
                <div className="grid grid-cols-1 gap-3">
                  {categoryAchievements.map((achievement, index) => {
                    const isUnlocked = unlockedAchievements.has(achievement.id);

                    return (
                      <MotionDiv
                        key={achievement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`
                          !p-4 flex items-center gap-4
                          ${isUnlocked ? '!bg-white' : '!bg-slate-50 opacity-60'}
                        `}>
                          {/* Icon */}
                          <div className={`
                            w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
                            border-3 border-dark
                            ${isUnlocked 
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-neo-sm' 
                              : 'bg-slate-200'
                            }
                          `}>
                            {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-slate-400" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <h3 className="font-black text-dark">{achievement.name}</h3>
                            <p className="text-sm text-slate-500 font-medium">{achievement.description}</p>
                          </div>

                          {/* Reward */}
                          <div className={`
                            px-3 py-1 rounded-full text-sm font-black border-2
                            ${isUnlocked 
                              ? 'bg-primary/10 text-primary border-primary/30' 
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                            }
                          `}>
                            +{achievement.xp_reward}
                          </div>
                        </Card>
                      </MotionDiv>
                    );
                  })}
                </div>
              </MotionDiv>
            );
          })}
        </div>

        {/* Empty State */}
        {achievements.length === 0 && (
          <Card className="!p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl border-3 border-dark flex items-center justify-center">
              <span className="text-3xl">🏆</span>
            </div>
            <p className="text-slate-500 font-bold">暂无成就数据</p>
          </Card>
        )}
      </main>
    </div>
  );
};
