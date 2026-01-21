import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PianoKeyboard } from '../components/game/PianoKeyboard';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getRandomNote, getFrequency, getNoteName } from '../utils/musicTheory';
import { ArrowLeft, Play, Volume2, Trophy, Frown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../lib/supabase';
import { ShareButton } from '../components/ui/ShareButton';

const MotionDiv = motion.div as any;

type GameStatus = 'idle' | 'playing' | 'guessing' | 'result';

export const QuizMode = () => {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [targetNote, setTargetNote] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  
  const { playNote } = useAudioPlayer();
  const { user, isGuest, updateGuestScore, guestData } = useUserStore();

  const MIN_MIDI = 48; // C3
  const MAX_MIDI = 72; // C5

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
    const { data } = await supabase
      .from('leaderboard')
      .select('best_score')
      .eq('user_id', user.id)
      .eq('game_mode', 'quiz')
      .single();
    
    if (data) {
      setBestScore(data.best_score);
    }
  };

  const saveScore = async (finalScore: number, finalStreak: number) => {
    if (isGuest) {
      updateGuestScore('quiz', finalScore, 1, finalStreak);
      if (finalScore > bestScore) {
        setBestScore(finalScore);
      }
      return;
    }
    
    if (!user) {
      console.log('[QuizMode] No user, skipping score save');
      return;
    }

    try {
      console.log('[QuizMode] Saving score for user:', user.id, 'score:', finalScore);
      
      // Save to Supabase
      const { data: existing, error: fetchError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_mode', 'quiz')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is ok
        console.error('[QuizMode] Error fetching existing score:', fetchError);
      }

      if (existing) {
        // Update if better
        const newBestScore = Math.max(finalScore, existing.best_score);
        const { error: updateError } = await supabase
          .from('leaderboard')
          .update({
            best_score: newBestScore,
            total_games: existing.total_games + 1,
          })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('[QuizMode] Error updating score:', updateError);
        } else {
          console.log('[QuizMode] Score updated successfully');
          setBestScore(newBestScore);
        }
      } else {
        // Create new entry
        const { error: insertError } = await supabase.from('leaderboard').insert({
          user_id: user.id,
          game_mode: 'quiz',
          best_score: finalScore,
          best_level: 1,
          total_games: 1,
        });
        
        if (insertError) {
          console.error('[QuizMode] Error inserting score:', insertError);
        } else {
          console.log('[QuizMode] Score inserted successfully');
          setBestScore(finalScore);
        }
      }
    } catch (err) {
      console.error('[QuizMode] Unexpected error saving score:', err);
    }
  };

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
    playNote(freq, 1.2, 'sine');
  };

  const handleNoteClick = (midi: number) => {
    if (status !== 'guessing') return;
    
    setSelectedNote(midi);
    setStatus('result');
    
    // Play the clicked note
    playNote(getFrequency(midi), 0.4, 'sine');

    if (midi === targetNote) {
      // Correct
      const newScore = score + 10 + (streak * 2);
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      
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
  };

  return (
    <div className="min-h-screen bg-light-bg text-dark p-3 md:p-6 flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 md:mb-8 max-w-6xl mx-auto w-full gap-2">
        <Link to="/">
          <Button variant="ghost" size="sm" className="shrink-0">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">返回</span>
          </Button>
        </Link>
        <div className="flex gap-2 md:gap-4 items-center">
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
                       <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-6">准备好训练你的耳朵了吗？</h2>
                       <Button size="lg" onClick={startNewRound} className="text-base md:text-xl px-8 md:px-12 py-4 md:py-6">
                         <Play className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3" />
                         开始游戏
                       </Button>
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
                      
                      <Button onClick={startNewRound} className="mt-4 md:mt-8 px-6 md:px-8 py-2 md:py-3 text-base md:text-lg w-full max-w-xs" size="lg">
                        下一题 <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 ml-2 rotate-180" />
                      </Button>
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
