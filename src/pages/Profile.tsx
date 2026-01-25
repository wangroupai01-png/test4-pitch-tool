import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Flame, Star, Settings, LogOut, ChevronRight, Award, TrendingUp, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/useUserStore';
import { AuthModal } from '../components/auth/AuthModal';
import { supabase } from '../lib/supabase';

const MotionDiv = motion.div as any;

interface UserStats {
  totalXp: number;
  level: number;
  levelTitle: string;
  streak: number;
  longestStreak: number;
  skillsCompleted: number;
  lessonsCompleted: number;
  achievementsUnlocked: number;
}

export const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, isGuest, signOut, guestData } = useUserStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalXp: 0,
    level: 1,
    levelTitle: '音乐新手',
    streak: 0,
    longestStreak: 0,
    skillsCompleted: 0,
    lessonsCompleted: 0,
    achievementsUnlocked: 0,
  });
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, [user, isGuest]);

  const loadUserStats = async () => {
    console.log('[Profile] loadUserStats called:', { user: user?.id, isGuest });
    
    // 用 user 来判断是否登录，而不是 isGuest
    if (!user) {
      // 访客使用本地数据
      setStats({
        totalXp: (guestData.quizHighScore || 0) + (guestData.singHighScore || 0),
        level: 1,
        levelTitle: '音乐新手',
        streak: 0,
        longestStreak: 0,
        skillsCompleted: 0,
        lessonsCompleted: 0,
        achievementsUnlocked: 0,
      });
      setLoading(false);
      return;
    }

    try {
      // 加载 XP
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('total_xp, current_level')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('[Profile] XP data:', { xpData, xpError });

      // 加载等级称号
      let levelTitle = '音乐新手';
      if (xpData?.current_level) {
        const { data: levelData } = await supabase
          .from('level_config')
          .select('title')
          .lte('level', xpData.current_level)
          .order('level', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (levelData) levelTitle = levelData.title;
      }

      // 加载打卡
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      // 加载技能完成数
      const { count: skillsCount } = await supabase
        .from('user_skill_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      // 加载课程完成数
      const { count: lessonsCount } = await supabase
        .from('user_lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      // 加载成就数
      const { count: achievementsCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        totalXp: xpData?.total_xp || 0,
        level: xpData?.current_level || 1,
        levelTitle,
        streak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
        skillsCompleted: skillsCount || 0,
        lessonsCompleted: lessonsCount || 0,
        achievementsUnlocked: achievementsCount || 0,
      });
    } catch (err) {
      console.error('[Profile] Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || '访客用户';

  // 未登录时显示大的登录提示卡片
  if (isGuest) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <MotionDiv
          initial={{ opacity: 0, y: 20, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
        >
          <Card className="!p-8 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary rounded-full border-3 border-dark opacity-20" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent rounded-full border-3 border-dark opacity-20" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 border-3 border-dark shadow-neo rotate-3">
                <User className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-black text-dark mb-2">欢迎来到音高大师</h1>
              <p className="text-slate-500 font-bold mb-6">登录后可保存学习进度、参与排行榜</p>
              <Button 
                className="w-full text-lg py-4"
                onClick={() => setShowAuthModal(true)}
              >
                🎵 登录 / 注册
              </Button>
            </div>
          </Card>
        </MotionDiv>

        {/* 访客统计 */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4"
        >
          <Card className="!p-5">
            <h2 className="font-black text-lg text-dark mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              本地数据
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-xl border-2 border-dark">
                <p className="text-3xl font-black text-primary">{guestData.quizHighScore}</p>
                <p className="text-sm font-bold text-slate-500 mt-1">听音最高分</p>
              </div>
              <div className="text-center p-4 bg-secondary/10 rounded-xl border-2 border-dark">
                <p className="text-3xl font-black text-secondary">{guestData.singHighScore}</p>
                <p className="text-sm font-bold text-slate-500 mt-1">哼唱最高分</p>
              </div>
            </div>
          </Card>
        </MotionDiv>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <MotionDiv
        initial={{ opacity: 0, y: 20, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
      >
        <Card className="!p-6 mb-6 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-secondary rounded-full border-3 border-dark opacity-10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-accent rounded-full border-3 border-dark opacity-10" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <MotionDiv 
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-3 border-dark shadow-neo"
              >
                <User className="w-12 h-12 text-white" />
              </MotionDiv>
              
              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-black text-dark">{displayName}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-primary text-white font-black text-sm rounded-full border-2 border-dark shadow-neo-sm">
                    Lv.{stats.level}
                  </span>
                  <span className="text-slate-500 font-bold">{stats.levelTitle}</span>
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mt-6 bg-slate-50 rounded-xl p-4 border-2 border-dark">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-black text-slate-600">经验值</span>
                <span className="font-black text-primary">{stats.totalXp} XP</span>
              </div>
              <div className="h-4 bg-white rounded-full overflow-hidden border-2 border-dark">
                <MotionDiv 
                  className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (stats.totalXp % 500) / 5)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </Card>
      </MotionDiv>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { icon: Flame, value: stats.streak, label: '连续打卡', color: 'bg-accent', iconColor: 'text-white' },
          { icon: Star, value: stats.skillsCompleted, label: '完成技能', color: 'bg-primary', iconColor: 'text-white' },
          { icon: TrendingUp, value: stats.lessonsCompleted, label: '完成课程', color: 'bg-secondary', iconColor: 'text-white' },
          { icon: Award, value: stats.achievementsUnlocked, label: '解锁成就', color: 'bg-yellow-400', iconColor: 'text-dark' },
        ].map((stat, index) => (
          <MotionDiv
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ scale: 1.02, rotate: 1 }}
            className="h-full"
          >
            <Card className="!p-5 text-center hover:shadow-neo-lg transition-all h-full flex flex-col items-center justify-center">
              <div className={`w-14 h-14 ${stat.color} rounded-2xl mx-auto mb-3 flex items-center justify-center border-3 border-dark shadow-neo-sm`}>
                <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
              </div>
              <p className="text-3xl font-black text-dark">{stat.value}</p>
              <p className="text-sm font-bold text-slate-500 mt-1">{stat.label}</p>
            </Card>
          </MotionDiv>
        ))}
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {[
          { icon: Award, label: '我的成就', color: 'text-yellow-500', onClick: () => navigate('/achievements') },
          { icon: Settings, label: '设置', color: 'text-slate-500', onClick: () => alert('设置功能即将完善！') },
        ].map((item, index) => (
          <MotionDiv
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="!p-4 flex items-center gap-4 cursor-pointer hover:shadow-neo-lg transition-all"
              onClick={item.onClick}
            >
              <div className="p-2 bg-slate-100 rounded-xl border-2 border-dark">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="flex-1 font-black text-dark">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Card>
          </MotionDiv>
        ))}

        {/* Logout */}
        <MotionDiv
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="!p-4 flex items-center gap-4 cursor-pointer hover:!bg-red-50 hover:!border-red-300 transition-all"
            onClick={handleSignOut}
          >
            <div className="p-2 bg-red-100 rounded-xl border-2 border-red-300">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <span className="flex-1 font-black text-red-500">退出登录</span>
          </Card>
        </MotionDiv>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};
