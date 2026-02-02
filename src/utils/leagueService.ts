import { supabase } from '../lib/supabase';

// 联赛配置类型
export interface LeagueConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  required_xp: number;
  xp_multiplier: number;
  sort_order: number;
}

// 用户联赛状态类型
export interface UserLeague {
  user_id: string;
  current_league: string;
  total_xp: number;
  joined_at: string;
  updated_at: string;
}

// 排行榜用户类型
export interface LeaderboardUser {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_league: string;
  rank: number;
}

// 默认联赛配置（前端备用）
export const DEFAULT_LEAGUE_CONFIGS: LeagueConfig[] = [
  { id: 'bronze', name: '青铜', icon: '🥉', color: 'from-amber-600 to-amber-800', required_xp: 0, xp_multiplier: 1.0, sort_order: 1 },
  { id: 'silver', name: '白银', icon: '🥈', color: 'from-slate-300 to-slate-500', required_xp: 500, xp_multiplier: 1.1, sort_order: 2 },
  { id: 'gold', name: '黄金', icon: '🥇', color: 'from-yellow-400 to-amber-500', required_xp: 2000, xp_multiplier: 1.2, sort_order: 3 },
  { id: 'diamond', name: '钻石', icon: '💎', color: 'from-cyan-300 to-blue-500', required_xp: 5000, xp_multiplier: 1.3, sort_order: 4 },
  { id: 'master', name: '大师', icon: '👑', color: 'from-purple-400 to-indigo-600', required_xp: 15000, xp_multiplier: 1.5, sort_order: 5 },
  { id: 'legend', name: '传奇', icon: '🏆', color: 'from-amber-300 via-yellow-400 to-amber-500', required_xp: 50000, xp_multiplier: 2.0, sort_order: 6 },
];

// 获取所有联赛配置
export const getLeagueConfigs = async (): Promise<LeagueConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('league_config')
      .select('*')
      .order('sort_order');
    
    if (error) {
      console.error('[League] Error fetching configs:', error);
      return DEFAULT_LEAGUE_CONFIGS;
    }
    
    return data && data.length > 0 ? data : DEFAULT_LEAGUE_CONFIGS;
  } catch (err) {
    console.error('[League] Exception fetching configs:', err);
    return DEFAULT_LEAGUE_CONFIGS;
  }
};

// 根据XP计算联赛等级
export const calculateLeagueForXP = (totalXP: number, configs: LeagueConfig[]): LeagueConfig => {
  // 按 required_xp 降序排序，找到第一个满足条件的
  const sorted = [...configs].sort((a, b) => b.required_xp - a.required_xp);
  return sorted.find(c => totalXP >= c.required_xp) || configs[0];
};

// 获取用户联赛状态（优先从 profiles 获取 XP）
export const getUserLeagueStatus = async (userId: string): Promise<{
  league: LeagueConfig;
  totalXP: number;
  nextLeague: LeagueConfig | null;
  xpToNext: number;
  progress: number;
}> => {
  const configs = await getLeagueConfigs();
  
  // 从 profiles 获取用户 XP
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', userId)
    .maybeSingle();
  
  const totalXP = profile?.total_xp || 0;
  const currentLeague = calculateLeagueForXP(totalXP, configs);
  
  // 找到下一个联赛
  const nextLeagueIndex = configs.findIndex(c => c.id === currentLeague.id) + 1;
  const nextLeague = nextLeagueIndex < configs.length ? configs[nextLeagueIndex] : null;
  
  // 计算到下一级的进度
  const xpToNext = nextLeague ? nextLeague.required_xp - totalXP : 0;
  const currentXPInLevel = totalXP - currentLeague.required_xp;
  const xpNeededForLevel = nextLeague ? nextLeague.required_xp - currentLeague.required_xp : 1;
  const progress = nextLeague ? Math.min(100, (currentXPInLevel / xpNeededForLevel) * 100) : 100;
  
  return {
    league: currentLeague,
    totalXP,
    nextLeague,
    xpToNext,
    progress
  };
};

// 获取全服排行榜（基于 profiles.total_xp）
export const getGlobalLeaderboard = async (limit: number = 20): Promise<LeaderboardUser[]> => {
  const configs = await getLeagueConfigs();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, total_xp')
    .order('total_xp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[League] Error fetching leaderboard:', error);
    return [];
  }
  
  return (data || []).map((user, index) => ({
    user_id: user.id,
    username: user.username,
    avatar_url: user.avatar_url,
    total_xp: user.total_xp || 0,
    current_league: calculateLeagueForXP(user.total_xp || 0, configs).id,
    rank: index + 1
  }));
};

// 获取用户在排行榜中的排名
export const getUserRank = async (userId: string): Promise<number> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', userId)
    .maybeSingle();
  
  if (!profile) return 0;
  
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('total_xp', profile.total_xp || 0);
  
  return (count || 0) + 1;
};

// 获取联赛显示信息
export const getLeagueDisplayInfo = (leagueId: string, configs: LeagueConfig[]) => {
  const config = configs.find(c => c.id === leagueId);
  if (!config) {
    return DEFAULT_LEAGUE_CONFIGS[0];
  }
  return config;
};
