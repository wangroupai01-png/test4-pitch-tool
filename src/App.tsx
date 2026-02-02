import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Onboarding } from './pages/Onboarding';
import { FreeMode } from './pages/FreeMode';
import { QuizMode } from './pages/QuizMode';
import { SingMode } from './pages/SingMode';
import { Learn } from './pages/Learn';
import { Practice } from './pages/Practice';
import { Compete } from './pages/Compete';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { SkillDetail } from './pages/SkillDetail';
import { LessonPage } from './pages/LessonPage';
import { Achievements } from './pages/Achievements';
import { DailyChallenge } from './pages/DailyChallenge';
import { Review } from './pages/Review';
import { Stats } from './pages/Stats';
import { Friends } from './pages/Friends';
import { League } from './pages/League';
import { TabLayout } from './components/layout/TabLayout';
import { useUserStore } from './store/useUserStore';
import { AchievementToast, registerAchievementCallback } from './components/game/AchievementToast';
import { LevelUpToast, registerLevelUpCallback } from './components/game/LevelUpToast';
import { XPBar } from './components/game/XPBar';

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
  const { isGuest, isLoading } = useUserStore();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    // 只在以下条件满足时检测：
    // 1. 加载完成
    // 2. 是游客
    // 3. 不是在 onboarding 页面
    // 4. 是首页（/learn 或 /）
    if (!isLoading && isGuest && location.pathname !== '/onboarding') {
      const isMainPage = location.pathname === '/learn' || location.pathname === '/';
      if (isMainPage) {
        // 检查游客是否已完成 onboarding
        const completed = localStorage.getItem('onboarding_completed') === 'true';
        if (!completed) {
          setShouldRedirect(true);
        }
      }
    }
  }, [isLoading, isGuest, location.pathname]);
  
  if (shouldRedirect) {
    return <Navigate to="/onboarding" replace />;
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
      if (currentAchievement) {
        // 如果正在显示成就，加入队列
        setAchievementQueue(prev => [...prev, achievement]);
      } else {
        setCurrentAchievement(achievement);
      }
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
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Legacy Home - redirect to Learn */}
          <Route path="/home" element={<Home />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/learn" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
