import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Trophy, Settings, X, Headphones, Music } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { AuthModal } from './AuthModal';
import { supabase } from '../../lib/supabase';

interface UserStats {
  quiz: { best_score: number; total_games: number } | null;
  sing: { best_score: number; best_level: number; total_games: number } | null;
}

export const UserButton: React.FC = () => {
  const { user, profile, isGuest, signOut, guestData } = useUserStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const MotionDiv = motion.div as any;

  const loadUserStats = async () => {
    if (isGuest) {
      // Use guest data
      setUserStats({
        quiz: guestData.quizHighScore > 0 ? {
          best_score: guestData.quizHighScore,
          total_games: guestData.totalGames,
        } : null,
        sing: guestData.singHighScore > 0 ? {
          best_score: guestData.singHighScore,
          best_level: guestData.singBestLevel,
          total_games: guestData.totalGames,
        } : null,
      });
      setShowStatsModal(true);
      return;
    }

    if (!user) {
      console.log('[UserStats] No user, showing empty stats');
      setUserStats({ quiz: null, sing: null });
      setShowStatsModal(true);
      return;
    }
    
    setLoadingStats(true);
    try {
      console.log('[UserStats] Loading stats for user:', user.id);
      
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('[UserStats] Supabase error:', error);
        // Still show modal with empty stats
        setUserStats({ quiz: null, sing: null });
        setShowStatsModal(true);
        return;
      }
      
      console.log('[UserStats] Received data:', data);
      
      const quizEntry = data?.find((e: any) => e.game_mode === 'quiz');
      const singEntry = data?.find((e: any) => e.game_mode === 'sing');
      
      setUserStats({
        quiz: quizEntry ? {
          best_score: quizEntry.best_score,
          total_games: quizEntry.total_games,
        } : null,
        sing: singEntry ? {
          best_score: singEntry.best_score,
          best_level: singEntry.best_level,
          total_games: singEntry.total_games,
        } : null,
      });
      setShowStatsModal(true);
    } catch (err) {
      console.error('[UserStats] Failed to load stats:', err);
      // Still show modal with empty stats
      setUserStats({ quiz: null, sing: null });
      setShowStatsModal(true);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleShowStats = () => {
    setShowDropdown(false);
    loadUserStats();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowDropdown(false);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };
  
  if (isGuest) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 bg-white border-3 border-dark px-3 md:px-4 py-2 rounded-full font-bold shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm md:text-base"
        >
          <User className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">登录</span>
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }
  
  const displayName = profile?.username || user?.email?.split('@')[0] || '用户';
  
  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 bg-primary text-white border-3 border-dark px-3 md:px-4 py-2 rounded-full font-bold shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm md:text-base"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline max-w-[100px] truncate">{displayName}</span>
        </button>
        
        <AnimatePresence>
          {showDropdown && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDropdown(false)} 
              />
              
              {/* Dropdown */}
              <MotionDiv
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white border-3 border-dark rounded-xl shadow-neo z-50 overflow-hidden"
              >
                <div className="p-3 border-b-2 border-slate-100">
                  <p className="font-black truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={handleShowStats}
                    disabled={loadingStats}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 font-bold text-left transition-colors disabled:opacity-50"
                  >
                    <Trophy className="w-4 h-4 text-accent" />
                    {loadingStats ? '加载中...' : '我的成绩'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      alert('设置功能即将上线，敬请期待！');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 font-bold text-left transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    设置
                  </button>
                  
                  <hr className="my-2 border-slate-100" />
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 font-bold text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </MotionDiv>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* User Stats Modal */}
      <AnimatePresence>
        {showStatsModal && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStatsModal(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white border-3 border-dark rounded-2xl shadow-neo w-full max-w-sm overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b-3 border-dark bg-accent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-dark" />
                  <h2 className="text-xl font-black text-dark">我的成绩</h2>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-2 hover:bg-black/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-dark" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Quiz Stats */}
                <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Headphones className="w-5 h-5 text-secondary" />
                    <span className="font-black text-lg">听音辨位</span>
                  </div>
                  {userStats?.quiz ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border-2 border-slate-200 text-center">
                        <p className="text-2xl font-black text-primary">{userStats.quiz.best_score}</p>
                        <p className="text-xs text-slate-500">最高分</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border-2 border-slate-200 text-center">
                        <p className="text-2xl font-black text-slate-600">{userStats.quiz.total_games}</p>
                        <p className="text-xs text-slate-500">游戏次数</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">暂无记录，快去挑战吧！</p>
                  )}
                </div>

                {/* Sing Stats */}
                <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-5 h-5 text-primary" />
                    <span className="font-black text-lg">哼唱闯关</span>
                  </div>
                  {userStats?.sing ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-3 rounded-lg border-2 border-slate-200 text-center">
                        <p className="text-xl font-black text-primary">{userStats.sing.best_score}</p>
                        <p className="text-xs text-slate-500">最高分</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border-2 border-slate-200 text-center">
                        <p className="text-xl font-black text-secondary">{userStats.sing.best_level}</p>
                        <p className="text-xs text-slate-500">最高关卡</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border-2 border-slate-200 text-center">
                        <p className="text-xl font-black text-slate-600">{userStats.sing.total_games}</p>
                        <p className="text-xs text-slate-500">游戏次数</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">暂无记录，快去挑战吧！</p>
                  )}
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
};
