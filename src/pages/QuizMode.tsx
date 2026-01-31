import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PianoKeyboard } from '../components/game/PianoKeyboard';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getRandomNote, getFrequency, getNoteName } from '../utils/musicTheory';
import { ArrowLeft, Play, Volume2, Trophy, Frown, Check, Settings, Clock, Target, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../lib/supabase';
import { ShareButton } from '../components/ui/ShareButton';

const MotionDiv = motion.div as any;

type GameStatus = 'idle' | 'config' | 'playing' | 'guessing' | 'result' | 'gameover';

// 难度配置
const DIFFICULTY_CONFIG = {
  easy: { label: '简单', range: [60, 72], description: 'C4-C5 中音区' },
  medium: { label: '中等', range: [48, 72], description: 'C3-C5 两个八度' },
  hard: { label: '困难', range: [36, 84], description: 'C2-C6 四个八度' },
};

// 题目数量配置
const QUESTION_COUNTS = [
  { value: 10, label: '10题' },
  { value: 20, label: '20题' },
  { value: 50, label: '50题' },
  { value: 0, label: '无限' },
];

// 时间限制配置
const TIME_LIMITS = [
  { value: 0, label: '不限时' },
  { value: 10, label: '10秒' },
  { value: 5, label: '5秒' },
  { value: 3, label: '3秒' },
];

export const QuizMode = () => {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [targetNote, setTargetNote] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  
  // 新增：游戏配置
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const { playNote } = useAudioPlayer();
  const { user, isGuest, updateGuestScore, guestData } = useUserStore();

  // 根据难度获取音域
  const diffConfig = DIFFICULTY_CONFIG[difficulty];
  const MIN_MIDI = diffConfig.range[0];
  const MAX_MIDI = diffConfig.range[1];

  // Load best score on mount
  useEffect(() => {
    if (isGuest) {
      setBestScore(guestData.quizHighScore);
    } else if (user) {
      loadBestScore();
    }
  }, [user, isGuest]);

  const loadBestScore = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('best_score')
        .eq('user_id', user.id)
        .eq('game_mode', 'quiz')
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully
      
      if (error) {
        console.error('[QuizMode] Error loading best score:', error);
        return;
      }
      
      if (data) {
        console.log('[QuizMode] Loaded best score:', data.best_score);
        setBestScore(data.best_score);
      } else {
        console.log('[QuizMode] No existing score found for user');
      }
    } catch (err) {
      console.error('[QuizMode] Unexpected error loading best score:', err);
    }
  };

  const saveScore = async (finalScore: number, _finalStreak: number) => {
    if (isGuest) {
      updateGuestScore('quiz', finalScore, 1, _finalStreak);
      if (finalScore > bestScore) {
        setBestScore(finalScore);
      }
      return;
    }
    
    if (!user) {
      console.log('[QuizMode] No user, skipping score save');
      return;
    }

    // Skip saving if score is 0
    if (finalScore === 0) {
      console.log('[QuizMode] Score is 0, skipping save');
      return;
    }

    try {
      console.log('[QuizMode] Saving score for user:', user.id, 'score:', finalScore);
      
      // First check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from('leaderboard')
        .select('id, best_score, total_games')
        .eq('user_id', user.id)
        .eq('game_mode', 'quiz')
        .maybeSingle();

      if (fetchError) {
        console.error('[QuizMode] Error fetching existing score:', fetchError);
        return;
      }

      if (existing) {
        // Record exists - only update if new score is higher
        const newBestScore = Math.max(finalScore, existing.best_score);
        console.log('[QuizMode] Existing record found. Old best:', existing.best_score, 'New score:', finalScore, 'Will save:', newBestScore);
        
        const { data: updateData, error: updateError } = await supabase
          .from('leaderboard')
          .update({
            best_score: newBestScore,
            total_games: existing.total_games + 1,
          })
          .eq('id', existing.id)
          .select();
        
        if (updateError) {
          console.error('[QuizMode] Error updating score:', updateError);
          console.error('[QuizMode] Update error details:', JSON.stringify(updateError));
        } else {
          console.log('[QuizMode] Score updated successfully:', updateData);
          setBestScore(newBestScore);
        }
      } else {
        // No record exists - insert new
        console.log('[QuizMode] No existing record, inserting new');
        const { data: insertData, error: insertError } = await supabase
          .from('leaderboard')
          .insert({
            user_id: user.id,
            game_mode: 'quiz',
            best_score: finalScore,
            best_level: 1,
            total_games: 1,
          })
          .select();
        
        if (insertError) {
          console.error('[QuizMode] Error inserting score:', insertError);
          console.error('[QuizMode] Insert error details:', JSON.stringify(insertError));
        } else {
          console.log('[QuizMode] Score inserted successfully:', insertData);
          setBestScore(finalScore);
        }
      }
    } catch (err) {
      console.error('[QuizMode] Unexpected error saving score:', err);
    }
  };

  // 清除计时器
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 开始新游戏
  const startGame = () => {
    setScore(0);
    setStreak(0);
    setCurrentQuestion(0);
    setCorrectAnswers(0);
    startNewRound();
  };

  const startNewRound = () => {
    clearTimer();
    const note = getRandomNote(MIN_MIDI, MAX_MIDI);
    setTargetNote(note);
    setSelectedNote(null);
    setCurrentQuestion(prev => prev + 1);
    setStatus('playing');
    
    // Small delay to allow state update before playing
    setTimeout(() => {
      playTargetNote(note);
      setStatus('guessing');
      
      // 如果有时间限制，启动计时器
      if (timeLimit > 0) {
        setTimeLeft(timeLimit);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearTimer();
              // 时间到，自动判错
              handleTimeout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }, 500);
  };

  // 超时处理
  const handleTimeout = () => {
    setStatus('result');
    setStreak(0);
    
    // 检查是否游戏结束
    if (questionCount > 0 && currentQuestion >= questionCount) {
      setTimeout(() => setStatus('gameover'), 1500);
    }
  };

  const playTargetNote = (note: number = targetNote!) => {
    if (!note) return;
    const freq = getFrequency(note);
    playNote(freq, 1.2, 'sine');
  };

  const handleNoteClick = (midi: number) => {
    if (status !== 'guessing') return;
    
    clearTimer();
    setSelectedNote(midi);
    setStatus('result');
    
    // Play the clicked note
    playNote(getFrequency(midi), 0.4, 'sine');

    const isCorrect = midi === targetNote;
    
    if (isCorrect) {
      // Correct
      const newScore = score + 10 + (streak * 2);
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      setCorrectAnswers(prev => prev + 1);
      
      // Save score
      saveScore(newScore, newStreak);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7F5AF0', '#2CB67D', '#FF8906']
      });
    } else {
      // Wrong - game essentially "ends" this streak, save score
      saveScore(score, streak);
      setStreak(0);
    }
    
    // 检查是否游戏结束（有限题目模式）
    if (questionCount > 0 && currentQuestion >= questionCount) {
      setTimeout(() => setStatus('gameover'), 1500);
    }
  };
  
  // 返回配置页面
  const goToConfig = () => {
    clearTimer();
    setStatus('config');
  };
  
  // 重新开始 (可通过返回按钮重置)
  const _restartGame = () => {
    clearTimer();
    setStatus('idle');
  };
  void _restartGame; // 保留备用

  return (
    <div className="min-h-screen bg-light-bg text-dark p-3 md:p-6 flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 md:mb-8 max-w-6xl mx-auto w-full gap-2">
        <Link to="/practice">
          <Button variant="ghost" size="sm" className="shrink-0">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">返回</span>
          </Button>
        </Link>
        <div className="flex gap-2 md:gap-4 items-center">
          {/* 限时显示 */}
          {timeLimit > 0 && status === 'guessing' && (
            <Card className={`!p-2 md:!p-3 !py-1 md:!py-2 flex items-center gap-1 md:gap-2 ${
              timeLeft <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-white'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-bold">{timeLeft}s</span>
            </Card>
          )}
          {/* 题目进度 */}
          {questionCount > 0 && status !== 'idle' && status !== 'config' && (
            <Card className="!p-2 md:!p-3 !py-1 md:!py-2 flex items-center gap-1 md:gap-2 bg-white">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">{currentQuestion}/{questionCount}</span>
            </Card>
          )}
          {score > 0 && (
            <ShareButton score={score} mode="听音辨位" />
          )}
          <Card className="!p-2 md:!p-3 !py-1 md:!py-2 flex items-center gap-1 md:gap-2 bg-white">
            <Trophy className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            <span className="font-bold text-sm md:text-base">{score}</span>
            {bestScore > 0 && (
              <span className="text-xs text-slate-400 hidden sm:inline">/ 最高 {bestScore}</span>
            )}
          </Card>
          <Card className="!p-2 md:!p-3 !py-1 md:!py-2 flex items-center gap-1 md:gap-2 bg-white">
            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              {streak}
            </div>
            <span className="font-bold text-sm md:text-base hidden sm:inline">连击</span>
          </Card>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full relative">
        {/* Center Content: Play Button & Feedback */}
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
            {/* Play Button / Start Area */}
            <div className="shrink-0 mb-4 md:mb-8 relative z-10">
                <MotionDiv 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  {status === 'idle' ? (
                     <div className="text-center px-4">
                       <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-6">🎧 听音辨位</h2>
                       <p className="text-slate-500 mb-6">听音符，在钢琴上找到它的位置</p>
                       <div className="flex flex-col sm:flex-row gap-3 justify-center">
                         <Button size="lg" onClick={() => setStatus('config')} variant="outline" className="px-6 py-4">
                           <Settings className="w-5 h-5 mr-2" />
                           游戏设置
                         </Button>
                         <Button size="lg" onClick={startGame} className="px-8 py-4">
                           <Play className="w-6 h-6 mr-2" />
                           快速开始
                         </Button>
                       </div>
                     </div>
                  ) : status === 'config' ? (
                     <div className="text-center px-4 w-full max-w-md">
                       <h2 className="text-2xl font-black mb-6">⚙️ 游戏设置</h2>
                       
                       {/* 难度选择 */}
                       <div className="mb-6">
                         <p className="font-bold mb-3 text-left">难度</p>
                         <div className="grid grid-cols-3 gap-2">
                           {(Object.keys(DIFFICULTY_CONFIG) as Array<keyof typeof DIFFICULTY_CONFIG>).map(key => (
                             <button
                               key={key}
                               onClick={() => setDifficulty(key)}
                               className={`p-3 rounded-xl border-3 border-dark font-bold transition-all ${
                                 difficulty === key 
                                   ? 'bg-primary text-white shadow-neo' 
                                   : 'bg-white hover:bg-slate-50'
                               }`}
                             >
                               <div>{DIFFICULTY_CONFIG[key].label}</div>
                               <div className="text-xs opacity-70">{DIFFICULTY_CONFIG[key].description}</div>
                             </button>
                           ))}
                         </div>
                       </div>
                       
                       {/* 题目数量 */}
                       <div className="mb-6">
                         <p className="font-bold mb-3 text-left">题目数量</p>
                         <div className="grid grid-cols-4 gap-2">
                           {QUESTION_COUNTS.map(q => (
                             <button
                               key={q.value}
                               onClick={() => setQuestionCount(q.value)}
                               className={`p-3 rounded-xl border-3 border-dark font-bold transition-all ${
                                 questionCount === q.value 
                                   ? 'bg-secondary text-white shadow-neo' 
                                   : 'bg-white hover:bg-slate-50'
                               }`}
                             >
                               {q.label}
                             </button>
                           ))}
                         </div>
                       </div>
                       
                       {/* 时间限制 */}
                       <div className="mb-8">
                         <p className="font-bold mb-3 text-left">⏱️ 每题时限</p>
                         <div className="grid grid-cols-4 gap-2">
                           {TIME_LIMITS.map(t => (
                             <button
                               key={t.value}
                               onClick={() => setTimeLimit(t.value)}
                               className={`p-3 rounded-xl border-3 border-dark font-bold transition-all ${
                                 timeLimit === t.value 
                                   ? 'bg-accent text-dark shadow-neo' 
                                   : 'bg-white hover:bg-slate-50'
                               }`}
                             >
                               {t.label}
                             </button>
                           ))}
                         </div>
                       </div>
                       
                       <div className="flex gap-3">
                         <Button variant="outline" onClick={() => setStatus('idle')} className="flex-1 py-4">
                           返回
                         </Button>
                         <Button onClick={startGame} className="flex-1 py-4">
                           <Play className="w-5 h-5 mr-2" />
                           开始游戏
                         </Button>
                       </div>
                     </div>
                  ) : status === 'gameover' ? (
                     <div className="text-center px-4 w-full max-w-md">
                       <div className="bg-white border-3 border-dark rounded-2xl shadow-neo p-6 mb-6">
                         <h2 className="text-3xl font-black mb-2">🎉 游戏结束</h2>
                         <div className="grid grid-cols-2 gap-4 my-6">
                           <div className="bg-primary/10 rounded-xl p-4 border-2 border-primary">
                             <p className="text-3xl font-black text-primary">{score}</p>
                             <p className="text-sm font-bold text-slate-500">总得分</p>
                           </div>
                           <div className="bg-secondary/10 rounded-xl p-4 border-2 border-secondary">
                             <p className="text-3xl font-black text-secondary">{correctAnswers}/{questionCount}</p>
                             <p className="text-sm font-bold text-slate-500">正确率</p>
                           </div>
                         </div>
                         {score > bestScore && (
                           <div className="bg-accent/20 rounded-xl p-3 mb-4 border-2 border-accent">
                             <p className="font-black text-accent">🏆 新纪录！</p>
                           </div>
                         )}
                       </div>
                       <div className="flex gap-3">
                         <Button variant="outline" onClick={goToConfig} className="flex-1 py-4">
                           <Settings className="w-5 h-5 mr-2" />
                           设置
                         </Button>
                         <Button onClick={startGame} className="flex-1 py-4">
                           <Zap className="w-5 h-5 mr-2" />
                           再来一局
                         </Button>
                       </div>
                     </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 md:gap-6">
                       <Button 
                        onClick={() => playTargetNote()} 
                        variant="secondary"
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full !p-0 flex items-center justify-center border-4 border-dark shadow-neo-lg"
                       >
                         <Volume2 className="w-12 h-12 md:w-16 md:h-16" />
                       </Button>
                       <p className="text-base md:text-xl font-bold opacity-60">
                         {status === 'guessing' ? "聆听并辨认音符" : "结果"}
                       </p>
                    </div>
                  )}
                </MotionDiv>
            </div>
            
            {/* Feedback Area - Fixed Height Container to prevent jump */}
            <div className="h-[180px] md:h-[240px] w-full flex items-center justify-center relative z-10 px-4"> 
               <AnimatePresence mode="wait">
                  {status === 'result' && (
                    <MotionDiv
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="flex flex-col items-center w-full max-w-md"
                    >
                      {selectedNote === targetNote ? (
                        <div className="w-full bg-secondary text-white p-4 md:p-6 rounded-xl border-3 border-dark shadow-neo flex items-center gap-3 md:gap-4">
                          <Check className="w-8 h-8 md:w-10 md:h-10 shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="font-bold text-lg md:text-xl">回答正确！</p>
                            <p className="opacity-90 text-sm md:text-base truncate">正确答案是 {getNoteName(targetNote!).fullName}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-accent text-white p-4 md:p-6 rounded-xl border-3 border-dark shadow-neo flex items-center gap-3 md:gap-4">
                          <Frown className="w-8 h-8 md:w-10 md:h-10 shrink-0 text-dark" />
                          <div className="text-left text-dark min-w-0">
                            <p className="font-bold text-lg md:text-xl">哎呀！</p>
                            <p className="opacity-90 text-sm md:text-base truncate">正确是 {getNoteName(targetNote!).fullName}，你选了 {getNoteName(selectedNote!).fullName}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* 只在还有题目或无限模式时显示下一题 */}
                      {(questionCount === 0 || currentQuestion < questionCount) && (
                        <Button onClick={startNewRound} className="mt-4 md:mt-8 px-6 md:px-8 py-2 md:py-3 text-base md:text-lg w-full max-w-xs" size="lg">
                          下一题 <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 ml-2 rotate-180" />
                        </Button>
                      )}
                    </MotionDiv>
                  )}
               </AnimatePresence>
            </div>
        </div>

        {/* Bottom: Piano - Fixed at bottom */}
        <div className="shrink-0 w-full pb-2 md:pb-4 pt-2 overflow-x-auto hide-scrollbar">
           <PianoKeyboard 
              startMidi={MIN_MIDI} 
              endMidi={MAX_MIDI}
              onNoteClick={handleNoteClick}
              activeNotes={status === 'guessing' ? [] : []}
              correctNotes={status === 'result' ? [targetNote!] : []}
              wrongNotes={status === 'result' && selectedNote !== targetNote ? [selectedNote!] : []}
              disabled={status !== 'guessing'}
            />
        </div>
      </main>
    </div>
  );
};
