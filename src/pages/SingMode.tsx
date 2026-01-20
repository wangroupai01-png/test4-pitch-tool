import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PitchVisualizer } from '../components/game/PitchVisualizer';
import { usePitchDetector } from '../hooks/usePitchDetector';
import { getRandomNote, getNoteName, getFrequency } from '../utils/musicTheory';
import { ArrowLeft, Mic, Trophy, Play, Check, Volume2, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../lib/supabase';
import { ShareButton } from '../components/ui/ShareButton';

const MotionDiv = motion.div as any;

type GameState = 'intro' | 'playing' | 'success';

export const SingMode = () => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [targetMidi, setTargetMidi] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [bestLevel, setBestLevel] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  
  const { startListening, stopListening, isListening, pitch } = usePitchDetector();
  const { playNote } = useAudioPlayer();
  const { user, isGuest, updateGuestScore, guestData } = useUserStore();

  // Difficulty range
  const MIN_MIDI = 53; // F3
  const MAX_MIDI = 72; // C5

  const HOLD_DURATION_MS = 1500; // Need to hold note for 1.5s
  const lastTimeRef = useRef<number>(0);

  // Load best score on mount
  useEffect(() => {
    if (isGuest) {
      setBestScore(guestData.singHighScore);
      setBestLevel(guestData.singBestLevel);
    } else if (user) {
      loadBestScore();
    }
  }, [user, isGuest]);

  const loadBestScore = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('leaderboard')
      .select('best_score, best_level')
      .eq('user_id', user.id)
      .eq('game_mode', 'sing')
      .single();
    
    if (data) {
      setBestScore(data.best_score);
      setBestLevel(data.best_level);
    }
  };

  const saveScore = async (finalScore: number, finalLevel: number) => {
    if (isGuest) {
      updateGuestScore('sing', finalScore, finalLevel);
      if (finalScore > bestScore) {
        setBestScore(finalScore);
      }
      if (finalLevel > bestLevel) {
        setBestLevel(finalLevel);
      }
    } else if (user) {
      // Save to Supabase
      const { data: existing } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_mode', 'sing')
        .single();

      if (existing) {
        // Update if better
        const newBestScore = Math.max(finalScore, existing.best_score);
        const newBestLevel = Math.max(finalLevel, existing.best_level);
        
        await supabase
          .from('leaderboard')
          .update({
            best_score: newBestScore,
            best_level: newBestLevel,
            total_games: existing.total_games + 1,
          })
          .eq('id', existing.id);
        
        setBestScore(newBestScore);
        setBestLevel(newBestLevel);
      } else {
        // Create new entry
        await supabase.from('leaderboard').insert({
          user_id: user.id,
          game_mode: 'sing',
          best_score: finalScore,
          best_level: finalLevel,
          total_games: 1,
        });
        setBestScore(finalScore);
        setBestLevel(finalLevel);
      }
    }
  };

  const nextLevel = () => {
    const note = getRandomNote(MIN_MIDI, MAX_MIDI);
    setTargetMidi(note);
    setGameState('playing');
    setProgress(0);
    // Play the target note so they know what it sounds like
    setTimeout(() => {
        playNote(getFrequency(note), 1.5, 'sine');
    }, 500);
  };

  const startGame = () => {
    startListening();
    setScore(0);
    setLevel(1);
    nextLevel();
  };

  // Game Loop for checking pitch match
  useEffect(() => {
    if (gameState !== 'playing' || !isListening || !targetMidi || !pitch) return;

    const now = Date.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // Check if pitch matches target
    // Tolerance: 50 cents (half a semitone)
    const currentMidi = pitch.midi + pitch.cents / 100;
    const diff = Math.abs(currentMidi - targetMidi);

    if (diff < 0.5 && pitch.clarity > 0.8) {
      // Good pitch! Increase progress
      const increment = (100 / HOLD_DURATION_MS) * (dt || 16);
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          handleSuccess();
          return 100;
        }
        return next;
      });
    } else {
      // Decay progress if miss
      setProgress(prev => Math.max(0, prev - 1));
    }
  }, [pitch, targetMidi, gameState, isListening]);

  const handleSuccess = () => {
    setGameState('success');
    const newScore = score + 100;
    const newLevel = level + 1;
    setScore(newScore);
    
    // Save score after each level
    saveScore(newScore, level);
    
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

    setTimeout(() => {
        setLevel(newLevel);
        nextLevel();
    }, 2000);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className="min-h-screen bg-light-bg text-dark p-3 md:p-6 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-2 md:mb-4 max-w-6xl mx-auto w-full z-10 relative gap-2">
        <Link to="/">
          <Button variant="ghost" size="sm" onClick={stopListening} className="shrink-0">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">返回</span>
          </Button>
        </Link>
        <div className="flex gap-2 md:gap-4 items-center">
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
                        <Button size="lg" onClick={startGame} className="text-lg md:text-2xl px-8 md:px-12 py-4 md:py-6 shadow-neo-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            开始挑战 <Play className="w-6 h-6 md:w-8 md:h-8 ml-2 md:ml-3 fill-current" />
                        </Button>
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
                                    </div>
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                     </Card>
                 </div>
            </div>

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
