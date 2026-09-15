import { describe, expect, it } from 'vitest';
import { autoCorrelate, getNoteFromFrequency } from './pitchDetection';

const sineWave = (frequency: number, sampleRate = 48_000, size = 4096, amplitude = 0.8) =>
  Float32Array.from(
    { length: size },
    (_, index) => amplitude * Math.sin((2 * Math.PI * frequency * index) / sampleRate),
  );

describe('pitch detection', () => {
  it.each([
    [110, 'A', 2],
    [220, 'A', 3],
    [440, 'A', 4],
    [523.251, 'C', 5],
  ])('detects %i Hz as %s%i', (frequency, note, octave) => {
    const detected = autoCorrelate(sineWave(frequency), 48_000);
    const result = getNoteFromFrequency(detected);

    expect(detected).toBeGreaterThan(0);
    expect(Math.abs(detected - frequency)).toBeLessThan(1);
    expect(result).toMatchObject({ note, octave });
  });

  it('rejects silence and signals below the noise gate', () => {
    expect(autoCorrelate(new Float32Array(4096), 48_000)).toBe(-1);
    expect(autoCorrelate(sineWave(440, 48_000, 4096, 0.005), 48_000)).toBe(-1);
  });

  it('returns a safe value for invalid frequencies', () => {
    expect(getNoteFromFrequency(Number.NaN)).toMatchObject({ note: '?', midi: 0 });
    expect(getNoteFromFrequency(-1)).toMatchObject({ note: '?', midi: 0 });
  });
});
