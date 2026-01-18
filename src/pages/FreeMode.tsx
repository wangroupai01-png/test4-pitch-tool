import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff } from 'lucide-react';
import { usePitchDetector } from '../hooks/usePitchDetector';
import { PitchVisualizer } from '../components/game/PitchVisualizer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { clsx } from 'clsx';

export const FreeMode = () => {
  const navigate = useNavigate();
  const { startListening, stopListening, isListening, pitch } = usePitchDetector();

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Calculate cents color
  const getTuningStatus = (cents: number) => {
    if (Math.abs(cents) < 10) return { text: '完美!', color: 'text-green-600 bg-green-100' };
    if (Math.abs(cents) < 25) return { text: '不错', color: 'text-yellow-600 bg-yellow-100' };
    return { text: Math.abs(cents) > 50 ? '跑调' : '接近', color: 'text-red-600 bg-red-100' };
  };

  const status = pitch ? getTuningStatus(pitch.cents) : null;

  return (
    <div className="min-h-screen bg-light-bg flex flex-col p-3 md:p-8">
      {/* Header */}
      <header className="mb-4 md:mb-8 flex items-center justify-between gap-2">
        <Button 
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
          <span className="hidden sm:inline">返回</span>
        </Button>
        <h1 className="text-lg sm:text-xl md:text-4xl font-black text-dark bg-white border-3 border-dark px-3 md:px-6 py-1 md:py-2 shadow-neo -rotate-1 text-center truncate">
          自由练习模式
        </h1>
        <div className="w-12 md:w-20 shrink-0"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full gap-4 md:gap-8">
        
        {/* Top Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <Card className="col-span-1 md:col-span-2 flex flex-row items-center justify-between !p-4 md:!p-8 gap-3">
            <div className="flex items-center gap-3 md:gap-6">
              <div className={clsx(
                "w-12 h-12 md:w-16 md:h-16 rounded-full border-3 border-dark flex items-center justify-center transition-all shadow-neo-sm shrink-0",
                isListening ? "bg-red-500 text-white animate-pulse" : "bg-slate-200 text-slate-500"
              )}>
                {isListening ? <Mic className="w-6 h-6 md:w-8 md:h-8" /> : <MicOff className="w-6 h-6 md:w-8 md:h-8" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-500 mb-1">状态</div>
                <div className="font-black text-lg md:text-2xl truncate">
                  {isListening ? '监听中...' : '已停止'}
                </div>
              </div>
            </div>
            <Button 
              onClick={toggleListening}
              variant={isListening ? "secondary" : "primary"}
              size="lg"
              className="min-w-[80px] md:min-w-[160px] text-sm md:text-base shrink-0"
            >
              {isListening ? '停止' : '开始'}
            </Button>
          </Card>

          <Card 
            variant="dark"
            className="flex flex-col items-center justify-center !p-4 md:!p-6 border-3 border-dark relative overflow-hidden"
          >
            {/* Background grid effect */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            <div className="text-xs md:text-sm font-bold text-slate-400 mb-1 md:mb-2 uppercase tracking-widest relative z-10">当前音高</div>
            {pitch ? (
              <div className="text-center relative z-10">
                <div className="text-5xl md:text-7xl font-black font-mono tracking-tighter mb-1 md:mb-2 text-white">
                  {pitch.note}{pitch.octave}
                </div>
                <div className={clsx(
                  "text-xs font-black px-2 md:px-3 py-1 border-2 border-white/20 rounded-full inline-block",
                  status?.color
                )}>
                  {status?.text} ({pitch.cents > 0 ? '+' : ''}{pitch.cents})
                </div>
              </div>
            ) : (
                <div className="text-4xl md:text-6xl font-black text-slate-500 relative z-10">--</div>
            )}
          </Card>
        </div>

        {/* Visualizer Area */}
        <div className="flex-1 min-h-[250px] md:min-h-[500px] border-3 border-dark shadow-neo rounded-3xl overflow-hidden relative bg-dark">
            <PitchVisualizer 
                pitch={pitch} 
                isListening={isListening} 
            />
            
            {!isListening && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white border-3 border-dark p-4 md:p-8 rounded-2xl shadow-neo text-center max-w-[90%] md:max-w-md transform rotate-1">
                        <div className="bg-accent w-14 h-14 md:w-20 md:h-20 rounded-full border-3 border-dark flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-neo-sm">
                          <Mic className="w-7 h-7 md:w-10 md:h-10 text-black" />
                        </div>
                        <h3 className="text-xl md:text-3xl font-black mb-2 md:mb-3">准备好了吗？</h3>
                        <p className="text-base md:text-xl font-bold text-slate-600 mb-4 md:mb-8">
                          戴上耳机效果更好哦！<br/>点击上方按钮开始
                        </p>
                        <ArrowLeft className="w-8 h-8 md:w-12 md:h-12 mx-auto text-black rotate-90 animate-bounce" />
                    </div>
                </div>
            )}
        </div>

      </main>
    </div>
  );
};
