import { useEffect, useRef, useState, useCallback } from 'react';
import { autoCorrelate, getNoteFromFrequency } from '../utils/pitchDetection';

export interface PitchData {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  midi: number;
  clarity: number;
}

// Median filter for smoothing - removes outliers
const medianFilter = (values: number[], windowSize: number = 5): number => {
  if (values.length === 0) return 0;
  if (values.length < windowSize) {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }
  const window = values.slice(-windowSize);
  const sorted = [...window].sort((a, b) => a - b);
  return sorted[Math.floor(windowSize / 2)];
};

export const usePitchDetector = () => {
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // For pitch smoothing
  const recentFrequencies = useRef<number[]>([]);
  const lastValidPitch = useRef<PitchData | null>(null);
  const silenceCount = useRef<number>(0);

  const startListening = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new (AudioContextClass as any)();
      }

      // Request higher quality audio for better pitch detection
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });
      streamRef.current = stream;
      
      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      // Larger FFT size for better low-frequency resolution
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      // Reset smoothing state
      recentFrequencies.current = [];
      lastValidPitch.current = null;
      silenceCount.current = 0;
      
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
    recentFrequencies.current = [];
    lastValidPitch.current = null;
  }, []);

  const updatePitch = () => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    const frequency = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    
    if (frequency > 0) {
      // Add to recent frequencies for smoothing
      recentFrequencies.current.push(frequency);
      if (recentFrequencies.current.length > 7) {
        recentFrequencies.current.shift();
      }
      
      // Use median filter to get stable frequency
      const smoothedFrequency = medianFilter(recentFrequencies.current, 5);
      
      const noteData = getNoteFromFrequency(smoothedFrequency);
      
      // Calculate clarity based on how consistent recent readings are
      const variance = recentFrequencies.current.reduce((sum, f) => {
        return sum + Math.pow(f - smoothedFrequency, 2);
      }, 0) / recentFrequencies.current.length;
      const clarity = Math.max(0, Math.min(1, 1 - variance / 1000));
      
      const pitchData = { ...noteData, clarity };
      setPitch(pitchData);
      lastValidPitch.current = pitchData;
      silenceCount.current = 0;
    } else {
      // Silence detected
      silenceCount.current++;
      
      // Keep showing last pitch briefly, then clear
      if (silenceCount.current > 10) {
        setPitch(null);
        recentFrequencies.current = [];
      }
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

