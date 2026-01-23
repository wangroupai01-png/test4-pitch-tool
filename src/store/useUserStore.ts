import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserState {
  // Auth state
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  
  // Guest data (stored locally)
  guestData: {
    quizHighScore: number;
    quizBestStreak: number;
    singHighScore: number;
    singBestLevel: number;
    totalGames: number;
  };
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateGuestScore: (mode: 'quiz' | 'sing', score: number, level?: number, streak?: number) => void;
  syncGuestDataToCloud: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isGuest: true,
      
      guestData: {
        quizHighScore: 0,
        quizBestStreak: 0,
        singHighScore: 0,
        singBestLevel: 0,
        totalGames: 0,
      },
      
      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Fetch user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            set({ 
              user: session.user, 
              profile: profile || null,
              isGuest: false,
              isLoading: false 
            });
          } else {
            set({ isLoading: false, isGuest: true });
          }
          
          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              set({ 
                user: session.user, 
                profile: profile || null,
                isGuest: false 
              });
            } else {
              set({ user: null, profile: null, isGuest: true });
            }
          });
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          set({ isLoading: false });
        }
      },
      
      signInWithEmail: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          return { error: error.message };
        }
        
        // Sync guest data after login
        await get().syncGuestDataToCloud();
        
        return { error: null };
      },
      
      signUpWithEmail: async (email, password, username) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          return { error: error.message };
        }
        
        // Create profile
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            username,
          });
        }
        
        return { error: null };
      },
      
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, isGuest: true });
      },
      
      updateGuestScore: (mode, score, level = 1, streak = 0) => {
        const { guestData } = get();
        
        if (mode === 'quiz') {
          set({
            guestData: {
              ...guestData,
              quizHighScore: Math.max(guestData.quizHighScore, score),
              quizBestStreak: Math.max(guestData.quizBestStreak, streak),
              totalGames: guestData.totalGames + 1,
            }
          });
        } else {
          set({
            guestData: {
              ...guestData,
              singHighScore: Math.max(guestData.singHighScore, score),
              singBestLevel: Math.max(guestData.singBestLevel, level),
              totalGames: guestData.totalGames + 1,
            }
          });
        }
      },
      
      syncGuestDataToCloud: async () => {
        const { user, guestData } = get();
        if (!user) return;
        
        // Sync quiz high score
        if (guestData.quizHighScore > 0) {
          await supabase.from('leaderboard').upsert({
            user_id: user.id,
            game_mode: 'quiz',
            best_score: guestData.quizHighScore,
            best_level: 1,
            total_games: guestData.totalGames,
          }, {
            onConflict: 'user_id,game_mode',
          });
        }
        
        // Sync sing high score
        if (guestData.singHighScore > 0) {
          await supabase.from('leaderboard').upsert({
            user_id: user.id,
            game_mode: 'sing',
            best_score: guestData.singHighScore,
            best_level: guestData.singBestLevel,
            total_games: guestData.totalGames,
          }, {
            onConflict: 'user_id,game_mode',
          });
        }
      },
      
      updateProfile: (updates) => {
        const { profile } = get();
        if (profile) {
          set({ profile: { ...profile, ...updates } });
        }
      },
    }),
    {
      name: 'melody-challenger-user',
      partialize: (state) => ({ guestData: state.guestData }),
    }
  )
);
