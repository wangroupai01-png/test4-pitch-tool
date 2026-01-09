export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const getFrequency = (midi: number): number => {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

export const getNoteName = (midi: number): { note: string; octave: number; fullName: string } => {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[noteIndex];
  return {
    note,
    octave,
    fullName: `${note}${octave}`
  };
};

export const getRandomNote = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


