import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Star, RotateCcw, Home, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getMidiNoteName, getFrequency } from '../utils/musicTheory';
import { checkAndUnlockAchievements, updateStreak } from '../utils/achievementChecker';
import { InstrumentSelector } from '../components/ui/InstrumentSelector';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface Question {
  targetMidi: number;
  options: number[];
}

// 根据星期几生成不同难度的题目
const generateDailyQuestions = (): Question[] => {
  const day = new Date().getDay();
  const questions: Question[] = [];
  
  // 基础音域 C4-C5
  const basicNotes = [60, 62, 64, 65, 67, 69, 71, 72];
  // 扩展音域
  const extendedNotes = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81];
  
  let notePool = basicNotes;
  let questionCount = 10;
  
  // 周六是高难挑战
  if (day === 6) {
    notePool = extendedNotes;
    questionCount = 15;
  }
  // 周五是极速挑战，题目少但快
  else if (day === 5) {
    questionCount = 8;
  }
  
  for (let i = 0; i < questionCount; i++) {
    const targetMidi = notePool[Math.floor(Math.random() * notePool.length)];
    // 生成4个选项，包含正确答案
    const optionsSet = new Set<number>([targetMidi]);
    while (optionsSet.size < 4) {
      const randomNote = notePool[Math.floor(Math.random() * notePool.length)];
      optionsSet.add(randomNote);
    }
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
    questions.push({ targetMidi, options });
  }
  
  return questions;
};

export const DailyChallenge = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { playNote, isReady } = useAudioPlayer();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'result'>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [todayBestScore, setTodayBestScore] = useState(0);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = async () => {
    // 检查今天是否已完成
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_challenge_scores')
        .select('score')
        .eq('user_id', user.id)
        .eq('challenge_date', today)
        .maybeSingle();
      
      if (data) {
        setHasCompletedToday(true);
        setTodayBestScore(data.score);
      }
    }
    
    const generatedQuestions = generateDailyQuestions();
    setQuestions(generatedQuestions);
    setGameState('playing');
  };

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

    playNote(getFrequency(midi));

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        handleGameComplete(newCorrectCount);
      }
    }, 1200);
  };

  const handleGameComplete = async (finalCorrectCount: number) => {
    setGameState('result');

    const score = Math.round((finalCorrectCount / questions.length) * 100);
    const xpReward = 50; // 每日挑战基础奖励

    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 保存每日挑战分数
      const { data: existing } = await supabase
        .from('daily_challenge_scores')
        .select('score')
        .eq('user_id', user.id)
        .eq('challenge_date', today)
        .maybeSingle();

      if (!existing) {
        // 首次完成今日挑战
        await supabase
          .from('daily_challenge_scores')
          .insert({
            user_id: user.id,
            challenge_date: today,
            score,
            challenge_type: getDayChallengeType(),
          });

        // 添加 XP
        const { data: xpData } = await supabase
          .from('user_xp')
          .select('total_xp, xp_today')
          .eq('user_id', user.id)
          .maybeSingle();

        const newTotalXp = (xpData?.total_xp || 0) + xpReward;

        await supabase
          .from('user_xp')
          .upsert({
            user_id: user.id,
            total_xp: newTotalXp,
            xp_today: (xpData?.xp_today || 0) + xpReward,
            last_xp_date: today,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        // 记录 XP 日志
        await supabase
          .from('xp_logs')
          .insert({
            user_id: user.id,
            xp_amount: xpReward,
            source: 'daily_challenge',
            source_id: today,
          });

        // 更新打卡
        await updateStreak(user.id);
        
        // 检查成就
        await checkAndUnlockAchievements(user.id);
      } else if (score > existing.score) {
        // 更新最高分
        await supabase
          .from('daily_challenge_scores')
          .update({ score })
          .eq('user_id', user.id)
          .eq('challenge_date', today);
      }

      setTodayBestScore(Math.max(score, existing?.score || 0));
    } catch (err) {
      console.error('[DailyChallenge] Error saving score:', err);
    }
  };

  const getDayChallengeType = () => {
    const types = ['random', 'quiz', 'sing', 'interval', 'mixed', 'speed', 'hard'];
    return types[new Date().getDay()];
  };

  const getScore = () => {
    return Math.round((correctCount / questions.length) * 100);
  };

  const getStars = () => {
    const score = getScore();
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0;
  };

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent to-orange-500">
        <MotionDiv
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-orange-500 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <MotionButton 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-white/20 rounded-xl border-2 border-white/30 backdrop-blur-sm"
          onClick={() => navigate('/compete')}
        >
          <X className="w-5 h-5 text-white" />
        </MotionButton>
        
        {/* Progress Bar */}
        {gameState === 'playing' && (
          <>
            <div className="flex-1 mx-4 max-w-md">
              <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                <MotionDiv 
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${((currentQuestionIndex + (showFeedback ? 1 : 0)) / questions.length) * 100}%` 
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            
            <InstrumentSelector compact />
            
            <div className="px-3 py-1 bg-white/20 text-white font-black rounded-lg border-2 border-white/30">
              {currentQuestionIndex + 1}/{questions.length}
            </div>
          </>
        )}
      </header>

      {/* Title */}
      {gameState === 'playing' && (
        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-white flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6" />
            每日挑战
          </h1>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {gameState === 'playing' && currentQuestion && (
            <MotionDiv
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <Card className="!p-8 text-center relative overflow-hidden mb-6">
                <h2 className="text-2xl font-black text-dark mb-8">这是什么音？</h2>
                
                {/* Play Button */}
                <MotionButton
                  className="w-32 h-32 rounded-full bg-accent flex items-center justify-center mx-auto mb-6 shadow-neo border-4 border-dark"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayNote}
                >
                  <Volume2 className="w-14 h-14 text-white" />
                </MotionButton>
                
                <p className="text-slate-500 font-bold">点击播放音符</p>
              </Card>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options?.map((midi) => {
                  const isSelected = selectedAnswer === midi;
                  const isCorrectAnswer = midi === currentQuestion.targetMidi;
                  
                  let bgColor = 'bg-white hover:bg-slate-50';
                  let borderColor = 'border-dark';
                  let textColor = 'text-dark';
                  
                  if (showFeedback) {
                    if (isCorrectAnswer) {
                      bgColor = 'bg-secondary';
                      textColor = 'text-white';
                    } else if (isSelected && !isCorrectAnswer) {
                      bgColor = 'bg-red-500';
                      borderColor = 'border-red-700';
                      textColor = 'text-white';
                    }
                  }

                  return (
                    <MotionButton
                      key={midi}
                      className={`
                        p-6 rounded-2xl font-black text-xl border-3 transition-all shadow-neo-sm
                        ${bgColor} ${borderColor} ${textColor}
                        ${showFeedback ? 'cursor-default' : 'cursor-pointer'}
                      `}
                      whileHover={!showFeedback ? { scale: 1.02, y: -2 } : {}}
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
              <AnimatePresence>
                {showFeedback && (
                  <MotionDiv
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`mt-6 p-4 rounded-xl border-3 border-dark shadow-neo-sm ${isCorrect ? 'bg-secondary text-white' : 'bg-red-500 text-white'}`}
                  >
                    <p className="font-black text-lg">
                      {isCorrect ? '正确！🎉' : `错误，正确答案是 ${getMidiNoteName(currentQuestion.targetMidi)}`}
                    </p>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </MotionDiv>
          )}

          {gameState === 'result' && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center"
            >
              <Card className="!p-8 !bg-white text-dark border-3 border-dark shadow-neo">
                {/* Stars */}
                <div className="flex justify-center gap-3 mb-6">
                  {[1, 2, 3].map((i) => (
                    <MotionDiv
                      key={i}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.2, type: 'spring' }}
                    >
                      <Star
                        className={`w-14 h-14 ${i <= getStars() ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' : 'text-slate-200'}`}
                        strokeWidth={2.5}
                      />
                    </MotionDiv>
                  ))}
                </div>

                <h2 className="text-3xl font-black mb-2 text-dark">
                  挑战完成！
                </h2>
                
                <div className="my-6">
                  <p className="text-6xl font-black text-accent drop-shadow-sm">{getScore()}</p>
                  <p className="text-slate-500 font-bold mt-2">
                    {correctCount} / {questions.length} 正确
                  </p>
                </div>

                {user && !hasCompletedToday && (
                  <MotionDiv 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-accent/10 rounded-xl p-4 mb-8 border-2 border-accent/20"
                  >
                    <p className="text-accent font-black text-xl">+50 XP</p>
                    <p className="text-sm text-slate-500 font-medium">每日挑战奖励</p>
                  </MotionDiv>
                )}

                {hasCompletedToday && (
                  <div className="bg-slate-100 rounded-xl p-4 mb-8 border-2 border-slate-200">
                    <p className="text-slate-600 font-bold">今日最高分: {todayBestScore}</p>
                  </div>
                )}

                {!user && (
                  <div className="bg-amber-100 rounded-xl p-4 mb-8 text-amber-800 border-2 border-amber-200">
                    <p className="font-bold">💡 登录后可保存挑战记录</p>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <Button 
                    className="w-full py-4 text-lg"
                    onClick={() => navigate('/compete')}
                  >
                    <Home className="w-5 h-5 mr-2" />
                    返回竞技场
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    className="w-full py-3"
                    onClick={() => {
                      setCurrentQuestionIndex(0);
                      setCorrectCount(0);
                      setSelectedAnswer(null);
                      setShowFeedback(false);
                      setQuestions(generateDailyQuestions());
                      setGameState('playing');
                    }}
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    再挑战一次
                  </Button>
                </div>
              </Card>
            </MotionDiv>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
