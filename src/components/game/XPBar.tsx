import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star } from 'lucide-react';

const MotionDiv = motion.div as any;
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';
import { InstrumentSelector } from '../ui/InstrumentSelector';

interface XPData {
  totalXp: number;
  currentLevel: number;
  xpToday: number;
  streak: number;
  nextLevelXp: number;
  currentLevelXp: number;
}

export const XPBar = () => {
  const { user, isGuest } = useUserStore();
  const [xpData, setXpData] = useState<XPData>({
    totalXp: 0,
    currentLevel: 1,
    xpToday: 0,
    streak: 0,
    nextLevelXp: 100,
    currentLevelXp: 0,
  });

  useEffect(() => {
    loadXPData();
  }, [user]);

  const loadXPData = async () => {
    if (isGuest || !user) {
      return;
    }

    try {
      // 加载用户 XP
      const { data: userData } = await supabase
        .from('user_xp')
        .select('total_xp, current_level, xp_today')
        .eq('user_id', user.id)
        .maybeSingle();

      // 加载连续打卡
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      // 获取当前等级和下一等级的 XP 要求
      const level = userData?.current_level || 1;
      const { data: currentLevelData } = await supabase
        .from('level_config')
        .select('required_xp')
        .eq('level', level)
        .maybeSingle();

      const { data: nextLevelData } = await supabase
        .from('level_config')
        .select('required_xp')
        .eq('level', level + 1)
        .maybeSingle();

      setXpData({
        totalXp: userData?.total_xp || 0,
        currentLevel: level,
        xpToday: userData?.xp_today || 0,
        streak: streakData?.current_streak || 0,
        currentLevelXp: currentLevelData?.required_xp || 0,
        nextLevelXp: nextLevelData?.required_xp || (currentLevelData?.required_xp || 0) + 100,
      });
    } catch (err) {
      console.error('[XPBar] Error loading XP data:', err);
    }
  };

  // 计算当前等级进度百分比
  const levelProgress = () => {
    const xpInLevel = xpData.totalXp - xpData.currentLevelXp;
    const xpForLevel = xpData.nextLevelXp - xpData.currentLevelXp;
    return Math.min(100, Math.max(0, (xpInLevel / xpForLevel) * 100));
  };

  if (isGuest) {
    return null;
  }

  return (
    <div className="bg-white border-b-3 border-dark px-4 py-3 shadow-neo-sm">
      <div className="max-w-lg mx-auto flex items-center gap-4">
        {/* Level Badge */}
        <MotionDiv 
          whileHover={{ scale: 1.05, rotate: 2 }}
          className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-full font-black text-sm border-3 border-dark shadow-neo-sm"
        >
          <Star className="w-4 h-4 fill-white" />
          <span>Lv.{xpData.currentLevel}</span>
        </MotionDiv>

        {/* XP Progress */}
        <div className="flex-1">
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden border-2 border-dark">
            <MotionDiv
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress()}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 font-bold">
            <span className="text-slate-500">{xpData.totalXp} XP</span>
            <span className="text-slate-400">下一级 {xpData.nextLevelXp}</span>
          </div>
        </div>

        {/* Streak */}
        {xpData.streak > 0 && (
          <MotionDiv 
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1 bg-accent text-white px-2.5 py-1 rounded-full font-black text-sm border-2 border-dark shadow-neo-sm"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>{xpData.streak}</span>
          </MotionDiv>
        )}

        {/* 乐器选择器 */}
        <InstrumentSelector compact />
      </div>
    </div>
  );
};
