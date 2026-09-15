export type ChallengeTaskId = 'warmup' | 'learn' | 'drill' | 'challenge' | 'reward';

export interface ChallengeReward {
  name: string;
  description: string;
  symbol: string;
  rarity: '普通' | '稀有' | '珍藏';
}

export interface ChallengeDay {
  day: number;
  chapter: string;
  title: string;
  goal: string;
  theory: string;
  listeningTip: string;
  notePool: number[];
  mode: 'pitch' | 'interval' | 'sing' | 'chord' | 'melody';
  focusValues?: number[];
  reward: ChallengeReward;
}

export interface DayProgress {
  completedTasks: ChallengeTaskId[];
  attempts: number;
  correct: number;
  startedAt?: string;
  completedAt?: string;
}

export interface ChallengeProgress {
  version: 1;
  startedOn?: string;
  days: Record<string, DayProgress>;
  rewards: number[];
}

export interface ListeningQuestion {
  id: string;
  audioMidis: number[];
  answer: string;
  options: Array<{ value: string; label: string }>;
  feedback: string;
  playTogether?: boolean;
}
