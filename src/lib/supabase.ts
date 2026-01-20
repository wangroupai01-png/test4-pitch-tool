import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuxfmetjjfeaexwllpyd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGZtZXRqamZlYWV4d2xscHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDc1NjQsImV4cCI6MjA4NDMyMzU2NH0.78SpgeH3ljzkjbkkBZV1gCgPhPpDLEIVkL55NfVvk2c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameScore {
  id: string;
  user_id: string;
  game_mode: 'quiz' | 'sing';
  score: number;
  level: number;
  streak: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  game_mode: 'quiz' | 'sing';
  best_score: number;
  best_level: number;
  total_games: number;
  updated_at: string;
}
