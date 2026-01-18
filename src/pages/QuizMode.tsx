import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PianoKeyboard } from '../components/game/PianoKeyboard';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getRandomNote, getFrequency, getNoteName } from '../utils/musicTheory';
import { ArrowLeft, Play, Volume2, Trophy, Frown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const MotionDiv = motion.div as any;

type GameStatus = 'idle' | 'playing' | 'guessing' | 'result';

export const QuizMode = () => {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [targetNote, setTargetNote] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  
  const { playNote } = useAudioPlayer();

  const MIN_MIDI = 48; // C3
  const MAX_MIDI = 72; // C5

  const startNewRound = () => {
    const note = getRandomNote(MIN_MIDI, MAX_MIDI);
    setTargetNote(note);
    setSelectedNote(null);
    setStatus('playing');
    
    // Small delay to allow state update before playing
    setTimeout(() => {
      playTargetNote(note);
      setStatus('guessing');
    }, 500);
  };

  const playTargetNote = (note: number = targetNote!) => {
    if (!note) return;
    const freq = getFrequency(note);
    playNote(freq, 1.2, 'sine'); // Using 'sine' for cleaner, more pitch-accurate sound
  };

  const handleNoteClick = (midi: number) => {
    if (status !== 'guessing') return;
    
    setSelectedNote(midi);
    setStatus('result');
    
    // Play the clicked note
    playNote(getFrequency(midi), 0.4, 'sine');

    if (midi === targetNote) {
      // Correct
      setScore(s => s + 10 + (streak * 2));
      setStreak(s => s + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7F5AF0', '#2CB67D', '#FF8906']
      });
    } else {
      // Wrong
      setStreak(0);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg text-dark p-6 flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 max-w-6xl mx-auto w-full">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </Button>
        </Link>
        <div className="flex gap-4">
          <Card className="!p-3 !py-2 flex items-center gap-2 bg-white">
            <Trophy className="w-5 h-5 text-accent" />
            <span className="font-bold">得分: {score}</span>
          </Card>
          <Card className="!p-3 !py-2 flex items-center gap-2 bg-white">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              {streak}
            </div>
            <span className="font-bold">连击</span>
          </Card>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full relative">
        {/* Center Content: Play Button & Feedback */}
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
            {/* Play Button / Start Area */}
            <div className="shrink-0 mb-8 relative z-10">
                <MotionDiv 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  {status === 'idle' ? (
                     <div className="text-center">
                       <h2 className="text-4xl font-black mb-6">准备好训练你的耳朵了吗？</h2>
                       <Button size="lg" onClick={startNewRound} className="text-xl px-12 py-6">
                         <Play className="w-8 h-8 mr-3" />
                         开始游戏
                       </Button>
                     </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                       <Button 
                        onClick={() => playTargetNote()} 
                        variant="secondary"
                        className="w-32 h-32 rounded-full !p-0 flex items-center justify-center border-4 border-dark shadow-neo-lg"
                       >
                         <Volume2 className="w-16 h-16" />
                       </Button>
                       <p className="text-xl font-bold opacity-60">
                         {status === 'guessing' ? "聆听并辨认音符" : "结果"}
                       </p>
                    </div>
                  )}
                </MotionDiv>
            </div>
            
            {/* Feedback Area - Fixed Height Container to prevent jump */}
            <div className="h-[240px] w-full flex items-center justify-center relative z-10"> 
               <AnimatePresence mode="wait">
                  {status === 'result' && (
                    <MotionDiv
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="flex flex-col items-center w-full max-w-md"
                    >
                      {selectedNote === targetNote ? (
                        <div className="w-full bg-secondary text-white p-6 rounded-xl border-3 border-dark shadow-neo flex items-center gap-4">
                          <Check className="w-10 h-10 shrink-0" />
                          <div className="text-left">
                            <p className="font-bold text-xl">回答正确！</p>
                            <p className="opacity-90">正确答案是 {getNoteName(targetNote!).fullName}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-accent text-white p-6 rounded-xl border-3 border-dark shadow-neo flex items-center gap-4">
                          <Frown className="w-10 h-10 shrink-0 text-dark" />
                          <div className="text-left text-dark">
                            <p className="font-bold text-xl">哎呀！</p>
                            <p className="opacity-90">正确是 {getNoteName(targetNote!).fullName}，你选了 {getNoteName(selectedNote!).fullName}</p>
                          </div>
                        </div>
                      )}
                      
                      <Button onClick={startNewRound} className="mt-8 px-8 py-3 text-lg w-full max-w-xs" size="lg">
                        下一题 <ArrowLeft className="w-6 h-6 ml-2 rotate-180" />
                      </Button>
                    </MotionDiv>
                  )}
               </AnimatePresence>
            </div>
        </div>

        {/* Bottom: Piano - Fixed at bottom */}
        <div className="shrink-0 w-full pb-4 pt-2">
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
