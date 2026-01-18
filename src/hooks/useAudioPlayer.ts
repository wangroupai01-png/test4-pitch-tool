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

// Cache for loaded audio buffers
const audioBufferCache: Map<number, AudioBuffer> = new Map();

// Note names for MIDI to note conversion
const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Convert MIDI number to note name for the soundfont URL
const midiToNoteName = (midi: number): string => {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
};

// Piano soundfont URL (using free Salamander Grand Piano samples)
const SOUNDFONT_BASE = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/';

// Load a piano sample for a given MIDI note
const loadPianoSample = async (midi: number): Promise<AudioBuffer | null> => {
  // Check cache first
  if (audioBufferCache.has(midi)) {
    return audioBufferCache.get(midi)!;
  }

  // Clamp to valid piano range
  const clampedMidi = Math.max(21, Math.min(108, midi)); // A0 to C8
  const noteName = midiToNoteName(clampedMidi);
  const url = `${SOUNDFONT_BASE}${noteName}.mp3`;

  try {
    const ctx = getAudioContext();
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to load piano sample for ${noteName}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    // Cache the loaded buffer
    audioBufferCache.set(midi, audioBuffer);
    return audioBuffer;
  } catch (error) {
    console.warn(`Error loading piano sample for ${noteName}:`, error);
    return null;
  }
};

// Preload common notes
const preloadCommonNotes = async () => {
  // Preload C3 to C6 (most commonly used range)
  const notesToPreload = [];
  for (let midi = 48; midi <= 84; midi++) {
    notesToPreload.push(loadPianoSample(midi));
  }
  await Promise.all(notesToPreload);
};

// Start preloading when module loads
preloadCommonNotes();

interface ActiveNote {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
}

export const useAudioPlayer = () => {
  const currentNoteRef = useRef<ActiveNote | null>(null);

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
          } catch (e) {
            // Ignore
          }
        }, 60);
      } catch (e) {
        // Ignore errors
      }
      currentNoteRef.current = null;
    }
  }, []);

  const playNote = useCallback(async (frequency: number, duration: number = 1.5, _type?: OscillatorType) => {
    // Stop any currently playing note first
    stopCurrentNote();

    const ctx = getAudioContext();
    
    // Resume if suspended
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Convert frequency to MIDI note number
    const midi = Math.round(12 * Math.log2(frequency / 440) + 69);
    
    // Try to load the piano sample
    const buffer = await loadPianoSample(midi);
    
    if (!buffer) {
      // Fallback to simple sine wave if sample fails to load
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      return;
    }

    // Play the sampled piano note
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Set initial volume
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    
    // Natural decay - let the sample play, then fade out
    const fadeOutStart = ctx.currentTime + duration - 0.3;
    gainNode.gain.setValueAtTime(0.8, fadeOutStart);
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
      } catch (e) {
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

  return { playNote, stopCurrentNote };
};
