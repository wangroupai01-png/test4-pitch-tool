import { useRef, useEffect } from 'react';

export const useAudioPlayer = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playNote = (frequency: number, duration: number = 0.5, type: OscillatorType = 'triangle') => {
    if (!audioContextRef.current) {
        // Re-init if closed or null
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
    }
    
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }

    const ctx = audioContextRef.current;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.05); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // Decay
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  return { playNote };
};

