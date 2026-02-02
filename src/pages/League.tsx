import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Clock, ChevronUp, ChevronDown, Minus, Users, Zap, Crown, Medal, Star } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/useUserStore';
import {
  getLeagueConfigs,
  getCurrentSeason,
  getUserLeague,
  joinLeague,
  getGroupRanking,
  calculateZones,
  getSeasonRemainingTime,
  type LeagueConfig,
  type LeagueSeason,
  type UserLeague,
  type GroupMember
} from '../utils/leagueService';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

// 预设头像（与其他页面保持一致）
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
  const [joining, setJoining] = useState(false);
  const [configs, setConfigs] = useState<LeagueConfig[]>([]);
  const [season, setSeason] = useState<LeagueSeason | null>(null);
  const [userLeague, setUserLeague] = useState<UserLeague | null>(null);
  const [groupRanking, setGroupRanking] = useState<GroupMember[]>([]);
  const [remainingTime, setRemainingTime] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    loadData();
  }, [user]);

  // 更新倒计时
  useEffect(() => {
    if (!season) return;
    
    const updateTime = () => {
      setRemainingTime(getSeasonRemainingTime(season.end_date));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // 每分钟更新
    
    return () => clearInterval(interval);
  }, [season]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // 并行加载配置和赛季
      const [configsData, seasonData] = await Promise.all([
        getLeagueConfigs(),
        getCurrentSeason()
      ]);
      
      setConfigs(configsData);
      setSeason(seasonData);
      
      // 如果用户已登录，加载用户联赛状态
      if (user) {
        const userLeagueData = await getUserLeague(user.id);
        setUserLeague(userLeagueData);
        
        // 如果用户已加入联赛，加载组内排名
        if (userLeagueData?.current_group_id) {
          const ranking = await getGroupRanking(userLeagueData.current_group_id);
          setGroupRanking(ranking);
        }
      }
    } catch (err) {
      console.error('[League] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeague = async () => {
    if (!user) return;
    
    setJoining(true);
    const success = await joinLeague(user.id);
    
    if (success) {
      await loadData(); // 重新加载数据
    }
    
    setJoining(false);
  };

  // 获取当前联赛配置
  const currentConfig = configs.find(c => c.id === userLeague?.current_league);
  
  // 计算晋级/降级区域
  const zones = currentConfig 
    ? calculateZones(groupRanking.length, currentConfig)
    : null;

  // 获取用户在排名中的位置
  const userRankIndex = groupRanking.findIndex(m => m.user_id === user?.id);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null;

  // 判断用户状态
  const getUserStatus = () => {
    if (!userRank || !zones) return null;
    if (userRank <= zones.promotionZone) return 'promotion';
    if (userRank >= zones.demotionZone.start) return 'demotion';
    return 'safe';
  };

  const userStatus = getUserStatus();

  // 渲染头像
  const renderAvatar = (avatarUrl: string | null, username: string | null) => {
    if (avatarUrl?.startsWith('preset:')) {
      const presetId = parseInt(avatarUrl.replace('preset:', ''));
      const preset = PRESET_AVATARS[presetId];
      if (preset) {
        return (
          <div className={`w-full h-full bg-gradient-to-br ${preset.bg} flex items-center justify-center`}>
            <span className="text-lg">{preset.emoji}</span>
          </div>
        );
      }
    }
    
    if (avatarUrl && !avatarUrl.startsWith('preset:')) {
      return <img src={avatarUrl} alt="" className="w-full h-full object-cover" />;
    }
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <span className="text-sm font-bold text-white">{username?.charAt(0) || '?'}</span>
      </div>
    );
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
          <h1 className="text-xl font-black text-dark">联赛系统</h1>
        </header>
        
        <div className="p-4 max-w-2xl mx-auto">
          <Card className="!p-8 text-center">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black text-dark mb-2">登录后参与联赛</h2>
            <p className="text-slate-500 mb-6">每周与全服玩家一较高下，晋级更高联赛！</p>
            <Button onClick={() => navigate('/profile')}>
              去登录
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg">
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
        <h1 className="text-xl font-black text-dark">联赛系统</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* 当前联赛状态 */}
        {userLeague && currentConfig ? (
          <>
            {/* 联赛卡片 */}
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`!p-0 overflow-hidden !border-2`}>
                <div className={`bg-gradient-to-r ${currentConfig.color} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{currentConfig.icon}</div>
                      <div>
                        <h2 className="text-2xl font-black">{currentConfig.name}</h2>
                        <p className="text-white/80 font-bold">第 {season?.season_number || 1} 赛季</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black">{userLeague.weekly_xp}</div>
                      <div className="text-white/80 font-bold">本周 XP</div>
                    </div>
                  </div>
                  
                  {/* 倒计时 */}
                  <div className="mt-4 flex items-center gap-2 bg-white/20 rounded-xl p-3">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold">
                      赛季剩余: {remainingTime.days}天 {remainingTime.hours}小时 {remainingTime.minutes}分
                    </span>
                  </div>
                </div>
                
                {/* 用户状态 */}
                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl
                        ${userStatus === 'promotion' ? 'bg-secondary text-white' : 
                          userStatus === 'demotion' ? 'bg-red-500 text-white' : 
                          'bg-slate-200 text-dark'}
                      `}>
                        #{userRank || '?'}
                      </div>
                      <div>
                        <div className="font-black text-dark">
                          {userStatus === 'promotion' ? '晋级区' : 
                           userStatus === 'demotion' ? '降级区' : 
                           '安全区'}
                        </div>
                        <div className="text-sm text-slate-500">
                          {userStatus === 'promotion' ? (
                            <span className="text-secondary flex items-center gap-1">
                              <ChevronUp className="w-4 h-4" /> 有望晋级
                            </span>
                          ) : userStatus === 'demotion' ? (
                            <span className="text-red-500 flex items-center gap-1">
                              <ChevronDown className="w-4 h-4" /> 需要努力
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Minus className="w-4 h-4" /> 保持排名
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500">XP 加成</div>
                      <div className="font-black text-primary">×{currentConfig.xp_multiplier}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </MotionDiv>

            {/* 组内排名 */}
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="!p-0 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b-2 border-dark flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-dark" />
                    <span className="font-black text-dark">小组排名</span>
                  </div>
                  <span className="text-sm text-slate-500">{groupRanking.length} 名选手</span>
                </div>
                
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {groupRanking.map((member, index) => {
                    const rank = index + 1;
                    const isPromotion = zones && rank <= zones.promotionZone;
                    const isDemotion = zones && rank >= zones.demotionZone.start;
                    const isCurrentUser = member.user_id === user?.id;
                    
                    return (
                      <MotionDiv
                        key={member.user_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`
                          p-4 flex items-center gap-4
                          ${isCurrentUser ? 'bg-primary/10' : ''}
                          ${isPromotion ? 'border-l-4 border-secondary' : 
                            isDemotion ? 'border-l-4 border-red-500' : ''}
                        `}
                      >
                        {/* 排名 */}
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center font-black
                          ${rank === 1 ? 'bg-yellow-400 text-dark' : 
                            rank === 2 ? 'bg-slate-300 text-dark' : 
                            rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-slate-100 text-dark'}
                        `}>
                          {rank <= 3 ? (
                            rank === 1 ? <Crown className="w-5 h-5" /> :
                            rank === 2 ? <Medal className="w-5 h-5" /> :
                            <Star className="w-5 h-5" />
                          ) : rank}
                        </div>
                        
                        {/* 头像 */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-dark">
                          {renderAvatar(member.avatar_url, member.username)}
                        </div>
                        
                        {/* 用户名 */}
                        <div className="flex-1">
                          <div className={`font-bold ${isCurrentUser ? 'text-primary' : 'text-dark'}`}>
                            {member.username || '匿名用户'}
                            {isCurrentUser && <span className="text-xs ml-1">(你)</span>}
                          </div>
                        </div>
                        
                        {/* XP */}
                        <div className="flex items-center gap-1 font-black text-primary">
                          <Zap className="w-4 h-4" />
                          {member.weekly_xp}
                        </div>
                      </MotionDiv>
                    );
                  })}
                  
                  {groupRanking.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      暂无排名数据
                    </div>
                  )}
                </div>
                
                {/* 图例 */}
                {zones && groupRanking.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t-2 border-dark flex items-center justify-center gap-6 text-sm">
                    {zones.promotionZone > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-secondary rounded" />
                        <span>晋级区 (前{zones.promotionZone}名)</span>
                      </div>
                    )}
                    {zones.demotionZone.start <= groupRanking.length && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span>降级区 (后{groupRanking.length - zones.demotionZone.start + 1}名)</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </MotionDiv>
          </>
        ) : (
          /* 未加入联赛 */
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="!p-8 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-black text-dark mb-2">加入联赛系统</h2>
              <p className="text-slate-500 mb-6">
                每周与全服玩家同台竞技，通过学习获得 XP，争取晋级更高联赛！
              </p>
              
              {/* 联赛等级预览 */}
              <div className="flex justify-center gap-2 mb-6">
                {configs.slice(0, 6).map((config, i) => (
                  <MotionDiv
                    key={config.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white border-2 border-dark shadow-neo-sm"
                  >
                    {config.icon}
                  </MotionDiv>
                ))}
              </div>
              
              <Button
                onClick={handleJoinLeague}
                disabled={joining}
                className="w-full"
              >
                {joining ? '加入中...' : '立即加入'}
              </Button>
            </Card>
          </MotionDiv>
        )}

        {/* 联赛等级说明 */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="!p-5">
            <h3 className="font-black text-lg text-dark mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              联赛等级
            </h3>
            <div className="space-y-3">
              {configs.map((config, index) => (
                <MotionDiv
                  key={config.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border-2
                    ${userLeague?.current_league === config.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-slate-200'}
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                    bg-gradient-to-br ${config.color} border-2 border-dark shadow-neo-sm
                  `}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-dark">{config.name}</div>
                    <div className="text-xs text-slate-500">
                      XP ×{config.xp_multiplier} · 周奖励 {config.weekly_bonus} XP
                    </div>
                  </div>
                  {userLeague?.current_league === config.id && (
                    <div className="px-2 py-1 bg-primary text-white text-xs font-bold rounded-full">
                      当前
                    </div>
                  )}
                </MotionDiv>
              ))}
            </div>
          </Card>
        </MotionDiv>
      </div>
    </div>
  );
};
