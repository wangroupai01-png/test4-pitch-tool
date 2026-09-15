import { useRef, useEffect, useCallback } from 'react';

// Singleton AudioContext
let globalAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!globalAudioContext || globalAudioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioContext = new AudioContextClass();
  }
  return globalAudioContext;
};

// iOS 音频激活：必须在用户交互时同步调用
let audioActivated = false;

const activateAudioOnUserInteraction = () => {
  if (audioActivated) return;
  
  const ctx = getAudioContext();
  
  // 尝试恢复 AudioContext
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      console.log('[Audio] AudioContext resumed successfully');
      audioActivated = true;
    }).catch(err => {
      console.warn('[Audio] Failed to resume AudioContext:', err);
    });
  } else {
    audioActivated = true;
  }
  
  // 播放静音音频来"解锁" iOS 音频
  const silentBuffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = silentBuffer;
  source.connect(ctx.destination);
  source.start(0);
  
  console.log('[Audio] Audio activation triggered');
};

// 在页面首次用户交互时激活音频
if (typeof window !== 'undefined') {
  const activationEvents = ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'];
  
  const handleFirstInteraction = () => {
    activateAudioOnUserInteraction();
    // 移除监听器，只需激活一次
    activationEvents.forEach(event => {
      document.removeEventListener(event, handleFirstInteraction, true);
    });
  };
  
  activationEvents.forEach(event => {
    document.addEventListener(event, handleFirstInteraction, true);
  });
}

// 可用乐器列表
export const INSTRUMENTS = {
  acoustic_grand_piano: { name: '钢琴', icon: '🎹', category: '键盘' },
  acoustic_guitar_nylon: { name: '古典吉他', icon: '🎸', category: '弦乐' },
  acoustic_guitar_steel: { name: '民谣吉他', icon: '🎸', category: '弦乐' },
  electric_guitar_clean: { name: '电吉他', icon: '🎸', category: '弦乐' },
  violin: { name: '小提琴', icon: '🎻', category: '弦乐' },
  cello: { name: '大提琴', icon: '🎻', category: '弦乐' },
  flute: { name: '长笛', icon: '🎵', category: '管乐' },
  clarinet: { name: '单簧管', icon: '🎵', category: '管乐' },
  soprano_sax: { name: '萨克斯', icon: '🎷', category: '管乐' },
  trumpet: { name: '小号', icon: '🎺', category: '铜管' },
  trombone: { name: '长号', icon: '🎺', category: '铜管' },
  vibraphone: { name: '颤音琴', icon: '🎶', category: '打击' },
  marimba: { name: '马林巴', icon: '🥁', category: '打击' },
  xylophone: { name: '木琴', icon: '🎶', category: '打击' },
  music_box: { name: '音乐盒', icon: '🎵', category: '特殊' },
  celesta: { name: '钢片琴', icon: '🔔', category: '特殊' },
} as const;

export type InstrumentId = keyof typeof INSTRUMENTS;

// 默认乐器
let currentInstrument: InstrumentId = 'acoustic_grand_piano';

// 获取当前乐器
export const getCurrentInstrument = () => currentInstrument;

// 设置当前乐器
export const setCurrentInstrument = (instrument: InstrumentId) => {
  currentInstrument = instrument;
};

// Cache for loaded audio buffers - 按乐器分类
const audioBufferCache: Map<string, AudioBuffer> = new Map();

// Note names for MIDI to note conversion
const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Convert MIDI number to note name for the soundfont URL
const midiToNoteName = (midi: number): string => {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
};

// Soundfont URL base - 使用 jsDelivr CDN 加速（比 GitHub Pages 快 2-3 倍）
const SOUNDFONT_BASE = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/';

// Load a sample for a given MIDI note and instrument
const loadInstrumentSample = async (midi: number, instrument: InstrumentId = currentInstrument): Promise<AudioBuffer | null> => {
  const cacheKey = `${instrument}:${midi}`;
  
  // Check cache first
  if (audioBufferCache.has(cacheKey)) {
    return audioBufferCache.get(cacheKey)!;
  }

  // Clamp to valid range
  const clampedMidi = Math.max(21, Math.min(108, midi)); // A0 to C8
  const noteName = midiToNoteName(clampedMidi);
  const url = `${SOUNDFONT_BASE}${instrument}-mp3/${noteName}.mp3`;

  try {
    const ctx = getAudioContext();
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to load ${instrument} sample for ${noteName}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    // Cache the loaded buffer
    audioBufferCache.set(cacheKey, audioBuffer);
    return audioBuffer;
  } catch (error) {
    console.warn(`Error loading ${instrument} sample for ${noteName}:`, error);
    return null;
  }
};

// Preload common notes for an instrument with progress callback
const preloadCommonNotes = async (
  instrument: InstrumentId = 'acoustic_grand_piano',
  onProgress?: (loaded: number, total: number) => void
) => {
  // 极速模式：只预加载 5 个核心音（C4, E4, G4, C5 + 中间A4）
  // 覆盖基础练习需求，其他音符按需即时加载
  const essentialNotes = [60, 64, 67, 69, 72]; // C4, E4, G4, A4, C5
  
  const total = essentialNotes.length;
  let loaded = 0;
  
  // 全并行加载
  const promises = essentialNotes.map(async (midi) => {
    await loadInstrumentSample(midi, instrument);
    loaded++;
    if (onProgress) {
      onProgress(loaded, total);
    }
  });
  
  await Promise.all(promises);
  
  // 后台静默加载其他常用音符（不阻塞UI）
  const extendedNotes = [62, 65, 71, 74, 76, 79]; // D4, F4, B4, D5, E5, G5
  extendedNotes.forEach(midi => {
    loadInstrumentSample(midi, instrument).catch(() => {});
  });
};

// Preload function for switching instruments with progress callback
export const preloadInstrument = async (
  instrument: InstrumentId,
  onProgress?: (loaded: number, total: number) => void
) => {
  await preloadCommonNotes(instrument, onProgress);
};

interface ActiveNote {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
}

export const useAudioPlayer = () => {
  const currentNoteRef = useRef<ActiveNote | null>(null);
  
  // Always ready after initial module load (preloading is async but non-blocking)
  const isReady = true;

  const stopCurrentNote = useCallback(() => {
    if (currentNoteRef.current) {
      const { source, gainNode } = currentNoteRef.current;
      try {
        // Fade out quickly to avoid clicks
        const ctx = getAudioContext();
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        setTimeout(() => {
          try {
            source.stop();
            source.disconnect();
            gainNode.disconnect();
          } catch {
            // Ignore
          }
        }, 60);
      } catch {
        // Ignore errors
      }
      currentNoteRef.current = null;
    }
  }, []);

  const playNote = useCallback(async (frequency: number, duration: number = 1.5, _type?: OscillatorType, instrument?: InstrumentId) => {
    // Stop any currently playing note first
    stopCurrentNote();

    const ctx = getAudioContext();
    
    // Resume if suspended (iOS requirement)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        console.log('[Audio] Context resumed in playNote');
      } catch (err) {
        console.warn('[Audio] Failed to resume context:', err);
      }
    }
    
    // 额外的 iOS 激活尝试
    if (!audioActivated) {
      activateAudioOnUserInteraction();
    }

    // Convert frequency to MIDI note number
    const midi = Math.round(12 * Math.log2(frequency / 440) + 69);
    
    // Try to load the instrument sample (use passed instrument or current global setting)
    const buffer = await loadInstrumentSample(midi, instrument || currentInstrument);
    
    if (!buffer) {
      // Fallback to simple sine wave if sample fails to load
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(1.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      return;
    }

    // Play the sampled note
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Set initial volume (increased for better audibility)
    const volume = 2.0;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    
    // Natural decay - let the sample play, then fade out
    const fadeOutStart = ctx.currentTime + duration - 0.3;
    gainNode.gain.setValueAtTime(volume, fadeOutStart);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    source.start(0);
    
    // Store reference
    currentNoteRef.current = { source, gainNode };
    
    // Stop after duration
    source.stop(ctx.currentTime + duration + 0.1);
    
    // Cleanup
    source.onended = () => {
      try {
        source.disconnect();
        gainNode.disconnect();
      } catch {
        // Ignore
      }
      if (currentNoteRef.current?.source === source) {
        currentNoteRef.current = null;
      }
    };
  }, [stopCurrentNote]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCurrentNote();
    };
  }, [stopCurrentNote]);

  return { playNote, stopCurrentNote, isReady };
};
