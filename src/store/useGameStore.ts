import { create } from 'zustand';

interface GameState {
  volume: number;
  setVolume: (volume: number) => void;
  // We can add score or user progress here later
}

export const useGameStore = create<GameState>((set) => ({
  volume: 0.8,
  setVolume: (volume) => set({ volume }),
}));



