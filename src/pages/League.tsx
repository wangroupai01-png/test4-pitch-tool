import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, ChevronUp, Zap, Crown, Medal, Star, TrendingUp, Target } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/useUserStore';
import {
  getLeagueConfigs,
  getUserLeagueStatus,
  getGlobalLeaderboard,
  getUserRank,
  type LeagueConfig,
  type LeaderboardUser
} from '../utils/leagueService';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

// 预设头像
const PRESET_AVATARS: Record<number, { emoji: string; bg: string }> = {
  1: { emoji: '🎵', bg: 'from-primary to-secondary' },
  2: { emoji: '🎸', bg: 'from-red-500 to-orange-500' },
  3: { emoji: '🎹', bg: 'from-slate-700 to-slate-900' },
  4: { emoji: '🎤', bg: 'from-pink-500 to-rose-500' },
  5: { emoji: '🎺', bg: 'from-yellow-400 to-amber-500' },
};

export const League = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useUserStore();
  
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<LeagueConfig[]>([]);
  const [userStatus, setUserStatus] = useState<{
    league: LeagueConfig;
    totalXP: number;
    nextLeague: LeagueConfig | null;
    xpToNext: number;
    progress: number;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // 并行加载配置和排行榜
      const [configsData, leaderboardData] = await Promise.all([
        getLeagueConfigs(),
        getGlobalLeaderboard(20)
      ]);
      
      setConfigs(configsData);
      setLeaderboard(leaderboardData);
      
      // 如果用户已登录，加载用户状态
      if (user) {
        const [status, rank] = await Promise.all([
          getUserLeagueStatus(user.id),
          getUserRank(user.id)
        ]);
        setUserStatus(status);
        setUserRank(rank);
      }
    } catch (err) {
      console.error('[League] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 渲染头像
  const renderAvatar = (avatarUrl: string | null, username: string | null, size: string = 'w-10 h-10') => {
    if (avatarUrl?.startsWith('preset:')) {
      const presetId = parseInt(avatarUrl.replace('preset:', ''));
      const preset = PRESET_AVATARS[presetId];
      if (preset) {
        return (
          <div className={`${size} rounded-xl overflow-hidden border-2 border-dark`}>
            <div className={`w-full h-full bg-gradient-to-br ${preset.bg} flex items-center justify-center`}>
              <span className="text-lg">{preset.emoji}</span>
            </div>
          </div>
        );
      }
    }
    
    if (avatarUrl && !avatarUrl.startsWith('preset:')) {
      return (
        <div className={`${size} rounded-xl overflow-hidden border-2 border-dark`}>
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    
    return (
      <div className={`${size} rounded-xl overflow-hidden border-2 border-dark`}>
        <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <span className="text-sm font-bold text-white">{username?.charAt(0) || '?'}</span>
        </div>
      </div>
    );
  };

  // 获取联赛配置
  const getLeagueConfig = (leagueId: string) => {
    return configs.find(c => c.id === leagueId) || configs[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg pattern-grid-lg flex items-center justify-center">
        <MotionDiv
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // 游客提示
  if (isGuest) {
    return (
      <div className="min-h-screen bg-light-bg pattern-grid-lg">
        <header className="p-4 flex items-center gap-4 bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
          <MotionButton 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-100 rounded-xl border-2 border-dark"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </MotionButton>
          <h1 className="text-xl font-black text-dark">成长等级</h1>
        </header>
        
        <div className="p-4 max-w-2xl mx-auto">
          <Card className="!p-8 text-center">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black text-dark mb-2">登录后查看等级</h2>
            <p className="text-slate-500 mb-6">学习获得 XP，提升你的等级！</p>
            <Button onClick={() => navigate('/profile')}>
              去登录
            </Button>
          </Card>
          
          {/* 联赛等级预览 */}
          <div className="mt-6">
            <h3 className="font-black text-lg text-dark mb-4 text-center">等级一览</h3>
            <div className="space-y-3">
              {configs.map((config, index) => (
                <MotionDiv
                  key={config.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="!p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${config.color} border-2 border-dark shadow-neo-sm`}>
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-dark">{config.name}</div>
                      <div className="text-sm text-slate-500">
                        {config.required_xp === 0 ? '起始等级' : `${config.required_xp.toLocaleString()} XP`}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-primary">
                      ×{config.xp_multiplier}
                    </div>
                  </Card>
                </MotionDiv>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg pb-6">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
        <MotionButton 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-slate-100 rounded-xl border-2 border-dark"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5 text-dark" />
        </MotionButton>
        <h1 className="text-xl font-black text-dark">成长等级</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* 当前等级卡片 */}
        {userStatus && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="!p-0 overflow-hidden">
              <div className={`bg-gradient-to-r ${userStatus.league.color} p-6 text-white`}>
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{userStatus.league.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black">{userStatus.league.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Zap className="w-4 h-4" />
                      <span className="font-bold">{userStatus.totalXP.toLocaleString()} XP</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/80">全服排名</div>
                    <div className="text-3xl font-black">#{userRank || '?'}</div>
                  </div>
                </div>
              </div>
              
              {/* 晋级进度 */}
              {userStatus.nextLeague && (
                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        距离 {userStatus.nextLeague.icon} {userStatus.nextLeague.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      还需 {userStatus.xpToNext.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <MotionDiv
                      initial={{ width: 0 }}
                      animate={{ width: `${userStatus.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${userStatus.nextLeague.color}`}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-400 text-center">
                    晋级后 XP 加成 ×{userStatus.nextLeague.xp_multiplier}
                  </div>
                </div>
              )}
              
              {/* 已满级 */}
              {!userStatus.nextLeague && (
                <div className="p-4 bg-white text-center">
                  <div className="flex items-center justify-center gap-2 text-secondary">
                    <Crown className="w-5 h-5" />
                    <span className="font-bold">已达最高等级！</span>
                  </div>
                </div>
              )}
            </Card>
          </MotionDiv>
        )}

        {/* 全服排行榜 */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="!p-0 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b-2 border-dark flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-dark" />
              <span className="font-black text-dark">全服排行榜</span>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {leaderboard.map((member, index) => {
                const rank = index + 1;
                const isCurrentUser = member.user_id === user?.id;
                const leagueConfig = getLeagueConfig(member.current_league);
                
                return (
                  <MotionDiv
                    key={member.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-4 flex items-center gap-3 ${isCurrentUser ? 'bg-primary/10' : ''}`}
                  >
                    {/* 排名 */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm
                      ${rank === 1 ? 'bg-yellow-400 text-dark' : 
                        rank === 2 ? 'bg-slate-300 text-dark' : 
                        rank === 3 ? 'bg-amber-600 text-white' :
                        'bg-slate-100 text-dark'}
                    `}>
                      {rank <= 3 ? (
                        rank === 1 ? <Crown className="w-4 h-4" /> :
                        rank === 2 ? <Medal className="w-4 h-4" /> :
                        <Star className="w-4 h-4" />
                      ) : rank}
                    </div>
                    
                    {/* 头像 */}
                    {renderAvatar(member.avatar_url, member.username, 'w-10 h-10')}
                    
                    {/* 用户信息 */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold truncate ${isCurrentUser ? 'text-primary' : 'text-dark'}`}>
                        {member.username || '匿名用户'}
                        {isCurrentUser && <span className="text-xs ml-1">(你)</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>{leagueConfig.icon}</span>
                        <span>{leagueConfig.name}</span>
                      </div>
                    </div>
                    
                    {/* XP */}
                    <div className="flex items-center gap-1 font-black text-primary">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm">{member.total_xp.toLocaleString()}</span>
                    </div>
                  </MotionDiv>
                );
              })}
              
              {leaderboard.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  暂无排名数据，快去学习获得 XP 吧！
                </div>
              )}
            </div>
          </Card>
        </MotionDiv>

        {/* 等级说明 */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="!p-5">
            <h3 className="font-black text-lg text-dark mb-4 flex items-center gap-2">
              <ChevronUp className="w-5 h-5 text-primary" />
              等级晋升
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              通过学习课程获得 XP，累计达到对应 XP 自动晋级！
            </p>
            <div className="space-y-2">
              {configs.map((config, index) => {
                const isCurrentLeague = userStatus?.league.id === config.id;
                const isUnlocked = userStatus ? userStatus.totalXP >= config.required_xp : false;
                
                return (
                  <MotionDiv
                    key={config.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border-2
                      ${isCurrentLeague ? 'border-primary bg-primary/10' : 
                        isUnlocked ? 'border-secondary/50 bg-secondary/5' :
                        'border-slate-200'}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center text-xl
                      bg-gradient-to-br ${config.color} border-2 border-dark shadow-neo-sm
                      ${!isUnlocked && !isCurrentLeague ? 'opacity-50' : ''}
                    `}>
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-dark text-sm">{config.name}</div>
                      <div className="text-xs text-slate-500">
                        {config.required_xp === 0 ? '起始等级' : `${config.required_xp.toLocaleString()} XP`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">XP 加成</div>
                      <div className="text-sm font-bold text-primary">×{config.xp_multiplier}</div>
                    </div>
                    {isCurrentLeague && (
                      <div className="px-2 py-1 bg-primary text-white text-xs font-bold rounded-full">
                        当前
                      </div>
                    )}
                  </MotionDiv>
                );
              })}
            </div>
          </Card>
        </MotionDiv>

        {/* 去学习按钮 */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            className="w-full"
            onClick={() => navigate('/learn')}
          >
            去学习赚取 XP
          </Button>
        </MotionDiv>
      </div>
    </div>
  );
};
