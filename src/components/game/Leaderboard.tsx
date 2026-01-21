import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, X, Crown, Loader2, Headphones, Music } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  game_mode: 'quiz' | 'sing';
  best_score: number;
  best_level: number;
  total_games: number;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'quiz' | 'sing'>('quiz');
  
  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, activeMode]);
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First get leaderboard entries
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('game_mode', activeMode)
        .order('best_score', { ascending: false })
        .limit(20);
      
      if (leaderboardError) throw leaderboardError;
      
      if (!leaderboardData || leaderboardData.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }
      
      // Get user profiles for these entries
      const userIds = leaderboardData.map(e => e.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
      
      // Create a map of user_id to username
      const usernameMap = new Map<string, string>();
      if (profilesData) {
        profilesData.forEach(p => {
          usernameMap.set(p.id, p.username || '匿名玩家');
        });
      }
      
      // Transform data to include username
      const transformedData = leaderboardData.map((entry: any) => ({
        ...entry,
        username: usernameMap.get(entry.user_id) || '匿名玩家',
      }));
      
      setEntries(transformedData);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('加载排行榜失败');
    } finally {
      setLoading(false);
    }
  };
  
  const MotionDiv = motion.div as any;
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-black text-slate-400">{rank}</span>;
    }
  };
  
  const tabs = [
    { id: 'quiz' as const, label: '听音辨位', icon: Headphones },
    { id: 'sing' as const, label: '哼唱闯关', icon: Music },
  ];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <MotionDiv
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white border-3 border-dark rounded-2xl shadow-neo w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 md:p-6 border-b-3 border-dark bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6" />
                <h2 className="text-xl md:text-2xl font-black">排行榜</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mode Tabs */}
            <div className="flex border-b-2 border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold transition-colors ${
                    activeMode === tab.id
                      ? 'bg-primary/10 text-primary border-b-3 border-primary -mb-[2px]'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-slate-500">
                  <p>{error}</p>
                  <button 
                    onClick={fetchLeaderboard}
                    className="mt-4 text-primary font-bold hover:underline"
                  >
                    重试
                  </button>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-bold">暂无排行数据</p>
                  <p className="text-sm mt-2">成为第一个上榜的玩家吧！</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <MotionDiv
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                        index < 3 
                          ? 'border-primary bg-primary/5' 
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      {/* Rank */}
                      <div className="shrink-0">
                        {getRankIcon(index + 1)}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black truncate">{entry.username}</p>
                        <p className="text-xs text-slate-500">
                          {activeMode === 'sing' ? `最高关卡: ${entry.best_level}` : `游戏次数: ${entry.total_games}`}
                        </p>
                      </div>
                      
                      {/* Score */}
                      <div className="shrink-0 text-right">
                        <p className="font-black text-lg text-primary">{entry.best_score}</p>
                        <p className="text-xs text-slate-500">分</p>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              )}
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};
