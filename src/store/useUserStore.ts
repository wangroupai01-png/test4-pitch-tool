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
  
  // Onboarding state
  onboardingCompleted: boolean;
  needsOnboarding: boolean;
  
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
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null; needsOnboarding?: boolean }>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateGuestScore: (mode: 'quiz' | 'sing', score: number, level?: number, streak?: number) => void;
  syncGuestDataToCloud: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  refreshProfile: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  setOnboardingCompleted: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isGuest: true,
      onboardingCompleted: false,
      needsOnboarding: false,
      
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          return { error: error.message };
        }
        
        // Sync guest data after login
        await get().syncGuestDataToCloud();
        
        // Check onboarding status
        if (data.user) {
          const needsOnboarding = await get().checkOnboardingStatus();
          return { error: null, needsOnboarding };
        }
        
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
      
      refreshProfile: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            set({ profile });
          }
        } catch (err) {
          console.error('Failed to refresh profile:', err);
        }
      },
      
      checkOnboardingStatus: async () => {
        const { user } = get();
        if (!user) {
          // 游客：检查本地存储
          const completed = localStorage.getItem('onboarding_completed') === 'true';
          set({ onboardingCompleted: completed, needsOnboarding: !completed });
          return !completed;
        }
        
        try {
          // 1. 先检查 user_onboarding 表
          const { data: onboardingData } = await supabase
            .from('user_onboarding')
            .select('onboarding_completed')
            .eq('user_id', user.id)
            .maybeSingle();
          
          // 如果有引导记录，使用记录的状态
          if (onboardingData !== null) {
            const completed = onboardingData.onboarding_completed;
            set({ onboardingCompleted: completed, needsOnboarding: !completed });
            return !completed;
          }
          
          // 2. 没有数据库记录 - 检查多种情况
          
          // 2a. 检查是否为老用户（有学习进度）
          const { count: lessonCount } = await supabase
            .from('user_lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          if (lessonCount && lessonCount > 0) {
            // 老用户，自动创建引导完成记录
            await supabase.from('user_onboarding').upsert({
              user_id: user.id,
              onboarding_completed: true,
              ability_level: 'intermediate', // 老用户默认中级
              onboarding_completed_at: new Date().toISOString(),
            });
            set({ onboardingCompleted: true, needsOnboarding: false });
            return false;
          }
          
          // 2b. 检查游客是否已做过引导（登录前以游客身份完成的）
          const guestOnboardingCompleted = localStorage.getItem('onboarding_completed') === 'true';
          if (guestOnboardingCompleted) {
            // 游客已做过引导，同步到数据库，不需要再做
            const guestAbilityLevel = localStorage.getItem('onboarding_ability_level') || 'beginner';
            const guestAbilityScore = parseInt(localStorage.getItem('onboarding_ability_score') || '0', 10);
            
            await supabase.from('user_onboarding').upsert({
              user_id: user.id,
              onboarding_completed: true,
              ability_level: guestAbilityLevel,
              ability_test_score: guestAbilityScore,
              onboarding_completed_at: new Date().toISOString(),
            });
            set({ onboardingCompleted: true, needsOnboarding: false });
            return false;
          }
          
          // 3. 真正的新用户（无数据库记录、无课程进度、游客未做引导）
          set({ onboardingCompleted: false, needsOnboarding: true });
          return true;
        } catch (err) {
          console.error('Failed to check onboarding:', err);
          // 如果查询失败，默认不需要引导（避免阻塞用户）
          set({ onboardingCompleted: true, needsOnboarding: false });
          return false;
        }
      },
      
      setOnboardingCompleted: () => {
        set({ onboardingCompleted: true, needsOnboarding: false });
      },
    }),
    {
      name: 'melody-challenger-user',
      partialize: (state) => ({ guestData: state.guestData }),
    }
  )
);
