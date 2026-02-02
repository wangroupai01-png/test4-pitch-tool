import { supabase } from '../lib/supabase';

// 联赛配置类型
export interface LeagueConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  promotion_rate: number;
  demotion_rate: number;
  xp_multiplier: number;
  weekly_bonus: number;
  sort_order: number;
}

// 联赛赛季类型
export interface LeagueSeason {
  id: string;
  season_number: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'ended';
}

// 用户联赛状态类型
export interface UserLeague {
  user_id: string;
  current_league: string;
  current_season_id: string | null;
  current_group_id: string | null;
  weekly_xp: number;
  rank_in_group: number | null;
  joined_at: string;
  updated_at: string;
}

// 组内排名类型
export interface GroupMember {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  weekly_xp: number;
  rank: number;
}

// 联赛历史类型
export interface LeagueHistory {
  id: string;
  user_id: string;
  season_id: string;
  league_id: string;
  final_rank: number | null;
  final_xp: number | null;
  result: 'promoted' | 'stayed' | 'demoted' | null;
  bonus_xp: number;
  created_at: string;
}

// 获取所有联赛配置
export const getLeagueConfigs = async (): Promise<LeagueConfig[]> => {
  const { data, error } = await supabase
    .from('league_config')
    .select('*')
    .order('sort_order');
  
  if (error) {
    console.error('[League] Error fetching configs:', error);
    return [];
  }
  
  return data || [];
};

// 获取当前活跃赛季
export const getCurrentSeason = async (): Promise<LeagueSeason | null> => {
  const { data, error } = await supabase
    .from('league_seasons')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('[League] Error fetching current season:', error);
    return null;
  }
  
  return data;
};

// 获取用户联赛状态
export const getUserLeague = async (userId: string): Promise<UserLeague | null> => {
  const { data, error } = await supabase
    .from('user_league')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('[League] Error fetching user league:', error);
    return null;
  }
  
  return data;
};

// 加入联赛
export const joinLeague = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('join_league', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('[League] Error joining league:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error('[League] Exception joining league:', err);
    return false;
  }
};

// 获取组内排名
export const getGroupRanking = async (groupId: string): Promise<GroupMember[]> => {
  const { data, error } = await supabase
    .from('user_league')
    .select(`
      user_id,
      weekly_xp,
      profiles:user_id (
        username,
        avatar_url
      )
    `)
    .eq('current_group_id', groupId)
    .order('weekly_xp', { ascending: false });
  
  if (error) {
    console.error('[League] Error fetching group ranking:', error);
    return [];
  }
  
  // 处理数据格式
  return (data || []).map((item: any, index: number) => ({
    user_id: item.user_id,
    username: item.profiles?.username || null,
    avatar_url: item.profiles?.avatar_url || null,
    weekly_xp: item.weekly_xp,
    rank: index + 1
  }));
};

// 增加用户周XP
export const addWeeklyXP = async (userId: string, xp: number): Promise<boolean> => {
  const { error } = await supabase
    .from('user_league')
    .update({ 
      weekly_xp: supabase.rpc('increment_weekly_xp', { amount: xp })
    })
    .eq('user_id', userId);
  
  if (error) {
    // 如果 RPC 不存在，使用简单的更新
    const { data: currentData } = await supabase
      .from('user_league')
      .select('weekly_xp')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (currentData) {
      const { error: updateError } = await supabase
        .from('user_league')
        .update({ weekly_xp: (currentData.weekly_xp || 0) + xp })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('[League] Error adding weekly XP:', updateError);
        return false;
      }
    }
  }
  
  return true;
};

// 获取用户联赛历史
export const getLeagueHistory = async (userId: string): Promise<LeagueHistory[]> => {
  const { data, error } = await supabase
    .from('league_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[League] Error fetching league history:', error);
    return [];
  }
  
  return data || [];
};

// 计算晋级/降级区域
export const calculateZones = (totalMembers: number, config: LeagueConfig) => {
  const promotionCount = Math.floor(totalMembers * config.promotion_rate);
  const demotionStart = totalMembers - Math.floor(totalMembers * config.demotion_rate) + 1;
  
  return {
    promotionZone: promotionCount, // 前 X 名晋级
    safeZone: { start: promotionCount + 1, end: demotionStart - 1 },
    demotionZone: { start: demotionStart, end: totalMembers } // 后 X 名降级
  };
};

// 获取赛季剩余时间
export const getSeasonRemainingTime = (endDate: string): { days: number; hours: number; minutes: number } => {
  const end = new Date(endDate + 'T23:59:59');
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
};

// 获取联赛显示信息
export const getLeagueDisplayInfo = (leagueId: string, configs: LeagueConfig[]) => {
  const config = configs.find(c => c.id === leagueId);
  if (!config) {
    return {
      name: '未知',
      icon: '❓',
      color: 'from-slate-400 to-slate-600'
    };
  }
  return {
    name: config.name,
    icon: config.icon,
    color: config.color
  };
};
