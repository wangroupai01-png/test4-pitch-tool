// Simple autocorrelation pitch detection
// Based on typical implementations for web audio

export const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
  const SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Increased noise gate threshold to reduce false positives from background noise
  if (rms < 0.02) return -1;

  // Trim the buffer to the range where signal is significant
  // This helps avoid analyzing silence/noise at the edges
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;

  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const buffer2 = buffer.slice(r1, r2);
  const c = new Array(buffer2.length).fill(0);
  
  // Autocorrelation function
  for (let i = 0; i < buffer2.length; i++) {
    for (let j = 0; j < buffer2.length - i; j++) {
      c[i] = c[i] + buffer2[j] * buffer2[j + i];
    }
  }

  // Find the first peak after the first zero crossing (or minimum)
  // Skip the initial peak at lag 0
  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  
  for (let i = d; i < c.length; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  
  let T0 = maxpos;

  // Parabolic interpolation for better precision
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  // Frequency validation
  // Human vocal range is roughly 85Hz (E2) to 1100Hz (C6)
  // Let's be generous: 50Hz to 2000Hz
  const freq = sampleRate / T0;
  if (freq < 50 || freq > 2000) return -1;

  return freq;
};

// Convert frequency to Note Name
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const getNoteFromFrequency = (frequency: number) => {
  // Safety check for invalid frequencies
  if (!frequency || frequency <= 0 || !isFinite(frequency)) {
    return {
      note: "?",
      octave: 0,
      cents: 0,
      frequency: frequency || 0,
      midi: 0
    };
  }

  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const midi = Math.round(noteNum) + 69;
  
  // Handle edge cases where midi might be negative
  const noteIndex = ((midi % 12) + 12) % 12;
  // Ensure noteIndex is valid integer
  const safeIndex = Math.floor(noteIndex) || 0;
  const note = noteStrings[safeIndex] || "?";
  
  const octave = Math.floor(midi / 12) - 1;
  const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
  
  return {
    note,
    octave,
    cents,
    frequency,
    midi
  };
};
