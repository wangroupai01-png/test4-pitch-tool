import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, ChevronRight, Crown, Medal, Zap, Flame } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Leaderboard } from '../components/game/Leaderboard';
import { useUserStore } from '../store/useUserStore';
import { LoginPrompt } from '../components/auth/LoginPrompt';

const MotionDiv = motion.div as any;

export const Compete = () => {
  const navigate = useNavigate();
  const { isGuest } = useUserStore();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginTrigger, setLoginTrigger] = useState<'leaderboard' | 'daily'>('leaderboard');

  // 处理需要登录的功能点击
  const handleGuestAction = (trigger: 'leaderboard' | 'daily') => {
    if (isGuest) {
      setLoginTrigger(trigger);
      setShowLoginPrompt(true);
    } else if (trigger === 'leaderboard') {
      setShowLeaderboard(true);
    } else if (trigger === 'daily') {
      navigate('/daily-challenge');
    }
  };

  // 每日挑战 - 根据星期几显示不同类型
  const getDailyChallenge = () => {
    const day = new Date().getDay();
    const challenges = [
      { type: '自由挑战', desc: '随机类型', icon: '🎲' },  // 周日
      { type: '听音辨位', desc: '10题单音识别', icon: '🎧' },  // 周一
      { type: '哼唱挑战', desc: '5个目标音', icon: '🎤' },  // 周二
      { type: '音程识别', desc: '10题音程题', icon: '🎵' },  // 周三
      { type: '混合挑战', desc: '听+唱混合', icon: '🎼' },  // 周四
      { type: '极速挑战', desc: '限时30秒', icon: '⚡' },  // 周五
      { type: '高难挑战', desc: '扩展音域', icon: '🔥' },  // 周六
    ];
    return challenges[day];
  };

  const dailyChallenge = getDailyChallenge();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header - Neo-Brutalism Style */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-white border-3 border-dark rounded-2xl shadow-neo p-6 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent rounded-full border-3 border-dark opacity-50" />
          <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-primary rounded-full border-3 border-dark opacity-30" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent rounded-xl border-3 border-dark shadow-neo-sm">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-dark">竞技场</h1>
            </div>
            <p className="text-slate-500 font-bold">挑战自我，与全服玩家一较高下 🏆</p>
          </div>
        </div>
      </MotionDiv>

      {/* Daily Challenge */}
      <MotionDiv
        initial={{ opacity: 0, y: 20, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
      >
        <Card className="!p-0 overflow-hidden mb-6 !border-accent relative">
          <div className="bg-gradient-to-r from-accent to-orange-400 p-5 text-white border-b-3 border-dark">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg border border-white/30">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="font-black text-xl tracking-wide">每日挑战</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-black/20 px-4 py-1.5 rounded-full text-sm font-bold border border-white/10 backdrop-blur-sm">
                  {new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}
                </span>
                <MotionDiv
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-xl border border-white/30 shadow-sm"
                >
                  <Flame className="w-5 h-5" />
                </MotionDiv>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-5">
              <MotionDiv 
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="w-24 h-24 rounded-2xl bg-accent/10 flex items-center justify-center text-5xl border-3 border-dark shadow-neo-sm shrink-0"
              >
                {dailyChallenge.icon}
              </MotionDiv>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-2xl text-dark truncate">{dailyChallenge.type}</h3>
                <p className="text-slate-500 font-bold mt-2 text-lg">{dailyChallenge.desc}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                className="w-full py-4 text-lg shadow-neo hover:shadow-neo-lg transition-all active:translate-y-1 active:shadow-none"
                onClick={() => handleGuestAction('daily')}
              >
                <Zap className="w-6 h-6 mr-2" />
                开始挑战
              </Button>
            </div>
            
            {/* Rewards Preview */}
            <div className="mt-5 pt-5 border-t-3 border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                完成奖励
              </span>
              <div className="flex items-center gap-3">
                <span className="font-black text-primary bg-primary/10 px-3 py-1 rounded-full border-2 border-primary/30">+50 XP</span>
                <span className="font-black text-accent bg-accent/10 px-3 py-1 rounded-full border-2 border-accent/30">前10名 ×2</span>
              </div>
            </div>
          </div>
        </Card>
      </MotionDiv>

      {/* Leaderboard Entry */}
      <MotionDiv
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className="!p-5 flex items-center gap-4 cursor-pointer hover:shadow-neo-lg transition-all mb-4"
          onClick={() => handleGuestAction('leaderboard')}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-3 border-dark shadow-neo-sm">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-xl text-dark">排行榜</h3>
            <p className="text-sm text-slate-500 font-bold">查看全服玩家排名</p>
          </div>
          <div className="p-2 bg-slate-100 rounded-xl border-2 border-dark">
            <ChevronRight className="w-5 h-5 text-dark" />
          </div>
        </Card>
      </MotionDiv>

      {/* League Preview (Coming Soon) */}
      <MotionDiv
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <Card className="!p-5 opacity-70 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center border-3 border-dark">
              <Medal className="w-7 h-7 text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-xl text-dark flex items-center gap-2">
                联赛系统
                <span className="text-xs bg-slate-200 text-slate-500 px-2 py-1 rounded-full font-bold border border-slate-300">即将上线</span>
              </h3>
              <p className="text-sm text-slate-500 font-bold">周赛竞技，晋级挑战</p>
            </div>
          </div>
          
          {/* League Tiers Preview */}
          <div className="mt-5 flex justify-center gap-3">
            {['🥉', '🥈', '🥇', '💎', '👑', '🏆'].map((icon, i) => (
              <MotionDiv 
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-xl border-2 border-dark shadow-neo-sm"
              >
                {icon}
              </MotionDiv>
            ))}
          </div>
        </Card>
      </MotionDiv>

      {/* Friend PK (Coming Soon) */}
      <MotionDiv
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="!p-5 opacity-70 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center border-3 border-dark">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-xl text-dark flex items-center gap-2">
                好友PK
                <span className="text-xs bg-slate-200 text-slate-500 px-2 py-1 rounded-full font-bold border border-slate-300">即将上线</span>
              </h3>
              <p className="text-sm text-slate-500 font-bold">邀请好友一起挑战</p>
            </div>
          </div>
        </Card>
      </MotionDiv>

      {/* Leaderboard Modal */}
      <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      
      {/* 游客登录引导 */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        trigger={loginTrigger}
      />
    </div>
  );
};
