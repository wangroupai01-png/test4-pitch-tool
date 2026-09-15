import { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TabLayout } from './components/layout/TabLayout';
import { useUserStore } from './store/useUserStore';
import { AchievementToast, registerAchievementCallback } from './components/game/AchievementToast';
import { LevelUpToast, registerLevelUpCallback } from './components/game/LevelUpToast';
import { XPBar } from './components/game/XPBar';

const Home = lazy(() => import('./pages/Home').then(({ Home }) => ({ default: Home })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(({ Onboarding }) => ({ default: Onboarding })));
const FreeMode = lazy(() => import('./pages/FreeMode').then(({ FreeMode }) => ({ default: FreeMode })));
const QuizMode = lazy(() => import('./pages/QuizMode').then(({ QuizMode }) => ({ default: QuizMode })));
const SingMode = lazy(() => import('./pages/SingMode').then(({ SingMode }) => ({ default: SingMode })));
const Learn = lazy(() => import('./pages/Learn').then(({ Learn }) => ({ default: Learn })));
const Practice = lazy(() => import('./pages/Practice').then(({ Practice }) => ({ default: Practice })));
const Compete = lazy(() => import('./pages/Compete').then(({ Compete }) => ({ default: Compete })));
const Profile = lazy(() => import('./pages/Profile').then(({ Profile }) => ({ default: Profile })));
const Settings = lazy(() => import('./pages/Settings').then(({ Settings }) => ({ default: Settings })));
const SkillDetail = lazy(() => import('./pages/SkillDetail').then(({ SkillDetail }) => ({ default: SkillDetail })));
const LessonPage = lazy(() => import('./pages/LessonPage').then(({ LessonPage }) => ({ default: LessonPage })));
const Achievements = lazy(() => import('./pages/Achievements').then(({ Achievements }) => ({ default: Achievements })));
const DailyChallenge = lazy(() => import('./pages/DailyChallenge').then(({ DailyChallenge }) => ({ default: DailyChallenge })));
const Review = lazy(() => import('./pages/Review').then(({ Review }) => ({ default: Review })));
const Stats = lazy(() => import('./pages/Stats').then(({ Stats }) => ({ default: Stats })));
const Friends = lazy(() => import('./pages/Friends').then(({ Friends }) => ({ default: Friends })));
const League = lazy(() => import('./pages/League').then(({ League }) => ({ default: League })));
const FriendPK = lazy(() => import('./pages/FriendPK').then(({ FriendPK }) => ({ default: FriendPK })));
const Challenge30 = lazy(() => import('./pages/Challenge30').then(({ Challenge30 }) => ({ default: Challenge30 })));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
    <div className="rounded-xl border-3 border-dark bg-white px-5 py-3 font-bold shadow-neo-sm">
      正在加载练习…
    </div>
  </div>
);

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

// 全局 XPBar 包装组件 - 在除了 onboarding 之外的所有页面显示
const GlobalXPBar = () => {
  const location = useLocation();
  
  // 不在 onboarding 页面显示 XPBar
  if (location.pathname === '/onboarding') {
    return null;
  }
  
  return <XPBar />;
};

// 游客 Onboarding 检测组件
const GuestOnboardingCheck = () => {
  const location = useLocation();
  const { isGuest, isLoading, onboardingCompleted } = useUserStore();
  
  // 只在以下条件满足时重定向到 onboarding：
  // 1. 加载完成
  // 2. 是游客
  // 3. 不是在 onboarding 页面
  // 4. 是首页（/learn 或 /）
  // 5. 全局状态和 localStorage 都显示未完成 onboarding
  if (!isLoading && isGuest && location.pathname !== '/onboarding') {
    const isMainPage = location.pathname === '/learn' || location.pathname === '/';
    if (isMainPage) {
      // 同时检查全局状态和 localStorage
      const localCompleted = localStorage.getItem('onboarding_completed') === 'true';
      if (!onboardingCompleted && !localCompleted) {
        return <Navigate to="/onboarding" replace />;
      }
    }
  }
  
  return null;
};

function App() {
  const initialize = useUserStore((state) => state.initialize);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  const showNextAchievement = useCallback(() => {
    if (achievementQueue.length > 0) {
      const [next, ...rest] = achievementQueue;
      setCurrentAchievement(next);
      setAchievementQueue(rest);
    } else {
      setCurrentAchievement(null);
    }
  }, [achievementQueue]);

  const handleAchievementClose = useCallback(() => {
    showNextAchievement();
  }, [showNextAchievement]);

  useEffect(() => {
    initialize();
    
    // 注册成就回调
    registerAchievementCallback((achievement: Achievement) => {
      setCurrentAchievement((current) => {
        if (!current) return achievement;
        setAchievementQueue((queue) => [...queue, achievement]);
        return current;
      });
    });
    
    // 注册升级回调
    registerLevelUpCallback((level: number) => {
      setLevelUpLevel(level);
    });
  }, [initialize]);
  
  return (
    <Router>
      <div className="min-h-screen bg-light-bg font-sans text-dark">
        {/* Achievement Toast */}
        <AchievementToast 
          achievement={currentAchievement} 
          onClose={handleAchievementClose}
        />
        
        {/* Level Up Toast */}
        <LevelUpToast 
          newLevel={levelUpLevel} 
          onClose={() => setLevelUpLevel(null)}
        />
        
        {/* 全局经验条 - 在所有页面顶部显示 */}
        <GlobalXPBar />
        
        {/* 游客 Onboarding 检测 */}
        <GuestOnboardingCheck />
        
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Tab Layout Routes */}
          <Route element={<TabLayout />}>
            <Route path="/learn" element={<Learn />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/compete" element={<Compete />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          {/* Full Screen Routes (without tabs) */}
          <Route path="/free" element={<FreeMode />} />
          <Route path="/quiz" element={<QuizMode />} />
          <Route path="/sing" element={<SingMode />} />
          <Route path="/learn/skill/:skillId" element={<SkillDetail />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/daily-challenge" element={<DailyChallenge />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/review" element={<Review />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/league" element={<League />} />
          <Route path="/pk/:challengeId" element={<FriendPK />} />
          <Route path="/challenge-30" element={<Challenge30 />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Legacy Home - redirect to Learn */}
          <Route path="/home" element={<Home />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/learn" replace />} />
        </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
