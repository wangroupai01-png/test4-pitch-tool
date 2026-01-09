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

const MotionDiv = motion.div as any;

type GameState = 'intro' | 'playing' | 'success';

export const SingMode = () => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [targetMidi, setTargetMidi] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0); // 0 to 100
  
  const { startListening, stopListening, isListening, pitch } = usePitchDetector();
  const { playNote } = useAudioPlayer();

  // Difficulty range
  const MIN_MIDI = 53; // F3
  const MAX_MIDI = 72; // C5

  const HOLD_DURATION_MS = 1500; // Need to hold note for 1.5s
  const lastTimeRef = useRef<number>(0);

  const nextLevel = () => {
    const note = getRandomNote(MIN_MIDI, MAX_MIDI);
    setTargetMidi(note);
    setGameState('playing');
    setProgress(0);
    // Play the target note so they know what it sounds like
    setTimeout(() => {
        playNote(getFrequency(note), 1.0, 'triangle');
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
      // Increase rate: 100% / 1500ms * dt
      // dt is roughly 16ms
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
    setScore(s => s + 100);
    if (targetMidi) {
        playNote(getFrequency(targetMidi), 0.2, 'sine'); // Success chime
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
        setLevel(l => l + 1);
        nextLevel();
    }, 2000);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className="min-h-screen bg-light-bg text-dark p-6 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 max-w-6xl mx-auto w-full z-10 relative">
        <Link to="/">
          <Button variant="ghost" size="sm" onClick={stopListening}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </Button>
        </Link>
        <div className="flex gap-4">
            <Card className="!p-3 !py-2 flex items-center gap-2 bg-white">
                <Music className="w-5 h-5 text-accent" />
                <span className="font-bold">关卡: {level}</span>
            </Card>
            <Card className="!p-3 !py-2 flex items-center gap-2 bg-white">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-bold">得分: {score}</span>
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
                    <div className="text-center max-w-md">
                        <div className="mb-8 relative inline-block">
                             <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center border-4 border-dark shadow-neo animate-bounce-slow">
                                <Mic className="w-16 h-16 text-white" />
                             </div>
                             <div className="absolute -bottom-2 -right-2 bg-accent text-white font-black text-xl px-3 py-1 border-2 border-dark shadow-sm rotate-12">
                                准备！
                             </div>
                        </div>
                        <h1 className="text-5xl font-black mb-6 text-dark">哼唱闯关</h1>
                        <p className="text-xl text-slate-600 mb-8 font-bold">
                            根据屏幕提示哼唱出正确的音高。<br/>
                            保持稳定，直到进度条填满！
                        </p>
                        <Button size="lg" onClick={startGame} className="text-2xl px-12 py-6 shadow-neo-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            开始挑战 <Play className="w-8 h-8 ml-3 fill-current" />
                        </Button>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>

        {/* Game UI */}
        <div className="w-full flex-1 flex flex-col gap-6 relative">
            {/* Top Bar: Target & Progress */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch h-[180px]">
                 {/* Target Card */}
                 <div className="w-full md:w-1/3 relative">
                    <Card 
                        variant="primary" 
                        className="h-full flex flex-col items-center justify-center !p-4 border-4 border-dark shadow-neo overflow-hidden"
                    >
                         <p className="font-bold text-white/80 uppercase tracking-widest text-sm mb-2">目标音高</p>
                         <div className="text-7xl font-black text-white drop-shadow-md">
                             {targetMidi ? getNoteName(targetMidi).note : '??'}
                             <span className="text-3xl opacity-60 ml-1">{targetMidi ? getNoteName(targetMidi).octave : ''}</span>
                         </div>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-2 text-white/80 hover:bg-white/20"
                            onClick={() => targetMidi && playNote(getFrequency(targetMidi), 1.0, 'triangle')}
                         >
                             <Volume2 className="w-4 h-4 mr-1" /> 重听示范
                         </Button>
                    </Card>
                 </div>

                 {/* Progress Area */}
                 <div className="w-full md:w-2/3 relative">
                     <Card className="h-full flex flex-col justify-center items-center !p-8 border-4 border-dark shadow-neo bg-white relative overflow-hidden">
                        <div className="w-full relative z-10">
                            <div className="flex justify-between mb-2 font-black text-xl text-slate-700">
                                <span>匹配度</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-8 w-full bg-slate-200 rounded-full border-3 border-dark overflow-hidden relative">
                                <MotionDiv 
                                    className="h-full bg-secondary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                                />
                                {/* Striped pattern overlay */}
                                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)] bg-[size:1rem_1rem]" />
                            </div>
                            <p className="mt-4 text-center font-bold text-slate-400">
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
                                        <Check className="w-16 h-16 mx-auto mb-2" />
                                        <h2 className="text-4xl font-black">完美通过!</h2>
                                    </div>
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                     </Card>
                 </div>
            </div>

            {/* Visualizer */}
            <div className="flex-1 w-full border-4 border-dark shadow-neo rounded-3xl overflow-hidden bg-dark relative min-h-[300px]">
                <PitchVisualizer 
                    pitch={pitch} 
                    isListening={isListening} 
                    targetMidi={targetMidi}
                    className="min-h-[300px]"
                />
                
                {/* Aiming Guides */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold text-xs pointer-events-none">
                    低
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 font-bold text-xs pointer-events-none text-right">
                    高
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};
