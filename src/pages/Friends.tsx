import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, UserPlus, Search, Check, X, Swords, 
  Clock, Trophy, User, Zap, UserMinus, Send
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/useUserStore';
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendList,
  getPendingRequests,
  createChallenge,
  getChallenges,
  acceptChallenge,
  declineChallenge,
  type FriendInfo,
  type FriendChallenge,
  type UserSearchResult
} from '../utils/friendService';

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

type TabType = 'friends' | 'requests' | 'pk';

export const Friends = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendInfo[]>([]);
  const [challenges, setChallenges] = useState<FriendChallenge[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user && !isGuest) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, isGuest]);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [friendsData, requestsData, challengesData] = await Promise.all([
        getFriendList(user.id),
        getPendingRequests(user.id),
        getChallenges(user.id)
      ]);
      
      setFriends(friendsData);
      setPendingRequests(requestsData);
      setChallenges(challengesData);
    } catch (err) {
      console.error('Error loading friends data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSearch = async () => {
    if (!user || searchTerm.length < 2) return;

    setIsSearching(true);
    try {
      const results = await searchUsers(searchTerm, user.id);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    if (!user) return;

    setActionLoading(friendId);
    const result = await sendFriendRequest(user.id, friendId);
    
    if (result.success) {
      setMessage({ type: 'success', text: '好友请求已发送' });
      setSearchResults(prev => prev.map(u => 
        u.id === friendId ? { ...u, friendship_status: 'pending_sent' as const } : u
      ));
    } else {
      setMessage({ type: 'error', text: result.error || '发送失败' });
    }
    
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    const success = await acceptFriendRequest(friendshipId);
    
    if (success) {
      setMessage({ type: 'success', text: '已添加好友' });
      loadData();
    } else {
      setMessage({ type: 'error', text: '操作失败' });
    }
    
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRejectRequest = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    const success = await rejectFriendRequest(friendshipId);
    
    if (success) {
      loadData();
    }
    
    setActionLoading(null);
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm('确定要删除这个好友吗？')) return;
    
    setActionLoading(friendshipId);
    const success = await removeFriend(friendshipId);
    
    if (success) {
      setMessage({ type: 'success', text: '已删除好友' });
      loadData();
    }
    
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleStartPK = async (friendId: string) => {
    if (!user) return;

    setActionLoading(`pk-${friendId}`);
    const result = await createChallenge(user.id, friendId, 'quiz', 'normal');
    
    if (result.success) {
      setMessage({ type: 'success', text: 'PK 挑战已发送！' });
      // 跳转到 PK 页面
      navigate(`/pk/${result.challengeId}`);
    } else {
      setMessage({ type: 'error', text: result.error || '发起挑战失败' });
    }
    
    setActionLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    setActionLoading(`challenge-${challengeId}`);
    const success = await acceptChallenge(challengeId);
    
    if (success) {
      navigate(`/pk/${challengeId}`);
    } else {
      setMessage({ type: 'error', text: '接受挑战失败' });
    }
    
    setActionLoading(null);
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    setActionLoading(`challenge-${challengeId}`);
    const success = await declineChallenge(challengeId);
    
    if (success) {
      loadData();
    }
    
    setActionLoading(null);
  };

  const renderAvatar = (avatarUrl: string | null, username: string | null, size: 'sm' | 'md' = 'md') => {
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
    
    if (avatarUrl && !avatarUrl.startsWith('preset:')) {
      return (
        <div className={`${sizeClass} rounded-xl overflow-hidden border-2 border-dark`}>
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    
    return (
      <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-2 border-dark`}>
        {username ? (
          <span className="text-white font-bold">{username.charAt(0).toUpperCase()}</span>
        ) : (
          <User className={`${size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'} text-white`} />
        )}
      </div>
    );
  };

  // 未登录提示
  if (isGuest || !user) {
    return (
      <div className="min-h-screen bg-light-bg pattern-grid-lg">
        <header className="p-4 flex items-center gap-4 bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
          <MotionButton 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-100 rounded-xl border-2 border-dark"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </MotionButton>
          <h1 className="text-xl font-black text-dark">好友</h1>
        </header>
        
        <div className="p-4 max-w-2xl mx-auto">
          <Card className="!p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-black text-dark mb-2">登录后使用好友功能</h2>
            <p className="text-slate-500 font-bold mb-6">添加好友、互相PK，一起进步！</p>
            <Button onClick={() => navigate('/profile')}>
              去登录
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const pendingChallengeCount = challenges.filter(c => 
    c.status === 'pending' && c.opponent_id === user.id
  ).length;

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg pb-8">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <MotionButton 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-100 rounded-xl border-2 border-dark"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </MotionButton>
          <h1 className="text-xl font-black text-dark">好友</h1>
        </div>
        
        <Button
          variant="secondary"
          className="!py-2 !px-4"
          onClick={() => setShowSearch(!showSearch)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          添加好友
        </Button>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Message Toast */}
        <AnimatePresence>
          {message && (
            <MotionDiv
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-4 p-4 rounded-xl border-2 border-dark font-bold ${
                message.type === 'success' 
                  ? 'bg-secondary/20 text-secondary' 
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {message.text}
            </MotionDiv>
          )}
        </AnimatePresence>

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
                      placeholder="搜索用户名..."
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
                        {renderAvatar(result.avatar_url, result.username, 'sm')}
                        <div className="flex-1">
                          <p className="font-black text-dark">{result.username || '未设置昵称'}</p>
                          <div className="flex items-center gap-1 text-sm text-slate-500 font-bold">
                            <Zap className="w-3 h-3" />
                            {result.total_xp} XP
                          </div>
                        </div>
                        {result.friendship_status === 'none' && (
                          <Button
                            variant="primary"
                            className="!py-2 !px-4"
                            onClick={() => handleSendRequest(result.id)}
                            disabled={actionLoading === result.id}
                          >
                            {actionLoading === result.id ? '...' : <><Send className="w-4 h-4 mr-1" />添加</>}
                          </Button>
                        )}
                        {result.friendship_status === 'pending_sent' && (
                          <span className="text-sm text-slate-400 font-bold">已发送</span>
                        )}
                        {result.friendship_status === 'pending_received' && (
                          <span className="text-sm text-amber-500 font-bold">待接受</span>
                        )}
                        {result.friendship_status === 'accepted' && (
                          <span className="text-sm text-secondary font-bold">已是好友</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
                  <p className="text-center text-slate-400 py-4">未找到用户</p>
                )}
              </Card>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'friends' as TabType, label: '好友', icon: Users, count: friends.length },
            { id: 'requests' as TabType, label: '请求', icon: Clock, count: pendingRequests.length },
            { id: 'pk' as TabType, label: 'PK', icon: Swords, count: pendingChallengeCount },
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
                      key={friend.friendship_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="!p-4">
                        <div className="flex items-center gap-4">
                          {renderAvatar(friend.avatar_url, friend.username)}
                          <div className="flex-1">
                            <p className="font-black text-dark text-lg">
                              {friend.username || '未设置昵称'}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                              <span>Lv.{friend.current_level}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {friend.total_xp} XP
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <MotionButton
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 bg-primary text-white rounded-xl border-2 border-dark"
                              onClick={() => handleStartPK(friend.user_id)}
                              disabled={actionLoading === `pk-${friend.user_id}`}
                            >
                              <Swords className="w-5 h-5" />
                            </MotionButton>
                            <MotionButton
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 bg-slate-100 text-slate-500 rounded-xl border-2 border-dark"
                              onClick={() => handleRemoveFriend(friend.friendship_id)}
                              disabled={actionLoading === friend.friendship_id}
                            >
                              <UserMinus className="w-5 h-5" />
                            </MotionButton>
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
                      key={request.friendship_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="!p-4">
                        <div className="flex items-center gap-4">
                          {renderAvatar(request.avatar_url, request.username)}
                          <div className="flex-1">
                            <p className="font-black text-dark">
                              {request.username || '未设置昵称'}
                            </p>
                            <p className="text-sm text-slate-500 font-bold">
                              想添加你为好友
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <MotionButton
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAcceptRequest(request.friendship_id)}
                              disabled={actionLoading === request.friendship_id}
                              className="p-2 bg-secondary rounded-xl border-2 border-dark text-white"
                            >
                              <Check className="w-5 h-5" />
                            </MotionButton>
                            <MotionButton
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRejectRequest(request.friendship_id)}
                              disabled={actionLoading === request.friendship_id}
                              className="p-2 bg-red-500 rounded-xl border-2 border-dark text-white"
                            >
                              <X className="w-5 h-5" />
                            </MotionButton>
                          </div>
                        </div>
                      </Card>
                    </MotionDiv>
                  ))
                )}
              </div>
            )}

            {/* PK Challenges */}
            {activeTab === 'pk' && (
              <div className="space-y-3">
                {challenges.length === 0 ? (
                  <Card className="!p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-bold">暂无PK对战</p>
                    <p className="text-sm text-slate-400">向好友发起挑战吧！</p>
                  </Card>
                ) : (
                  challenges.map((challenge, index) => {
                    const isChallenger = challenge.challenger_id === user?.id;
                    const opponent = isChallenger ? challenge.opponent : challenge.challenger;
                    const isPending = challenge.status === 'pending';
                    const isMyTurn = isPending && !isChallenger;
                    
                    return (
                      <MotionDiv
                        key={challenge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`!p-4 ${isMyTurn ? '!border-primary' : ''}`}>
                          <div className="flex items-center gap-4">
                            {renderAvatar(opponent?.avatar_url || null, opponent?.username || null, 'sm')}
                            <div className="flex-1">
                              <p className="font-black text-dark">
                                vs {opponent?.username || '未知用户'}
                              </p>
                              <div className="flex items-center gap-2 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  challenge.status === 'pending' 
                                    ? 'bg-amber-100 text-amber-600' 
                                    : challenge.status === 'completed'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                  {challenge.status === 'pending' 
                                    ? (isChallenger ? '等待应战' : '等待你应战')
                                    : challenge.status === 'completed'
                                    ? '已结束'
                                    : '进行中'
                                  }
                                </span>
                                {challenge.status === 'completed' && (
                                  <span className="text-slate-500 font-bold">
                                    {challenge.challenger_score} : {challenge.opponent_score}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {isMyTurn && (
                              <div className="flex gap-2">
                                <MotionButton
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAcceptChallenge(challenge.id)}
                                  disabled={actionLoading === `challenge-${challenge.id}`}
                                  className="px-4 py-2 bg-secondary text-white rounded-xl border-2 border-dark font-bold"
                                >
                                  应战
                                </MotionButton>
                                <MotionButton
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDeclineChallenge(challenge.id)}
                                  disabled={actionLoading === `challenge-${challenge.id}`}
                                  className="p-2 bg-slate-100 text-slate-500 rounded-xl border-2 border-dark"
                                >
                                  <X className="w-5 h-5" />
                                </MotionButton>
                              </div>
                            )}
                            
                            {challenge.status === 'completed' && challenge.winner_id && (
                              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                challenge.winner_id === user?.id
                                  ? 'bg-secondary/20 text-secondary'
                                  : 'bg-red-100 text-red-500'
                              }`}>
                                {challenge.winner_id === user?.id ? '胜利 🎉' : '失败'}
                              </div>
                            )}
                            
                            {challenge.status === 'completed' && !challenge.winner_id && (
                              <div className="px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-500">
                                平局
                              </div>
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
