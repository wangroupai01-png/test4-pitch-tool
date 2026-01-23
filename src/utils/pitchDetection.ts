// YIN-based pitch detection algorithm
// More accurate than simple autocorrelation

export const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
  const SIZE = buffer.length;
  
  // Calculate RMS for noise gate
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);

  // Noise gate - ignore very quiet signals
  if (rms < 0.01) return -1;

  // YIN algorithm implementation
  const yinBufferSize = Math.floor(SIZE / 2);
  const yinBuffer = new Float32Array(yinBufferSize);
  
  // Step 1: Calculate the difference function
  for (let tau = 0; tau < yinBufferSize; tau++) {
    yinBuffer[tau] = 0;
    for (let i = 0; i < yinBufferSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      yinBuffer[tau] += delta * delta;
    }
  }
  
  // Step 2: Cumulative mean normalized difference function
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < yinBufferSize; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }
  
  // Step 3: Absolute threshold
  // Find the first dip below threshold
  const threshold = 0.1;
  let tauEstimate = -1;
  
  for (let tau = 2; tau < yinBufferSize; tau++) {
    if (yinBuffer[tau] < threshold) {
      // Find the local minimum
      while (tau + 1 < yinBufferSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }
  
  // If no pitch found with strict threshold, try a more lenient one
  if (tauEstimate === -1) {
    let minVal = Infinity;
    let minTau = -1;
    for (let tau = 2; tau < yinBufferSize; tau++) {
      if (yinBuffer[tau] < minVal && yinBuffer[tau] < 0.5) {
        minVal = yinBuffer[tau];
        minTau = tau;
      }
    }
    if (minTau !== -1) {
      tauEstimate = minTau;
    }
  }
  
  if (tauEstimate === -1) return -1;
  
  // Step 4: Parabolic interpolation for sub-sample precision
  let betterTau = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < yinBufferSize - 1) {
    const s0 = yinBuffer[tauEstimate - 1];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[tauEstimate + 1];
    const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    if (isFinite(adjustment)) {
      betterTau = tauEstimate + adjustment;
    }
  }
  
  // Calculate frequency
  const frequency = sampleRate / betterTau;
  
  // Validate frequency range (human voice: ~80Hz to ~1100Hz, generous: 60Hz to 1500Hz)
  if (frequency < 60 || frequency > 1500) return -1;
  
  return frequency;
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
