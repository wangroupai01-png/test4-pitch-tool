import { useNavigate } from 'react-router-dom';
import { Mic, Music, Headphones, ArrowRight, Trophy } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { UserButton } from '../components/auth/UserButton';
import { ShareButton } from '../components/ui/ShareButton';
import { Leaderboard } from '../components/game/Leaderboard';

export const Home = () => {
  const navigate = useNavigate();
  const MotionDiv = motion.div as any;
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState<'quiz' | 'sing'>('quiz');

  const modes = [
    {
      id: 'free',
      title: '自由练习',
      description: '实时显示音高和波形，自由哼唱',
      icon: <Mic className="w-8 h-8 md:w-10 md:h-10" />,
      colorVariant: 'accent',
      path: '/free'
    },
    {
      id: 'quiz',
      title: '听音辨位',
      description: '聆听音符，判断它的音高',
      icon: <Headphones className="w-8 h-8 md:w-10 md:h-10" />,
      colorVariant: 'secondary',
      path: '/quiz'
    },
    {
      id: 'sing',
      title: '哼唱闯关',
      description: '根据提示哼唱正确的音高',
      icon: <Music className="w-8 h-8 md:w-10 md:h-10" />,
      colorVariant: 'primary',
      path: '/sing'
    }
  ];

  const handleShowLeaderboard = (mode: 'quiz' | 'sing') => {
    setLeaderboardMode(mode);
    setShowLeaderboard(true);
  };

  return (
    <div className="min-h-screen bg-light-bg p-4 md:p-6 flex flex-col items-center pattern-grid-lg overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl flex items-center justify-between mb-4 md:mb-8 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShowLeaderboard('quiz')}
            className="flex items-center gap-2 bg-white border-3 border-dark px-3 md:px-4 py-2 rounded-full font-bold shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm md:text-base"
          >
            <Trophy className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            <span className="hidden sm:inline">排行榜</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <ShareButton />
          <UserButton />
        </div>
      </header>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <MotionDiv 
          initial={{ opacity: 0, y: -20, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          className="text-center mb-8 md:mb-16 relative w-full max-w-4xl px-2 md:px-4 z-10"
        >
          {/* Decorative shapes - hidden on mobile */}
          <div className="absolute -top-6 left-10 md:-left-4 w-20 h-20 bg-accent rounded-full border-3 border-dark hidden md:block animate-bounce-slow shadow-neo" />
          <div className="absolute -bottom-4 right-10 md:-right-4 w-16 h-16 bg-secondary rounded-full border-3 border-dark hidden md:block animate-bounce-slow shadow-neo" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/50 blur-3xl -z-10 rounded-full"></div>

          <h1 className="text-4xl sm:text-5xl md:text-8xl font-black text-dark mb-4 md:mb-6 tracking-tight drop-shadow-sm relative">
            音高大师<br/>
            <span className="text-white bg-primary px-4 md:px-6 py-1 border-3 border-dark shadow-neo inline-block rotate-2 mt-2 md:mt-4 transform hover:rotate-3 transition-transform text-2xl sm:text-3xl md:text-6xl">PitchMaster</span>
          </h1>
          <p className="text-base sm:text-lg md:text-2xl font-bold text-dark max-w-lg mx-auto bg-white border-3 border-dark p-4 md:p-6 shadow-neo-sm -rotate-1 mt-4 md:mt-8 relative z-10">
            你的私人音准训练师。拒绝枯燥，开始游戏！
          </p>
        </MotionDiv>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl w-full px-4 md:px-12">
          {modes.map((mode, index) => (
            <MotionDiv
              key={mode.id}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              className="h-full"
              onHoverStart={() => setHoveredMode(mode.id)}
              onHoverEnd={() => setHoveredMode(null)}
            >
              <Card 
                onClick={() => navigate(mode.path)}
                variant={hoveredMode === mode.id ? (mode.colorVariant as any) : 'white'}
                className="h-full flex flex-col items-start justify-between min-h-[200px] md:min-h-[320px] group relative overflow-visible transition-colors duration-200" 
              >
                <div className="w-full">
                  <div className={`mb-4 md:mb-6 p-3 md:p-4 border-3 border-dark rounded-full inline-block shadow-neo-sm group-hover:rotate-12 transition-transform text-dark ${hoveredMode === mode.id ? 'bg-white/90' : 'bg-white'}`}>
                    {mode.icon}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mb-2 md:mb-3">{mode.title}</h3>
                  <p className="text-base md:text-lg font-bold opacity-90 leading-relaxed">{mode.description}</p>
                </div>
                <div className="w-full flex justify-end mt-3 md:mt-4">
                  <div className={`p-2 md:p-3 rounded-full transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform border-2 border-transparent shadow-none group-hover:shadow-lg ${hoveredMode === mode.id ? 'bg-white text-dark group-hover:border-dark' : 'bg-dark text-white group-hover:border-white'}`}>
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </div>
              </Card>
            </MotionDiv>
          ))}
        </div>
      </div>
      
      <footer className="mt-12 md:mt-16 font-bold border-3 border-dark bg-white px-6 md:px-8 py-2 md:py-3 shadow-neo rounded-full rotate-1 hover:rotate-0 transition-transform cursor-default text-dark z-10 text-sm md:text-base">
        Designed for Music Lovers 🎵
      </footer>
      
      {/* Leaderboard Modal */}
      <Leaderboard 
        isOpen={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)} 
        mode={leaderboardMode}
      />
    </div>
  );
};
