import { supabase } from '../lib/supabase';

// 好友关系类型
export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
}

// 好友信息类型（包含用户资料）
export interface FriendInfo {
  friendship_id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_level: number;
  status: 'pending' | 'accepted';
  is_online?: boolean;
  last_active?: string;
}

// PK 挑战类型
export interface FriendChallenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  challenge_type: 'quiz' | 'sing';
  difficulty: 'easy' | 'normal' | 'hard';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'expired' | 'declined';
  challenger_score: number | null;
  opponent_score: number | null;
  winner_id: string | null;
  questions: any;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  // 扩展字段
  challenger?: { username: string | null; avatar_url: string | null };
  opponent?: { username: string | null; avatar_url: string | null };
}

// 搜索用户结果
export interface UserSearchResult {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_xp: number;
  friendship_status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
}

// ============ 好友管理 ============

// 搜索用户（按用户名）
export const searchUsers = async (query: string, currentUserId: string): Promise<UserSearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    // 搜索用户
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, total_xp')
      .ilike('username', `%${query}%`)
      .neq('id', currentUserId)
      .limit(20);
    
    if (error || !users) {
      console.error('[Friends] Search error:', error);
      return [];
    }
    
    // 获取当前用户的好友关系
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);
    
    // 映射好友状态
    return users.map(user => {
      let friendship_status: UserSearchResult['friendship_status'] = 'none';
      
      const friendship = friendships?.find(f => 
        (f.user_id === currentUserId && f.friend_id === user.id) ||
        (f.friend_id === currentUserId && f.user_id === user.id)
      );
      
      if (friendship) {
        if (friendship.status === 'accepted') {
          friendship_status = 'accepted';
        } else if (friendship.status === 'blocked') {
          friendship_status = 'blocked';
        } else if (friendship.status === 'pending') {
          friendship_status = friendship.user_id === currentUserId ? 'pending_sent' : 'pending_received';
        }
      }
      
      return {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        total_xp: user.total_xp || 0,
        friendship_status
      };
    });
  } catch (err) {
    console.error('[Friends] Search exception:', err);
    return [];
  }
};

// 发送好友请求
export const sendFriendRequest = async (userId: string, friendId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // 检查是否已有关系
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .maybeSingle();
    
    if (existing) {
      if (existing.status === 'accepted') {
        return { success: false, error: '你们已经是好友了' };
      }
      if (existing.status === 'pending') {
        return { success: false, error: '已有待处理的好友请求' };
      }
      if (existing.status === 'blocked') {
        return { success: false, error: '无法添加此用户' };
      }
    }
    
    // 创建好友请求
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      });
    
    if (error) {
      console.error('[Friends] Send request error:', error);
      return { success: false, error: '发送请求失败' };
    }
    
    return { success: true };
  } catch (err) {
    console.error('[Friends] Send request exception:', err);
    return { success: false, error: '发送请求失败' };
  }
};

// 接受好友请求
export const acceptFriendRequest = async (friendshipId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
    
    if (error) {
      console.error('[Friends] Accept error:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('[Friends] Accept exception:', err);
    return false;
  }
};

// 拒绝/删除好友请求
export const rejectFriendRequest = async (friendshipId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    
    if (error) {
      console.error('[Friends] Reject error:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('[Friends] Reject exception:', err);
    return false;
  }
};

// 删除好友
export const removeFriend = async (friendshipId: string): Promise<boolean> => {
  return rejectFriendRequest(friendshipId);
};

// 获取好友列表
export const getFriendList = async (userId: string): Promise<FriendInfo[]> => {
  try {
    // 获取所有已接受的好友关系
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
    
    if (error || !friendships) {
      console.error('[Friends] Get list error:', error);
      return [];
    }
    
    // 获取好友的用户ID
    const friendIds = friendships.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
    );
    
    if (friendIds.length === 0) return [];
    
    // 获取好友的资料和XP信息
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, total_xp')
      .in('id', friendIds);
    
    const { data: xpData } = await supabase
      .from('user_xp')
      .select('user_id, current_level')
      .in('user_id', friendIds);
    
    // 组合数据
    return friendships.map(f => {
      const friendId = f.user_id === userId ? f.friend_id : f.user_id;
      const profile = profiles?.find(p => p.id === friendId);
      const xp = xpData?.find(x => x.user_id === friendId);
      
      return {
        friendship_id: f.id,
        user_id: friendId,
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null,
        total_xp: profile?.total_xp || 0,
        current_level: xp?.current_level || 1,
        status: 'accepted' as const
      };
    }).sort((a, b) => b.total_xp - a.total_xp); // 按XP排序
  } catch (err) {
    console.error('[Friends] Get list exception:', err);
    return [];
  }
};

// 获取待处理的好友请求
export const getPendingRequests = async (userId: string): Promise<FriendInfo[]> => {
  try {
    // 获取收到的待处理请求
    const { data: requests, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    if (error || !requests) {
      console.error('[Friends] Get requests error:', error);
      return [];
    }
    
    if (requests.length === 0) return [];
    
    // 获取请求者的资料
    const requesterIds = requests.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, total_xp')
      .in('id', requesterIds);
    
    return requests.map(r => {
      const profile = profiles?.find(p => p.id === r.user_id);
      
      return {
        friendship_id: r.id,
        user_id: r.user_id,
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null,
        total_xp: profile?.total_xp || 0,
        current_level: 1,
        status: 'pending' as const
      };
    });
  } catch (err) {
    console.error('[Friends] Get requests exception:', err);
    return [];
  }
};

// ============ 好友 PK ============

// 生成 PK 题目
const generatePKQuestions = (difficulty: string, count: number = 10) => {
  const questions = [];
  let minMidi = 60, maxMidi = 72;
  
  if (difficulty === 'easy') {
    minMidi = 60; maxMidi = 67; // C4-G4
  } else if (difficulty === 'hard') {
    minMidi = 48; maxMidi = 84; // C3-C6
  }
  
  for (let i = 0; i < count; i++) {
    const targetMidi = Math.floor(Math.random() * (maxMidi - minMidi + 1)) + minMidi;
    // 生成干扰选项
    const options = [targetMidi];
    while (options.length < 4) {
      const opt = Math.floor(Math.random() * (maxMidi - minMidi + 1)) + minMidi;
      if (!options.includes(opt)) {
        options.push(opt);
      }
    }
    // 打乱选项顺序
    options.sort(() => Math.random() - 0.5);
    
    questions.push({
      type: 'identify',
      targetMidi,
      options
    });
  }
  
  return questions;
};

// 发起 PK 挑战
export const createChallenge = async (
  challengerId: string,
  opponentId: string,
  challengeType: 'quiz' | 'sing' = 'quiz',
  difficulty: 'easy' | 'normal' | 'hard' = 'normal'
): Promise<{ success: boolean; challengeId?: string; error?: string }> => {
  try {
    // 检查是否是好友
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`and(user_id.eq.${challengerId},friend_id.eq.${opponentId}),and(user_id.eq.${opponentId},friend_id.eq.${challengerId})`)
      .maybeSingle();
    
    if (!friendship) {
      return { success: false, error: '只能向好友发起挑战' };
    }
    
    // 检查是否有未完成的挑战
    const { data: existingChallenge } = await supabase
      .from('friend_challenges')
      .select('*')
      .or(`and(challenger_id.eq.${challengerId},opponent_id.eq.${opponentId}),and(challenger_id.eq.${opponentId},opponent_id.eq.${challengerId})`)
      .in('status', ['pending', 'accepted', 'in_progress'])
      .maybeSingle();
    
    if (existingChallenge) {
      return { success: false, error: '已有进行中的挑战' };
    }
    
    // 生成题目
    const questions = generatePKQuestions(difficulty);
    
    // 创建挑战
    const { data, error } = await supabase
      .from('friend_challenges')
      .insert({
        challenger_id: challengerId,
        opponent_id: opponentId,
        challenge_type: challengeType,
        difficulty,
        status: 'pending',
        questions,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后过期
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Friends] Create challenge error:', error);
      return { success: false, error: '创建挑战失败' };
    }
    
    return { success: true, challengeId: data.id };
  } catch (err) {
    console.error('[Friends] Create challenge exception:', err);
    return { success: false, error: '创建挑战失败' };
  }
};

// 接受挑战
export const acceptChallenge = async (challengeId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friend_challenges')
      .update({ status: 'accepted' })
      .eq('id', challengeId);
    
    return !error;
  } catch (err) {
    console.error('[Friends] Accept challenge error:', err);
    return false;
  }
};

// 拒绝挑战
export const declineChallenge = async (challengeId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friend_challenges')
      .update({ status: 'declined' })
      .eq('id', challengeId);
    
    return !error;
  } catch (err) {
    console.error('[Friends] Decline challenge error:', err);
    return false;
  }
};

// 提交 PK 成绩
export const submitChallengeScore = async (
  challengeId: string,
  userId: string,
  score: number
): Promise<{ success: boolean; completed?: boolean; winnerId?: string }> => {
  try {
    // 获取挑战信息
    const { data: challenge, error: fetchError } = await supabase
      .from('friend_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (fetchError || !challenge) {
      return { success: false };
    }
    
    // 更新分数
    const isChallenger = challenge.challenger_id === userId;
    const updateData: any = {
      status: 'in_progress'
    };
    
    if (isChallenger) {
      updateData.challenger_score = score;
    } else {
      updateData.opponent_score = score;
    }
    
    // 检查是否双方都已完成
    const otherScore = isChallenger ? challenge.opponent_score : challenge.challenger_score;
    if (otherScore !== null) {
      // 双方都完成，确定胜负
      const challengerFinalScore = isChallenger ? score : challenge.challenger_score;
      const opponentFinalScore = isChallenger ? challenge.opponent_score : score;
      
      let winnerId = null;
      if (challengerFinalScore > opponentFinalScore) {
        winnerId = challenge.challenger_id;
      } else if (opponentFinalScore > challengerFinalScore) {
        winnerId = challenge.opponent_id;
      }
      // 平局 winnerId 为 null
      
      updateData.status = 'completed';
      updateData.winner_id = winnerId;
      updateData.completed_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('friend_challenges')
        .update(updateData)
        .eq('id', challengeId);
      
      return { success: !error, completed: true, winnerId };
    }
    
    const { error } = await supabase
      .from('friend_challenges')
      .update(updateData)
      .eq('id', challengeId);
    
    return { success: !error, completed: false };
  } catch (err) {
    console.error('[Friends] Submit score error:', err);
    return { success: false };
  }
};

// 获取用户的挑战列表
export const getChallenges = async (userId: string): Promise<FriendChallenge[]> => {
  try {
    const { data, error } = await supabase
      .from('friend_challenges')
      .select('*')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error || !data) {
      console.error('[Friends] Get challenges error:', error);
      return [];
    }
    
    // 获取相关用户信息
    const userIds = new Set<string>();
    data.forEach(c => {
      userIds.add(c.challenger_id);
      userIds.add(c.opponent_id);
    });
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', Array.from(userIds));
    
    return data.map(c => ({
      ...c,
      challenger: profiles?.find(p => p.id === c.challenger_id) || { username: null, avatar_url: null },
      opponent: profiles?.find(p => p.id === c.opponent_id) || { username: null, avatar_url: null }
    }));
  } catch (err) {
    console.error('[Friends] Get challenges exception:', err);
    return [];
  }
};

// 获取待处理的挑战数量
export const getPendingChallengeCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('friend_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('opponent_id', userId)
      .eq('status', 'pending');
    
    if (error) return 0;
    return count || 0;
  } catch (err) {
    return 0;
  }
};
