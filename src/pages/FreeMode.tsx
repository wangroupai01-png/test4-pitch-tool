import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, TrendingUp, TrendingDown, RotateCcw, Music, Circle, Square, Play, Trash2, Target } from 'lucide-react';
import { usePitchDetector } from '../hooks/usePitchDetector';
import { PitchVisualizer } from '../components/game/PitchVisualizer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { clsx } from 'clsx';
import { getNoteName, getFrequency } from '../utils/musicTheory';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { InstrumentSelector } from '../components/ui/InstrumentSelector';

// 录音记录类型
interface Recording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
}

export const FreeMode = () => {
  const navigate = useNavigate();
  const { startListening, stopListening, isListening, pitch, mediaStream } = usePitchDetector();
  const { playNote } = useAudioPlayer();
  
  // 音域测试状态
  const [lowestMidi, setLowestMidi] = useState<number | null>(null);
  const [highestMidi, setHighestMidi] = useState<number | null>(null);
  const [isRangeTesting, setIsRangeTesting] = useState(false);
  
  // 录音状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingDurationRef = useRef(0); // 用于在回调中获取最新时长
  
  // 目标音辅助线状态
  const [showTargetLine, setShowTargetLine] = useState(false);
  const [targetMidi, setTargetMidi] = useState<number>(60); // 默认 C4
  
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
      // 如果正在录音，也停止录音
      if (isRecording) {
        stopRecording();
      }
    } else {
      startListening();
    }
  };
  
  // 开始录音
  const startRecording = () => {
    if (!mediaStream) {
      console.error('没有可用的媒体流');
      return;
    }
    
    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      // 使用 ref 获取最新的录音时长
      const finalDuration = recordingDurationRef.current;
      const newRecording: Recording = {
        id: Date.now().toString(),
        blob,
        url,
        duration: finalDuration,
        timestamp: new Date(),
      };
      setRecordings(prev => [newRecording, ...prev].slice(0, 5)); // 最多保留5条
      setRecordingDuration(0);
      recordingDurationRef.current = 0;
    };
    
    mediaRecorder.start(100); // 每100ms收集一次数据
    setIsRecording(true);
    setRecordingDuration(0);
    recordingDurationRef.current = 0;
    
    // 开始计时
    recordingTimerRef.current = setInterval(() => {
      recordingDurationRef.current += 1; // 更新 ref
      setRecordingDuration(prev => prev + 1); // 更新 state 用于 UI 显示
    }, 1000);
  };
  
  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };
  
  // 播放录音
  const playRecording = (recording: Recording) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(recording.url);
    audioRef.current = audio;
    setPlayingId(recording.id);
    
    audio.onended = () => {
      setPlayingId(null);
    };
    
    audio.play();
  };
  
  // 删除录音
  const deleteRecording = (id: string) => {
    setRecordings(prev => {
      const recording = prev.find(r => r.id === id);
      if (recording) {
        URL.revokeObjectURL(recording.url);
      }
      return prev.filter(r => r.id !== id);
    });
  };
  
  // 格式化时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 播放目标音
  const playTargetNote = () => {
    playNote(getFrequency(targetMidi), 1.0, 'sine');
  };
  
  // 清理资源
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      recordings.forEach(r => URL.revokeObjectURL(r.url));
    };
  }, []);

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
        <InstrumentSelector />
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
        
        {/* 第二行功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* 录音功能 */}
          <Card className="flex flex-col !p-3 md:!p-4 border-3 border-dark bg-gradient-to-br from-red-50 to-orange-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">录音回放</span>
              </div>
              <div className="flex gap-2 items-center">
                {isRecording && (
                  <span className="text-red-500 font-bold text-sm animate-pulse">
                    ● {formatDuration(recordingDuration)}
                  </span>
                )}
                {isListening && !isRecording ? (
                  <Button size="sm" variant="primary" onClick={startRecording} className="text-xs !px-3 !py-1 bg-red-500 hover:bg-red-600">
                    <Circle className="w-3 h-3 mr-1 fill-current" />
                    开始录音
                  </Button>
                ) : isRecording ? (
                  <Button size="sm" variant="outline" onClick={stopRecording} className="text-xs !px-3 !py-1">
                    <Square className="w-3 h-3 mr-1" />
                    停止
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">需先开启麦克风</span>
                )}
              </div>
            </div>
            
            {/* 录音列表 */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recordings.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">暂无录音</p>
              ) : (
                recordings.map((recording, index) => (
                  <div key={recording.id} className="flex items-center gap-2 bg-white rounded-lg border-2 border-dark p-2">
                    <Button 
                      size="sm" 
                      variant={playingId === recording.id ? "secondary" : "outline"}
                      onClick={() => playRecording(recording)}
                      className="!p-1.5"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">录音 #{recordings.length - index}</p>
                      <p className="text-xs text-slate-400">{formatDuration(recording.duration)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => deleteRecording(recording.id)}
                      className="!p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
          
          {/* 目标音辅助线 */}
          <Card className="flex flex-col !p-3 md:!p-4 border-3 border-dark bg-gradient-to-br from-green-50 to-teal-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-secondary" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">目标音辅助</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-slate-500">{showTargetLine ? '开启' : '关闭'}</span>
                <div 
                  className={clsx(
                    "w-10 h-5 rounded-full border-2 border-dark transition-colors relative",
                    showTargetLine ? "bg-secondary" : "bg-slate-200"
                  )}
                  onClick={() => setShowTargetLine(!showTargetLine)}
                >
                  <div className={clsx(
                    "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white border border-dark transition-all",
                    showTargetLine ? "left-5" : "left-0.5"
                  )} />
                </div>
              </label>
            </div>
            
            {showTargetLine && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input 
                    type="range"
                    min={48}
                    max={84}
                    value={targetMidi}
                    onChange={(e) => setTargetMidi(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white rounded-lg border-2 border-dark px-3 py-1 text-center min-w-[60px]">
                    <span className="text-lg font-black">{getNoteName(targetMidi).note}</span>
                    <span className="text-sm font-bold text-slate-500">{getNoteName(targetMidi).octave}</span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={playTargetNote} className="!p-2">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {!showTargetLine && (
              <p className="text-xs text-slate-400 text-center py-2">开启后可视化器中将显示目标音参考线</p>
            )}
          </Card>
        </div>

        {/* Visualizer Area */}
        <div className="flex-1 min-h-[250px] md:min-h-[500px] border-3 border-dark shadow-neo rounded-3xl overflow-hidden relative bg-dark">
            <PitchVisualizer 
                pitch={pitch} 
                isListening={isListening}
                targetMidi={showTargetLine ? targetMidi : undefined}
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
