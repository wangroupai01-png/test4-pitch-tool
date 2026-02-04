import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, Swords, Trophy, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/useUserStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { supabase } from '../lib/supabase';
import { submitChallengeScore, type FriendChallenge } from '../utils/friendService';
import { getMidiNoteName, getFrequency } from '../utils/musicTheory';

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

type GameState = 'loading' | 'ready' | 'playing' | 'result' | 'waiting' | 'final';

interface Question {
  type: string;
  targetMidi: number;
  options: number[];
}

export const FriendPK = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { playNote, isReady } = useAudioPlayer();
  
  const [challenge, setChallenge] = useState<FriendChallenge | null>(null);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [opponent, setOpponent] = useState<{ username: string | null; avatar_url: string | null } | null>(null);
  const [finalResult, setFinalResult] = useState<{ winnerId: string | null; myScore: number; opponentScore: number } | null>(null);

  useEffect(() => {
    if (challengeId && user) {
      loadChallenge();
    }
  }, [challengeId, user]);

  const loadChallenge = async () => {
    if (!challengeId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('friend_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();
      
      if (error || !data) {
        console.error('[FriendPK] Error loading challenge:', error);
        navigate('/friends');
        return;
      }
      
      setChallenge(data);
      
      // 获取对手信息
      const opponentId = data.challenger_id === user.id ? data.opponent_id : data.challenger_id;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', opponentId)
        .single();
      
      setOpponent(profileData);
      
      // 检查挑战状态
      if (data.status === 'completed') {
        // 已完成，显示结果
        const isChallenger = data.challenger_id === user.id;
        setFinalResult({
          winnerId: data.winner_id,
          myScore: isChallenger ? data.challenger_score : data.opponent_score,
          opponentScore: isChallenger ? data.opponent_score : data.challenger_score
        });
        setGameState('final');
      } else if (data.status === 'in_progress') {
        // 检查是否已提交分数
        const isChallenger = data.challenger_id === user.id;
        const myScore = isChallenger ? data.challenger_score : data.opponent_score;
        
        if (myScore !== null) {
          // 已提交，等待对方
          setGameState('waiting');
        } else {
          // 开始答题
          setGameState('ready');
        }
      } else if (data.status === 'accepted') {
        // 双方都已接受，开始答题
        setGameState('ready');
      } else {
        setGameState('ready');
      }
    } catch (err) {
      console.error('[FriendPK] Error:', err);
      navigate('/friends');
    }
  };

  const questions: Question[] = challenge?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handlePlayNote = useCallback(() => {
    if (currentQuestion && isReady) {
      const frequency = getFrequency(currentQuestion.targetMidi);
      playNote(frequency);
    }
  }, [currentQuestion, isReady, playNote]);

  const handleSelectAnswer = async (midi: number) => {
    if (showFeedback || !currentQuestion) return;

    setSelectedAnswer(midi);
    const correct = midi === currentQuestion.targetMidi;
    setIsCorrect(correct);
    setShowFeedback(true);

    const newCorrectCount = correct ? correctCount + 1 : correctCount;
    if (correct) {
      setCorrectCount(newCorrectCount);
    }

    // 播放选择的音符
    playNote(getFrequency(midi));

    // 延迟后进入下一题
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // 完成所有题目，提交分数
        handleComplete(newCorrectCount);
      }
    }, 1000);
  };

  const handleComplete = async (finalScore: number) => {
    if (!challengeId || !user) return;
    
    const score = Math.round((finalScore / questions.length) * 100);
    
    const result = await submitChallengeScore(challengeId, user.id, score);
    
    if (result.completed) {
      // 双方都完成了
      const isChallenger = challenge?.challenger_id === user.id;
      setFinalResult({
        winnerId: result.winnerId || null,
        myScore: score,
        opponentScore: isChallenger ? challenge?.opponent_score || 0 : challenge?.challenger_score || 0
      });
      setGameState('final');
    } else {
      // 等待对方完成
      setGameState('waiting');
    }
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setCorrectCount(0);
  };

  const renderAvatar = (avatarUrl: string | null, username: string | null, size: string = 'w-16 h-16') => {
    if (avatarUrl?.startsWith('preset:')) {
      const presetId = parseInt(avatarUrl.replace('preset:', ''));
      const preset = PRESET_AVATARS[presetId];
      if (preset) {
        return (
          <div className={`${size} rounded-2xl bg-gradient-to-br ${preset.bg} flex items-center justify-center border-3 border-dark`}>
            <span className="text-3xl">{preset.emoji}</span>
          </div>
        );
      }
    }
    
    if (avatarUrl && !avatarUrl.startsWith('preset:')) {
      return (
        <div className={`${size} rounded-2xl overflow-hidden border-3 border-dark`}>
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    
    return (
      <div className={`${size} rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-3 border-dark`}>
        {username ? (
          <span className="text-white font-black text-2xl">{username.charAt(0).toUpperCase()}</span>
        ) : (
          <User className="w-8 h-8 text-white" />
        )}
      </div>
    );
  };

  if (gameState === 'loading') {
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

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
        <MotionButton 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-slate-100 rounded-xl border-2 border-dark"
          onClick={() => navigate('/friends', { replace: true })}
        >
          <ArrowLeft className="w-5 h-5 text-dark" />
        </MotionButton>
        <div className="flex-1">
          <h1 className="text-xl font-black text-dark">好友 PK</h1>
        </div>
        {gameState === 'playing' && (
          <div className="px-3 py-1 bg-primary text-white font-black rounded-lg border-2 border-dark">
            {currentQuestionIndex + 1}/{questions.length}
          </div>
        )}
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Ready State */}
        {gameState === 'ready' && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="!p-8 text-center">
              <div className="flex items-center justify-center gap-8 mb-8">
                {/* 我 */}
                <div className="text-center">
                  {renderAvatar(null, user?.email?.charAt(0) || null)}
                  <p className="font-black text-dark mt-2">我</p>
                </div>
                
                {/* VS */}
                <div className="relative">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center border-3 border-dark shadow-neo">
                    <Swords className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* 对手 */}
                <div className="text-center">
                  {renderAvatar(opponent?.avatar_url || null, opponent?.username || null)}
                  <p className="font-black text-dark mt-2">{opponent?.username || '对手'}</p>
                </div>
              </div>
              
              <h2 className="text-2xl font-black text-dark mb-4">准备好了吗？</h2>
              <p className="text-slate-500 font-bold mb-8">
                共 {questions.length} 道题目，谁的得分更高？
              </p>
              
              <Button className="w-full py-4 text-lg" onClick={startGame}>
                开始挑战！
              </Button>
            </Card>
          </MotionDiv>
        )}

        {/* Playing State */}
        {gameState === 'playing' && currentQuestion && (
          <MotionDiv
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="!p-8 text-center mb-6">
              <h2 className="text-2xl font-black text-dark mb-8">这是什么音？</h2>
              
              <MotionButton
                className="w-32 h-32 rounded-full bg-primary flex items-center justify-center mx-auto mb-6 shadow-neo border-4 border-dark"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayNote}
              >
                <Volume2 className="w-14 h-14 text-white" />
              </MotionButton>
              
              <p className="text-slate-500 font-bold">点击播放音符</p>
            </Card>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((midi) => {
                const isSelected = selectedAnswer === midi;
                const isCorrectAnswer = midi === currentQuestion.targetMidi;
                
                let bgColor = 'bg-white hover:bg-slate-50';
                let textColor = 'text-dark';
                
                if (showFeedback) {
                  if (isCorrectAnswer) {
                    bgColor = 'bg-secondary';
                    textColor = 'text-white';
                  } else if (isSelected && !isCorrectAnswer) {
                    bgColor = 'bg-red-500';
                    textColor = 'text-white';
                  }
                }

                return (
                  <MotionButton
                    key={midi}
                    className={`p-6 rounded-2xl font-black text-xl border-3 border-dark transition-all shadow-neo-sm ${bgColor} ${textColor}`}
                    whileHover={!showFeedback ? { scale: 1.02 } : {}}
                    whileTap={!showFeedback ? { scale: 0.98 } : {}}
                    onClick={() => handleSelectAnswer(midi)}
                    disabled={showFeedback}
                  >
                    {getMidiNoteName(midi)}
                  </MotionButton>
                );
              })}
            </div>

            {/* Feedback */}
            {showFeedback && (
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-2xl border-3 border-dark text-center ${
                  isCorrect ? 'bg-secondary/20' : 'bg-red-100'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-secondary" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <span className={`font-black text-lg ${isCorrect ? 'text-secondary' : 'text-red-500'}`}>
                    {isCorrect ? '正确！' : `错误，正确答案是 ${getMidiNoteName(currentQuestion.targetMidi)}`}
                  </span>
                </div>
              </MotionDiv>
            )}
          </MotionDiv>
        )}

        {/* Waiting State */}
        {gameState === 'waiting' && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="!p-8 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-black text-dark mb-2">等待对手完成</h2>
              <p className="text-slate-500 font-bold mb-4">
                你的得分：{Math.round((correctCount / questions.length) * 100)} 分
              </p>
              <p className="text-sm text-slate-400">
                对方完成后会自动显示结果
              </p>
              
              <Button 
                variant="secondary" 
                className="mt-8"
                onClick={() => navigate('/friends', { replace: true })}
              >
                返回好友页面
              </Button>
            </Card>
          </MotionDiv>
        )}

        {/* Final Result */}
        {gameState === 'final' && finalResult && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="!p-8 text-center">
              {/* 结果图标 */}
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center border-3 border-dark ${
                finalResult.winnerId === user?.id 
                  ? 'bg-secondary' 
                  : finalResult.winnerId === null 
                  ? 'bg-slate-300' 
                  : 'bg-red-500'
              }`}>
                <Trophy className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-black text-dark mb-2">
                {finalResult.winnerId === user?.id 
                  ? '你赢了！🎉' 
                  : finalResult.winnerId === null 
                  ? '平局' 
                  : '你输了'}
              </h2>
              
              {/* 比分 */}
              <div className="flex items-center justify-center gap-8 my-8">
                <div className="text-center">
                  <p className="text-4xl font-black text-primary">{finalResult.myScore}</p>
                  <p className="text-slate-500 font-bold">我的得分</p>
                </div>
                <div className="text-2xl font-black text-slate-300">:</div>
                <div className="text-center">
                  <p className="text-4xl font-black text-slate-600">{finalResult.opponentScore}</p>
                  <p className="text-slate-500 font-bold">{opponent?.username || '对手'}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => navigate('/friends', { replace: true })}
                >
                  返回好友
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => navigate('/compete', { replace: true })}
                >
                  继续挑战
                </Button>
              </div>
            </Card>
          </MotionDiv>
        )}
      </div>
    </div>
  );
};
