import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, TrendingUp, TrendingDown, RotateCcw, Music } from 'lucide-react';
import { usePitchDetector } from '../hooks/usePitchDetector';
import { PitchVisualizer } from '../components/game/PitchVisualizer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { clsx } from 'clsx';
import { getNoteName } from '../utils/musicTheory';

export const FreeMode = () => {
  const navigate = useNavigate();
  const { startListening, stopListening, isListening, pitch } = usePitchDetector();
  
  // 音域测试状态
  const [lowestMidi, setLowestMidi] = useState<number | null>(null);
  const [highestMidi, setHighestMidi] = useState<number | null>(null);
  const [isRangeTesting, setIsRangeTesting] = useState(false);
  
  // 更新音域
  useEffect(() => {
    if (isRangeTesting && pitch && pitch.clarity > 0.85) {
      const currentMidi = pitch.midi;
      if (lowestMidi === null || currentMidi < lowestMidi) {
        setLowestMidi(currentMidi);
      }
      if (highestMidi === null || currentMidi > highestMidi) {
        setHighestMidi(currentMidi);
      }
    }
  }, [pitch, isRangeTesting, lowestMidi, highestMidi]);
  
  // 开始音域测试
  const startRangeTest = () => {
    setLowestMidi(null);
    setHighestMidi(null);
    setIsRangeTesting(true);
    if (!isListening) {
      startListening();
    }
  };
  
  // 重置音域
  const resetRange = () => {
    setLowestMidi(null);
    setHighestMidi(null);
  };
  
  // 计算音域跨度
  const getRangeSpan = () => {
    if (lowestMidi === null || highestMidi === null) return null;
    const semitones = highestMidi - lowestMidi;
    const octaves = Math.floor(semitones / 12);
    const remaining = semitones % 12;
    if (octaves === 0) return `${remaining}个半音`;
    if (remaining === 0) return `${octaves}个八度`;
    return `${octaves}个八度${remaining}个半音`;
  };

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
          onClick={() => navigate('/practice')}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* 麦克风状态 */}
          <Card className="col-span-2 md:col-span-1 flex flex-row items-center justify-between !p-3 md:!p-4 gap-3">
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-10 h-10 md:w-12 md:h-12 rounded-full border-3 border-dark flex items-center justify-center transition-all shadow-neo-sm shrink-0",
                isListening ? "bg-red-500 text-white animate-pulse" : "bg-slate-200 text-slate-500"
              )}>
                {isListening ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wider text-slate-500">状态</div>
                <div className="font-black text-sm md:text-base truncate">
                  {isListening ? '监听中' : '已停止'}
                </div>
              </div>
            </div>
            <Button 
              onClick={toggleListening}
              variant={isListening ? "secondary" : "primary"}
              size="sm"
              className="shrink-0"
            >
              {isListening ? '停止' : '开始'}
            </Button>
          </Card>

          {/* 当前音高 */}
          <Card 
            variant="dark"
            className="flex flex-col items-center justify-center !p-3 md:!p-4 border-3 border-dark relative overflow-hidden"
          >
            <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest relative z-10">当前音高</div>
            {pitch ? (
              <div className="text-center relative z-10">
                <div className="text-2xl md:text-4xl font-black font-mono tracking-tighter text-white">
                  {pitch.note}{pitch.octave}
                </div>
                <div className={clsx(
                  "text-xs font-black px-2 py-0.5 border-2 border-white/20 rounded-full inline-block",
                  status?.color
                )}>
                  {status?.text}
                </div>
              </div>
            ) : (
                <div className="text-2xl md:text-4xl font-black text-slate-500 relative z-10">--</div>
            )}
          </Card>
          
          {/* 音域测试 */}
          <Card className="col-span-2 flex flex-col !p-3 md:!p-4 border-3 border-dark bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">音域测试</span>
              </div>
              <div className="flex gap-1">
                {!isRangeTesting ? (
                  <Button size="sm" variant="primary" onClick={startRangeTest} className="text-xs !px-2 !py-1">
                    开始测试
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={resetRange} className="text-xs !px-2 !py-1">
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setIsRangeTesting(false)} className="text-xs !px-2 !py-1">
                      完成
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              {/* 最低音 */}
              <div className="flex-1 bg-white rounded-lg border-2 border-dark p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                  <TrendingDown className="w-3 h-3" />
                  <span className="text-xs font-bold">最低</span>
                </div>
                <div className="text-lg md:text-xl font-black">
                  {lowestMidi ? `${getNoteName(lowestMidi).note}${getNoteName(lowestMidi).octave}` : '--'}
                </div>
              </div>
              
              {/* 音域跨度 */}
              <div className="flex-1 text-center">
                <div className="text-xs font-bold text-slate-500 mb-1">跨度</div>
                <div className="text-sm md:text-base font-black text-primary">
                  {getRangeSpan() || '--'}
                </div>
              </div>
              
              {/* 最高音 */}
              <div className="flex-1 bg-white rounded-lg border-2 border-dark p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-bold">最高</span>
                </div>
                <div className="text-lg md:text-xl font-black">
                  {highestMidi ? `${getNoteName(highestMidi).note}${getNoteName(highestMidi).octave}` : '--'}
                </div>
              </div>
            </div>
            
            {isRangeTesting && (
              <p className="text-xs text-center text-slate-500 mt-2 animate-pulse">
                🎤 请从低到高唱出你能发出的所有音...
              </p>
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
