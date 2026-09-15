import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PitchVisualizer } from '../components/game/PitchVisualizer';
import { usePitchDetector } from '../hooks/usePitchDetector';
import { getRandomNote, getNoteName, getFrequency } from '../utils/musicTheory';
import { ArrowLeft, Mic, Trophy, Play, Check, Volume2, Music, Heart, RotateCcw, SkipForward, Lightbulb, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../lib/supabase';
import { settleGameScore } from '../services/settlementService';
import { useManagedTimeouts } from '../hooks/useManagedTimeouts';

import { ShareButton } from '../components/ui/ShareButton';

const MotionDiv = motion.div as any;

type GameState = 'intro' | 'playing' | 'success' | 'failed' | 'gameover';

// 难度配置：随关卡递增
const getDifficultyConfig = (level: number) => {
  // 容差随关卡降低 (从0.8半音到0.3半音)
  const tolerance = Math.max(0.3, 0.8 - (level - 1) * 0.05);
  // 保持时间随关卡增加 (从1.5秒到3秒)
  const holdDuration = Math.min(3000, 1500 + (level - 1) * 100);
  // 音域随关卡扩展
  const minMidi = Math.max(48, 53 - Math.floor(level / 5) * 2);
  const maxMidi = Math.min(84, 72 + Math.floor(level / 5) * 2);
  
  return { tolerance, holdDuration, minMidi, maxMidi };
};

export const SingMode = () => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [targetMidi, setTargetMidi] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [bestLevel, setBestLevel] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lives, setLives] = useState(3); // 生命值
  const [failTimer, setFailTimer] = useState<number | null>(null); // 失败倒计时
  
  // 道具系统
  const [items, setItems] = useState({ skip: 3, hint: 3, retry: 3 });
  const [showHint, setShowHint] = useState(false); // 是否显示提示效果
  
  const { startListening, stopListening, isListening, isStarting, pitch, error: microphoneError } = usePitchDetector();
  const { playNote } = useAudioPlayer();
  const { schedule, clearAll: clearScheduledWork } = useManagedTimeouts();
  const { user, isGuest, updateGuestScore, guestData } = useUserStore();

  // 根据当前关卡获取难度配置
  const diffConfig = getDifficultyConfig(level);
  const MIN_MIDI = diffConfig.minMidi;
  const MAX_MIDI = diffConfig.maxMidi;
  const HOLD_DURATION_MS = diffConfig.holdDuration;
  const TOLERANCE = diffConfig.tolerance;

  const lastTimeRef = useRef<number>(0);
  const failTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleSuccessRef = useRef<() => void>(() => {});
  const FAIL_TIME_LIMIT = 15; // 15秒内未完成算失败

  // Load best score on mount
  useEffect(() => {
    if (isGuest) {
      setBestScore(guestData.singHighScore);
      setBestLevel(guestData.singBestLevel);
    } else if (user) {
      const loadBestScore = async () => {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('best_score, best_level')
          .eq('user_id', user.id)
          .eq('game_mode', 'sing')
          .maybeSingle();
        if (error) throw error;
        setBestScore(data?.best_score || 0);
        setBestLevel(data?.best_level || 0);
      };
      void loadBestScore().catch((error) => console.error('[SingMode] Error loading best score:', error));
    }
  }, [user, isGuest, guestData.singHighScore, guestData.singBestLevel]);

  const saveScore = async (finalScore: number, finalLevel: number, countGame = false) => {
    if (isGuest) {
      if (countGame) updateGuestScore('sing', finalScore, finalLevel);
      if (finalScore > bestScore) {
        setBestScore(finalScore);
      }
      if (finalLevel > bestLevel) {
        setBestLevel(finalLevel);
      }
      return;
    }
    
    if (!user) {
      console.log('[SingMode] No user, skipping score save');
      return;
    }

    // Skip saving if score is 0
    if (finalScore === 0) {
      console.log('[SingMode] Score is 0, skipping save');
      return;
    }

    try {
      const result = await settleGameScore('sing', finalScore, finalLevel, countGame);
      setBestScore(result.bestScore);
      setBestLevel(result.bestLevel);
    } catch (err) {
      console.error('[SingMode] Unexpected error saving score:', err);
    }
  };

  // 清除失败计时器
  const clearFailTimer = () => {
    if (failTimerRef.current) {
      clearInterval(failTimerRef.current);
      failTimerRef.current = null;
    }
    setFailTimer(null);
  };

  const nextLevel = () => {
    clearFailTimer();
    const note = getRandomNote(MIN_MIDI, MAX_MIDI);
    setTargetMidi(note);
    setGameState('playing');
    setProgress(0);
    
    // 启动失败倒计时
    setFailTimer(FAIL_TIME_LIMIT);
    failTimerRef.current = setInterval(() => {
      setFailTimer(prev => {
        if (prev === null || prev <= 1) {
          clearFailTimer();
          handleFail();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Play the target note so they know what it sounds like
    schedule(() => {
        playNote(getFrequency(note), 1.5, 'sine');
    }, 500);
  };

  // 失败处理
  const handleFail = () => {
    clearFailTimer();
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0) {
      // 游戏结束
      setGameState('gameover');
      stopListening();
      void saveScore(score, level - 1, true);
    } else {
      // 还有生命，显示失败提示后继续
      setGameState('failed');
      schedule(() => {
        nextLevel();
      }, 1500);
    }
  };

  const startGame = async () => {
    const started = await startListening();
    if (!started) return;
    setScore(0);
    setLevel(1);
    setLives(3);
    setItems({ skip: 3, hint: 3, retry: 3 }); // 重置道具
    nextLevel();
  };
  
  const restartGame = () => {
    setGameState('intro');
  };
  
  // 使用跳过道具
  const useSkip = () => {
    if (items.skip <= 0 || gameState !== 'playing') return;
    
    setItems(prev => ({ ...prev, skip: prev.skip - 1 }));
    clearFailTimer();
    
    // 不加分，直接进入下一关
    const newLevel = level + 1;
    setLevel(newLevel);
    schedule(() => nextLevel(), 500);
  };
  
  // 使用提示道具
  const useHint = () => {
    if (items.hint <= 0 || gameState !== 'playing' || !targetMidi) return;
    
    setItems(prev => ({ ...prev, hint: prev.hint - 1 }));
    setShowHint(true);
    
    // 播放目标音3次
    const freq = getFrequency(targetMidi);
    playNote(freq, 0.8, 'sine');
    schedule(() => playNote(freq, 0.8, 'sine'), 1000);
    schedule(() => playNote(freq, 0.8, 'sine'), 2000);
    schedule(() => setShowHint(false), 3000);
  };
  
  // 使用重置道具
  const useRetry = () => {
    if (items.retry <= 0 || gameState !== 'playing') return;
    
    setItems(prev => ({ ...prev, retry: prev.retry - 1 }));
    clearFailTimer();
    setProgress(0);
    
    // 重新开始当前关卡，不扣命
    schedule(() => {
      setGameState('playing');
      setProgress(0);
      
      // 启动新的失败倒计时
      setFailTimer(FAIL_TIME_LIMIT);
      failTimerRef.current = setInterval(() => {
        setFailTimer(prev => {
          if (prev === null || prev <= 1) {
            clearFailTimer();
            handleFail();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      // 播放目标音
      if (targetMidi) {
        playNote(getFrequency(targetMidi), 1.5, 'sine');
      }
    }, 300);
  };

  // Game Loop for checking pitch match
  useEffect(() => {
    if (gameState !== 'playing' || !isListening || !targetMidi || !pitch) return;

    const now = Date.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // Check if pitch matches target (tolerance decreases with level)
    const currentMidi = pitch.midi + pitch.cents / 100;
    const diff = Math.abs(currentMidi - targetMidi);

    if (diff < TOLERANCE && pitch.clarity > 0.8) {
      // Good pitch! Increase progress
      const increment = (100 / HOLD_DURATION_MS) * (dt || 16);
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          handleSuccessRef.current();
          return 100;
        }
        return next;
      });
    } else {
      // Decay progress if miss
      setProgress(prev => Math.max(0, prev - 1));
    }
  }, [pitch, targetMidi, gameState, isListening, TOLERANCE, HOLD_DURATION_MS]);

  const handleSuccess = () => {
    clearFailTimer();
    setGameState('success');
    const newScore = score + 100 + (level * 10); // 关卡越高奖励越多
    const newLevel = level + 1;
    setScore(newScore);
    
    // Save score after each level
    void saveScore(newScore, level);
    
    if (targetMidi) {
        playNote(getFrequency(targetMidi), 0.2, 'sine');
        playNote(getFrequency(targetMidi + 4), 0.2, 'sine');
        playNote(getFrequency(targetMidi + 7), 0.4, 'sine');
    }
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2CB67D', '#FF8906', '#7F5AF0']
    });

    schedule(() => {
        setLevel(newLevel);
        nextLevel();
    }, 2000);
  };
  handleSuccessRef.current = handleSuccess;

  useEffect(() => {
    return () => {
      stopListening();
      clearFailTimer();
      clearScheduledWork();
    };
  }, [clearScheduledWork, stopListening]);

  return (
    <div className="min-h-screen bg-light-bg text-dark p-3 md:p-6 flex flex-col font-sans overflow-hidden">
      {microphoneError && (
        <div role="alert" className="mx-auto mb-3 w-full max-w-2xl rounded-xl border-3 border-dark bg-red-50 p-3 text-center font-bold text-red-700 shadow-neo-sm">
          {microphoneError}
        </div>
      )}
      {/* Header */}
      <header className="flex justify-between items-center mb-2 md:mb-4 max-w-6xl mx-auto w-full z-10 relative gap-2">
        <Link to="/practice">
          <Button variant="ghost" size="sm" onClick={() => { stopListening(); clearFailTimer(); }} className="shrink-0">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">返回</span>
          </Button>
        </Link>
        <div className="flex gap-2 md:gap-4 items-center">
            {/* 生命值 */}
            {gameState !== 'intro' && gameState !== 'gameover' && (
              <Card className="!p-2 md:!p-3 !py-1 md:!py-2 flex items-center gap-1 bg-white">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className={`w-4 h-4 md:w-5 md:h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-300'}`} 
                  />
                ))}
              </Card>
            )}
            {/* 倒计时 */}
            {failTimer !== null && failTimer <= 10 && (
              <Card className={`!p-2 md:!p-3 !py-1 md:!py-2 flex items-center gap-1 ${
                failTimer <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white'
              }`}>
                <span className="font-bold text-sm">{failTimer}s</span>
              </Card>
            )}
            {score > 0 && (
              <ShareButton score={score} mode="哼唱闯关" />
            )}
            <Card className="!p-2 md:!p-3 !py-1 md:!py-2 flex items-center gap-1 md:gap-2 bg-white">
                <Music className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                <span className="font-bold text-sm md:text-base">Lv.{level}</span>
                {bestLevel > 0 && (
                  <span className="text-xs text-slate-400 hidden sm:inline">/ 最高 {bestLevel}</span>
                )}
            </Card>
            <Card className="!p-2 md:!p-3 !py-1 md:!py-2 flex items-center gap-1 md:gap-2 bg-white">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="font-bold text-sm md:text-base">{score}</span>
            </Card>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full relative">
        
        {/* Intro Screen */}
        <AnimatePresence>
            {gameState === 'intro' && (
                <MotionDiv 
                    key="intro"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    className="absolute inset-0 flex items-center justify-center z-50 bg-light-bg/80 backdrop-blur-sm"
                >
                    <div className="text-center max-w-md px-4">
                        <div className="mb-6 md:mb-8 relative inline-block">
                             <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary flex items-center justify-center border-4 border-dark shadow-neo animate-bounce-slow">
                                <Mic className="w-12 h-12 md:w-16 md:h-16 text-white" />
                             </div>
                             <div className="absolute -bottom-2 -right-2 bg-accent text-white font-black text-base md:text-xl px-2 md:px-3 py-1 border-2 border-dark shadow-sm rotate-12">
                                准备！
                             </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 text-dark">哼唱闯关</h1>
                        <p className="text-base md:text-xl text-slate-600 mb-6 md:mb-8 font-bold">
                            根据屏幕提示哼唱出正确的音高。<br/>
                            保持稳定，直到进度条填满！
                        </p>
                        <Button size="lg" onClick={startGame} disabled={isStarting} className="text-lg md:text-2xl px-8 md:px-12 py-4 md:py-6 shadow-neo-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            {isStarting ? '正在请求麦克风…' : '开始挑战'}
                            {!isStarting && <Play className="w-6 h-6 md:w-8 md:h-8 ml-2 md:ml-3 fill-current" />}
                        </Button>
                        <p className="mt-4 text-sm text-slate-500">
                          ❤️ 3条命 · 难度递进 · 挑战你的极限
                        </p>
                    </div>
                </MotionDiv>
            )}
            {gameState === 'gameover' && (
                <MotionDiv 
                    key="gameover"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-50 bg-dark/90 backdrop-blur-sm"
                >
                    <div className="text-center max-w-md px-4">
                        <div className="bg-white border-3 border-dark rounded-2xl shadow-neo p-6 mb-6">
                          <h2 className="text-3xl font-black mb-2 text-dark">💀 游戏结束</h2>
                          <div className="grid grid-cols-2 gap-4 my-6">
                            <div className="bg-primary/10 rounded-xl p-4 border-2 border-primary">
                              <p className="text-3xl font-black text-primary">{score}</p>
                              <p className="text-sm font-bold text-slate-500">总得分</p>
                            </div>
                            <div className="bg-secondary/10 rounded-xl p-4 border-2 border-secondary">
                              <p className="text-3xl font-black text-secondary">Lv.{level - 1}</p>
                              <p className="text-sm font-bold text-slate-500">最高关卡</p>
                            </div>
                          </div>
                          {level - 1 > bestLevel && (
                            <div className="bg-accent/20 rounded-xl p-3 mb-4 border-2 border-accent">
                              <p className="font-black text-accent">🏆 新纪录！</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <Link to="/practice" className="flex-1">
                            <Button variant="outline" className="w-full py-4">
                              <ArrowLeft className="w-5 h-5 mr-2" />
                              返回
                            </Button>
                          </Link>
                          <Button onClick={restartGame} className="flex-1 py-4">
                            <RotateCcw className="w-5 h-5 mr-2" />
                            再来一局
                          </Button>
                        </div>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>

        {/* Game UI */}
        <div className="w-full flex-1 flex flex-col gap-3 md:gap-6 relative">
            {/* Top Bar: Target & Progress */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-6 items-stretch">
                 {/* Target Card */}
                 <div className="w-full sm:w-1/3 relative">
                    <Card 
                        variant="primary" 
                        className="h-full min-h-[100px] md:min-h-[180px] flex flex-col items-center justify-center !p-3 md:!p-4 border-4 border-dark shadow-neo overflow-hidden"
                    >
                         <p className="font-bold text-white/80 uppercase tracking-widest text-xs md:text-sm mb-1 md:mb-2">目标音高</p>
                         <div className="text-5xl md:text-7xl font-black text-white drop-shadow-md">
                             {targetMidi ? getNoteName(targetMidi).note : '??'}
                             <span className="text-2xl md:text-3xl opacity-60 ml-1">{targetMidi ? getNoteName(targetMidi).octave : ''}</span>
                         </div>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-1 md:mt-2 text-white/80 hover:bg-white/20 text-xs md:text-sm"
                            onClick={() => targetMidi && playNote(getFrequency(targetMidi), 1.5, 'sine')}
                         >
                             <Volume2 className="w-3 h-3 md:w-4 md:h-4 mr-1" /> 重听
                         </Button>
                    </Card>
                 </div>

                 {/* Progress Area */}
                 <div className="w-full sm:w-2/3 relative">
                     <Card className="h-full min-h-[100px] md:min-h-[180px] flex flex-col justify-center items-center !p-4 md:!p-8 border-4 border-dark shadow-neo bg-white relative overflow-hidden">
                        <div className="w-full relative z-10">
                            <div className="flex justify-between mb-1 md:mb-2 font-black text-base md:text-xl text-slate-700">
                                <span>匹配度</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-6 md:h-8 w-full bg-slate-200 rounded-full border-3 border-dark overflow-hidden relative">
                                <MotionDiv 
                                    className="h-full bg-secondary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                                />
                                {/* Striped pattern overlay */}
                                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)] bg-[size:1rem_1rem]" />
                            </div>
                            <p className="mt-2 md:mt-4 text-center font-bold text-slate-400 text-sm md:text-base">
                                {progress > 10 ? (progress > 50 ? (progress > 80 ? "坚持住！即将成功！" : "很好！保持稳定！") : "正在匹配...") : "请调整音高..."}
                            </p>
                        </div>
                        
                        {/* Success Overlay */}
                        <AnimatePresence>
                            {gameState === 'success' && (
                                <MotionDiv 
                                    key="success"
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-secondary flex items-center justify-center z-20"
                                >
                                    <div className="text-white text-center">
                                        <Check className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2" />
                                        <h2 className="text-2xl md:text-4xl font-black">完美通过!</h2>
                                        <p className="text-lg opacity-80">+{100 + level * 10} 分</p>
                                    </div>
                                </MotionDiv>
                            )}
                            {gameState === 'failed' && (
                                <MotionDiv 
                                    key="failed"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-red-500 flex items-center justify-center z-20"
                                >
                                    <div className="text-white text-center">
                                        <Heart className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2" />
                                        <h2 className="text-2xl md:text-4xl font-black">时间到!</h2>
                                        <p className="text-lg opacity-80">剩余 {lives} 条命</p>
                                    </div>
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                     </Card>
                 </div>
            </div>
            
            {/* 道具栏 */}
            {gameState === 'playing' && (
              <div className="flex justify-center gap-2 md:gap-4">
                {/* 跳过道具 */}
                <button
                  onClick={useSkip}
                  disabled={items.skip <= 0}
                  className={`flex flex-col items-center px-3 py-2 md:px-4 md:py-3 rounded-xl border-3 border-dark transition-all ${
                    items.skip > 0 
                      ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <SkipForward className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-xs font-bold mt-1">跳过</span>
                  <span className="text-xs opacity-70">×{items.skip}</span>
                </button>
                
                {/* 提示道具 */}
                <button
                  onClick={useHint}
                  disabled={items.hint <= 0}
                  className={`flex flex-col items-center px-3 py-2 md:px-4 md:py-3 rounded-xl border-3 border-dark transition-all ${
                    items.hint > 0 
                      ? 'bg-yellow-500 text-dark hover:bg-yellow-400 shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  } ${showHint ? 'animate-pulse ring-4 ring-yellow-300' : ''}`}
                >
                  <Lightbulb className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-xs font-bold mt-1">提示</span>
                  <span className="text-xs opacity-70">×{items.hint}</span>
                </button>
                
                {/* 重置道具 */}
                <button
                  onClick={useRetry}
                  disabled={items.retry <= 0}
                  className={`flex flex-col items-center px-3 py-2 md:px-4 md:py-3 rounded-xl border-3 border-dark transition-all ${
                    items.retry > 0 
                      ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-xs font-bold mt-1">重置</span>
                  <span className="text-xs opacity-70">×{items.retry}</span>
                </button>
              </div>
            )}

            {/* Visualizer */}
            <div className="flex-1 w-full border-4 border-dark shadow-neo rounded-3xl overflow-hidden bg-dark relative min-h-[200px] md:min-h-[300px]">
                <PitchVisualizer 
                    pitch={pitch} 
                    isListening={isListening} 
                    targetMidi={targetMidi}
                />
                
                {/* Aiming Guides */}
                <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold text-xs pointer-events-none">
                    低
                </div>
                <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/30 font-bold text-xs pointer-events-none text-right">
                    高
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};
