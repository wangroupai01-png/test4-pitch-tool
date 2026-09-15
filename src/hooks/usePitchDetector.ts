import { useCallback, useEffect, useRef, useState } from 'react';
import { autoCorrelate, getNoteFromFrequency } from '../utils/pitchDetection';

export interface PitchData {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  midi: number;
  clarity: number;
}

type BrowserWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

const median = (values: number[], windowSize = 5): number => {
  if (values.length === 0) return 0;
  const window = values.slice(-windowSize).sort((a, b) => a - b);
  return window[Math.floor(window.length / 2)];
};

export const usePitchDetector = () => {
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recentFrequenciesRef = useRef<number[]>([]);
  const silenceFramesRef = useRef(0);
  const lastAnalysisAtRef = useRef(0);

  const analyse = useCallback(() => {
    const analyserNode = analyserRef.current;
    const audioContext = audioContextRef.current;
    if (!analyserNode || !audioContext) return;

    // About 30 analyses per second is visually smooth and avoids running the
    // O(n²) YIN difference function on every display refresh.
    const now = performance.now();
    if (now - lastAnalysisAtRef.current >= 32) {
      lastAnalysisAtRef.current = now;
      const buffer = new Float32Array(analyserNode.fftSize);
      analyserNode.getFloatTimeDomainData(buffer);
      const frequency = autoCorrelate(buffer, audioContext.sampleRate);

      if (frequency > 0) {
        const values = recentFrequenciesRef.current;
        values.push(frequency);
        if (values.length > 7) values.shift();

        const smoothedFrequency = median(values);
        const variance = values.reduce(
          (sum, value) => sum + (value - smoothedFrequency) ** 2,
          0,
        ) / values.length;

        setPitch({
          ...getNoteFromFrequency(smoothedFrequency),
          clarity: Math.max(0, Math.min(1, 1 - variance / 1000)),
        });
        silenceFramesRef.current = 0;
      } else {
        silenceFramesRef.current += 1;
        if (silenceFramesRef.current > 10) {
          setPitch(null);
          recentFrequenciesRef.current = [];
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(analyse);
  }, []);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    analyserRef.current = null;
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close();
    }

    setAnalyser(null);
    setMediaStream(null);
    setIsListening(false);
    setPitch(null);
    setError(null);
    recentFrequenciesRef.current = [];
    silenceFramesRef.current = 0;
  }, []);

  const startListening = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;

    try {
      setError(null);
      setIsStarting(true);
      const browserWindow = window as BrowserWindow;
      const AudioContextConstructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
      if (!AudioContextConstructor) throw new Error('Web Audio API is unavailable');

      const audioContext = new AudioContextConstructor();
      let requestExpired = false;
      const mediaRequest = navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      let timeoutId = 0;
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          requestExpired = true;
          reject(new DOMException('Microphone request timed out', 'TimeoutError'));
        }, 10_000);
      });
      void mediaRequest.then((lateStream) => {
        if (requestExpired) lateStream.getTracks().forEach((track) => track.stop());
      });
      const stream = await Promise.race([mediaRequest, timeout]);
      window.clearTimeout(timeoutId);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 4096;
      analyserNode.smoothingTimeConstant = 0.8;
      audioContext.createMediaStreamSource(stream).connect(analyserNode);

      audioContextRef.current = audioContext;
      analyserRef.current = analyserNode;
      streamRef.current = stream;
      recentFrequenciesRef.current = [];
      silenceFramesRef.current = 0;
      lastAnalysisAtRef.current = 0;
      setAnalyser(analyserNode);
      setMediaStream(stream);
      setIsListening(true);
      setIsStarting(false);
      animationFrameRef.current = requestAnimationFrame(analyse);
      return true;
    } catch (caughtError) {
      console.error('[PitchDetector] Unable to access microphone:', caughtError);
      const message = caughtError instanceof DOMException && caughtError.name === 'NotAllowedError'
        ? '麦克风权限被拒绝，请在浏览器设置中允许访问。'
        : caughtError instanceof DOMException && caughtError.name === 'TimeoutError'
          ? '等待麦克风权限超时，请检查浏览器权限后重试。'
          : '无法启动麦克风，请检查设备连接后重试。';
      setError(message);
      setIsListening(false);
      setIsStarting(false);
      return false;
    }
  }, [analyse]);

  useEffect(() => stopListening, [stopListening]);

  return { startListening, stopListening, isListening, isStarting, pitch, analyser, mediaStream, error };
};
