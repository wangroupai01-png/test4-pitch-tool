import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Volume2 } from 'lucide-react';
import { 
  INSTRUMENTS, 
  type InstrumentId, 
  getCurrentInstrument, 
  setCurrentInstrument, 
  preloadInstrument 
} from '../../hooks/useAudioPlayer';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

const MotionDiv = motion.div as any;

interface InstrumentSelectorProps {
  compact?: boolean; // 紧凑模式只显示图标
}

export const InstrumentSelector = ({ compact = false }: InstrumentSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentId>(getCurrentInstrument());
  const [loading, setLoading] = useState(false);
  const { playNote } = useAudioPlayer();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 从本地存储加载乐器偏好
  useEffect(() => {
    const savedInstrument = localStorage.getItem('preferredInstrument') as InstrumentId | null;
    if (savedInstrument && INSTRUMENTS[savedInstrument]) {
      setSelectedInstrument(savedInstrument);
      setCurrentInstrument(savedInstrument);
    }
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 按类别分组乐器
  const instrumentsByCategory = Object.entries(INSTRUMENTS).reduce((acc, [id, info]) => {
    if (!acc[info.category]) {
      acc[info.category] = [];
    }
    acc[info.category].push({ id: id as InstrumentId, ...info });
    return acc;
  }, {} as Record<string, { id: InstrumentId; name: string; icon: string; category: string }[]>);

  // 播放动听的试听旋律 (C-E-G-高C 分解大三和弦)
  const playPreviewMelody = async (instrumentId: InstrumentId) => {
    const melody = [
      { freq: 261.63, delay: 0 },      // C4
      { freq: 329.63, delay: 400 },    // E4
      { freq: 392.00, delay: 800 },    // G4
      { freq: 523.25, delay: 1200 },   // C5
    ];
    
    for (const note of melody) {
      setTimeout(() => {
        playNote(note.freq, 0.8, undefined, instrumentId);
      }, note.delay);
    }
  };

  // 选择乐器
  const handleSelectInstrument = async (instrumentId: InstrumentId) => {
    setLoading(true);
    setSelectedInstrument(instrumentId);
    setCurrentInstrument(instrumentId);
    localStorage.setItem('preferredInstrument', instrumentId);
    
    // 先完成预加载
    await preloadInstrument(instrumentId);
    
    // 预加载完成后播放旋律
    playPreviewMelody(instrumentId);
    
    // 延迟关闭，让用户听到完整旋律
    setTimeout(() => {
      setLoading(false);
      setIsOpen(false);
    }, 1500);
  };

  const currentInstrument = INSTRUMENTS[selectedInstrument];

  return (
    <div ref={dropdownRef} className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dark 
          bg-white hover:bg-slate-50 transition-all shadow-neo-sm
          ${loading ? 'opacity-50' : ''}
        `}
        disabled={loading}
      >
        <span className="text-lg">{currentInstrument.icon}</span>
        {!compact && (
          <>
            <span className="font-bold text-sm hidden sm:inline">{currentInstrument.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 max-h-96 overflow-y-auto bg-white rounded-xl border-3 border-dark shadow-neo z-50"
          >
            {/* 标题 */}
            <div className="p-3 border-b-2 border-dark bg-slate-50 sticky top-0">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span className="font-black text-sm">选择乐器音色</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">点击切换，自动试听</p>
            </div>

            {/* 乐器列表 */}
            <div className="p-2">
              {Object.entries(instrumentsByCategory).map(([category, instruments]) => (
                <div key={category} className="mb-2 last:mb-0">
                  <p className="text-xs font-bold text-slate-400 px-2 py-1">{category}</p>
                  <div className="space-y-1">
                    {instruments.map((instrument) => (
                      <button
                        key={instrument.id}
                        onClick={() => handleSelectInstrument(instrument.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left
                          ${selectedInstrument === instrument.id
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'hover:bg-slate-50 border-2 border-transparent'
                          }
                        `}
                      >
                        <span className="text-xl">{instrument.icon}</span>
                        <span className="font-bold text-sm flex-1">{instrument.name}</span>
                        {selectedInstrument === instrument.id && (
                          <span className="text-xs font-bold text-primary">当前</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};
