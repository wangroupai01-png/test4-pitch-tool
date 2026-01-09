import { useEffect, useRef, useState, useCallback } from 'react';
import { autoCorrelate, getNoteFromFrequency } from '../utils/pitchDetection';

export interface PitchData {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  midi: number;
  clarity: number; // Placeholder for confidence
}

export const usePitchDetector = () => {
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startListening = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new (AudioContextClass as any)();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      setIsListening(true);
      updatePitch();
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
            audioContextRef.current = null;
        });
    }
    setIsListening(false);
    setPitch(null);
  }, []);

  const updatePitch = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    const frequency = autoCorrelate(buffer, audioContextRef.current!.sampleRate);
    
    if (frequency > -1) {
      const noteData = getNoteFromFrequency(frequency);
      setPitch({ ...noteData, clarity: 1 });
    } else {
        // Keep showing the last note or clear? Let's keep it null for silence
      // But for UI stability, maybe handle this in the UI
      // setPitch(null); 
    }

    requestRef.current = requestAnimationFrame(updatePitch);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return { 
    startListening, 
    stopListening, 
    isListening, 
    pitch,
    analyser: analyserRef.current // Expose for visualizer
  };
};

