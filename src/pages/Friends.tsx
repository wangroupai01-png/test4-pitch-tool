import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, UserPlus, Search, Check, X, Swords, 
  ChevronRight, Clock, Trophy, User
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../lib/supabase';

const MotionDiv = motion.div as any;

// 预设头像
const PRESET_AVATARS: Record<number, { emoji: string; bg: string }> = {
  1: { emoji: '🎵', bg: 'from-primary to-secondary' },
  2: { emoji: '🎸', bg: 'from-red-500 to-orange-500' },
  3: { emoji: '🎹', bg: 'from-slate-700 to-slate-900' },
  4: { emoji: '🎤', bg: 'from-pink-500 to-rose-500' },
  5: { emoji: '🎺', bg: 'from-yellow-400 to-amber-500' },
  6: { emoji: '🥁', bg: 'from-orange-500 to-red-600' },
  7: { emoji: '🎻', bg: 'from-amber-600 to-yellow-700' },
  8: { emoji: '🎷', bg: 'from-indigo-500 to-purple-600' },
};

interface Friend {
  friend_id: string;
  username: string | null;
  avatar_url: string | null;
  level: number;
  friendship_status: 'pending' | 'accepted' | 'blocked';
  is_requester: boolean;
}

interface SearchResult {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number;
}

interface PKMatch {
  id: string;
  challenger_id: string;
  opponent_id: string;
  game_mode: 'quiz' | 'sing';
  challenger_score: number;
  opponent_score: number | null;
  status: 'pending' | 'in_progress' | 'completed';
  winner_id: string | null;
  created_at: string;
  challenger_profile?: { username: string; avatar_url: string };
  opponent_profile?: { username: string; avatar_url: string };
}

type TabType = 'friends' | 'requests' | 'pk';

export const Friends = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [pkMatches, setPkMatches] = useState<PKMatch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isGuest) {
      loadFriends();
      loadPKMatches();
    } else {
      setLoading(false);
    }
  }, [user, isGuest]);

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_friends_list', {
        current_user_id: user.id
      });

      if (error) throw error;

      const allFriends = data as Friend[];
      setFriends(allFriends.filter(f => f.friendship_status === 'accepted'));
      setPendingRequests(allFriends.filter(f => f.friendship_status === 'pending'));
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPKMatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friend_pk_matches')
        .select(`
          *,
          challenger_profile:profiles!friend_pk_matches_challenger_id_fkey(username, avatar_url),
          opponent_profile:profiles!friend_pk_matches_opponent_id_fkey(username, avatar_url)
        `)
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPkMatches(data || []);
    } catch (err) {
      console.error('Error loading PK matches:', err);
    }
  };

  const handleSearch = async () => {
    if (!user || searchTerm.length < 2) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm,
        current_user_id: user.id
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    setActionLoading(friendId);
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;
      
      // 移除已发送请求的用户
      setSearchResults(prev => prev.filter(u => u.id !== friendId));
      loadFriends();
    } catch (err) {
      console.error('Error sending friend request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const acceptRequest = async (friendId: string) => {
    if (!user) return;

    setActionLoading(friendId);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', friendId)
        .eq('friend_id', user.id);

      if (error) throw error;
      loadFriends();
    } catch (err) {
      console.error('Error accepting request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRequest = async (friendId: string) => {
    if (!user) return;

    setActionLoading(friendId);
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user.id);

      if (error) throw error;
      loadFriends();
    } catch (err) {
      console.error('Error rejecting request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const startPK = async (friendId: string, gameMode: 'quiz' | 'sing') => {
    if (!user) return;

    setActionLoading(`pk-${friendId}`);
    try {
      const { error } = await supabase
        .from('friend_pk_matches')
        .insert({
          challenger_id: user.id,
          opponent_id: friendId,
          game_mode: gameMode,
          status: 'pending'
        });

      if (error) throw error;
      
      // 跳转到对应的游戏模式
      navigate(gameMode === 'quiz' ? '/quiz' : '/sing', {
        state: { isPK: true, friendId }
      });
    } catch (err) {
      console.error('Error starting PK:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const renderAvatar = (avatarUrl: string | null, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
    const textSize = size === 'sm' ? 'text-lg' : 'text-2xl';
    
    if (avatarUrl?.startsWith('preset:')) {
      const presetId = parseInt(avatarUrl.replace('preset:', ''));
      const preset = PRESET_AVATARS[presetId];
      if (preset) {
        return (
          <div className={`${sizeClass} rounded-xl bg-gradient-to-br ${preset.bg} flex items-center justify-center border-2 border-dark`}>
            <span className={textSize}>{preset.emoji}</span>
          </div>
        );
      }
    }
    
    return (
      <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-2 border-dark`}>
        <User className={`${size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'} text-white`} />
      </div>
    );
  };

  // 未登录提示
  if (isGuest || !user) {
    return (
      <div className="min-h-screen bg-light-bg p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 font-bold mb-6 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>

          <Card className="!p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-black text-dark mb-2">登录后使用好友功能</h2>
            <p className="text-slate-500 font-bold">添加好友、互相PK，一起进步！</p>
          </Card>
        </div>
      </div>
    );
  }

  const pendingCount = pendingRequests.filter(r => !r.is_requester).length;

  return (
    <div className="min-h-screen bg-light-bg p-4 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 font-bold hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>
          
          <Button
            variant="secondary"
            className="!py-2 !px-4"
            onClick={() => setShowSearch(!showSearch)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            添加好友
          </Button>
        </div>

        {/* Search Panel */}
        <AnimatePresence>
          {showSearch && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <Card className="!p-4">
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索用户名或邮箱..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 border-2 border-dark rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching || searchTerm.length < 2}>
                    {isSearching ? '...' : '搜索'}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border-2 border-dark"
                      >
                        {renderAvatar(result.avatar_url, 'sm')}
                        <div className="flex-1">
                          <p className="font-black text-dark">{result.username || '未设置昵称'}</p>
                          <p className="text-sm text-slate-500 font-bold">Lv.{result.level}</p>
                        </div>
                        <Button
                          variant="primary"
                          className="!py-2 !px-4"
                          onClick={() => sendFriendRequest(result.id)}
                          disabled={actionLoading === result.id}
                        >
                          {actionLoading === result.id ? '...' : '添加'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'friends' as TabType, label: '好友', icon: Users, count: friends.length },
            { id: 'requests' as TabType, label: '请求', icon: Clock, count: pendingCount },
            { id: 'pk' as TabType, label: 'PK', icon: Swords, count: pkMatches.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dark font-black transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-neo'
                  : 'bg-white text-dark hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <Card className="!p-8 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </Card>
        ) : (
          <>
            {/* Friends List */}
            {activeTab === 'friends' && (
              <div className="space-y-3">
                {friends.length === 0 ? (
                  <Card className="!p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-bold">还没有好友</p>
                    <p className="text-sm text-slate-400">点击上方"添加好友"开始吧！</p>
                  </Card>
                ) : (
                  friends.map((friend, index) => (
                    <MotionDiv
                      key={friend.friend_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="!p-4">
                        <div className="flex items-center gap-4">
                          {renderAvatar(friend.avatar_url)}
                          <div className="flex-1">
                            <p className="font-black text-dark text-lg">
                              {friend.username || '未设置昵称'}
                            </p>
                            <p className="text-sm text-slate-500 font-bold">Lv.{friend.level}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              className="!py-2 !px-3"
                              onClick={() => startPK(friend.friend_id, 'quiz')}
                              disabled={actionLoading === `pk-${friend.friend_id}`}
                            >
                              <Swords className="w-4 h-4 mr-1" />
                              PK
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </MotionDiv>
                  ))
                )}
              </div>
            )}

            {/* Pending Requests */}
            {activeTab === 'requests' && (
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <Card className="!p-8 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-bold">暂无好友请求</p>
                  </Card>
                ) : (
                  pendingRequests.map((request, index) => (
                    <MotionDiv
                      key={request.friend_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="!p-4">
                        <div className="flex items-center gap-4">
                          {renderAvatar(request.avatar_url)}
                          <div className="flex-1">
                            <p className="font-black text-dark">
                              {request.username || '未设置昵称'}
                            </p>
                            <p className="text-sm text-slate-500 font-bold">
                              {request.is_requester ? '等待对方接受' : '请求添加你为好友'}
                            </p>
                          </div>
                          {!request.is_requester && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptRequest(request.friend_id)}
                                disabled={actionLoading === request.friend_id}
                                className="p-2 bg-secondary rounded-xl border-2 border-dark text-white hover:opacity-90 transition-opacity"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => rejectRequest(request.friend_id)}
                                disabled={actionLoading === request.friend_id}
                                className="p-2 bg-red-500 rounded-xl border-2 border-dark text-white hover:opacity-90 transition-opacity"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </Card>
                    </MotionDiv>
                  ))
                )}
              </div>
            )}

            {/* PK Matches */}
            {activeTab === 'pk' && (
              <div className="space-y-3">
                {pkMatches.length === 0 ? (
                  <Card className="!p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-bold">暂无PK对战</p>
                    <p className="text-sm text-slate-400">向好友发起挑战吧！</p>
                  </Card>
                ) : (
                  pkMatches.map((match, index) => {
                    const isChallenger = match.challenger_id === user?.id;
                    const opponent = isChallenger ? match.opponent_profile : match.challenger_profile;
                    const myScore = isChallenger ? match.challenger_score : (match.opponent_score || 0);
                    const theirScore = isChallenger ? (match.opponent_score || 0) : match.challenger_score;
                    
                    return (
                      <MotionDiv
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className="!p-4 cursor-pointer hover:shadow-neo-lg transition-all"
                          onClick={() => {
                            if (match.status === 'pending' && !isChallenger) {
                              navigate(match.game_mode === 'quiz' ? '/quiz' : '/sing', {
                                state: { isPK: true, matchId: match.id }
                              });
                            }
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className={`px-3 py-1 rounded-full text-xs font-black ${
                                match.game_mode === 'quiz' 
                                  ? 'bg-primary/10 text-primary' 
                                  : 'bg-secondary/10 text-secondary'
                              }`}>
                                {match.game_mode === 'quiz' ? '听音' : '哼唱'}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-dark">
                                vs {opponent?.username || '未知用户'}
                              </p>
                              <p className="text-sm text-slate-500 font-bold">
                                {match.status === 'pending' 
                                  ? (isChallenger ? '等待对方应战' : '等待你应战')
                                  : `${myScore} : ${theirScore}`
                                }
                              </p>
                            </div>
                            {match.status === 'pending' && !isChallenger && (
                              <ChevronRight className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </Card>
                      </MotionDiv>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
