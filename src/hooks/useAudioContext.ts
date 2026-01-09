import { useRef, useState, useCallback } from 'react';

export const useAudioContext = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    setIsReady(true);
    return audioContextRef.current;
  }, []);

  return { audioContext: audioContextRef.current, initAudio, isReady };
};

