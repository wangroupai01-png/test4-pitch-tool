import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X } from 'lucide-react';

const MotionDiv = motion.div as any;

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      // 5秒后自动关闭
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {isVisible && achievement && (
        <MotionDiv
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 15 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl border-4 border-dark shadow-neo p-1">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              {/* Icon */}
              <MotionDiv
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-3 border-dark shadow-neo-sm text-3xl"
              >
                {achievement.icon || '🏆'}
              </MotionDiv>

              {/* Content */}
              <div className="flex-1">
                <p className="text-sm font-bold text-accent mb-1 flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  成就解锁！
                </p>
                <h3 className="font-black text-lg text-dark">{achievement.name}</h3>
                <p className="text-sm text-slate-500 font-medium">{achievement.description}</p>
                {achievement.xp_reward > 0 && (
                  <span className="inline-block mt-2 text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    +{achievement.xp_reward} XP
                  </span>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

// 成就通知管理器 - 用于全局显示成就
interface AchievementNotification {
  id: string;
  achievement: Achievement;
}

const achievementQueue: AchievementNotification[] = [];
let showAchievementCallback: ((achievement: Achievement) => void) | null = null;

export const registerAchievementCallback = (callback: (achievement: Achievement) => void) => {
  showAchievementCallback = callback;
  // 显示队列中的成就
  if (achievementQueue.length > 0) {
    const next = achievementQueue.shift();
    if (next) callback(next.achievement);
  }
};

export const showAchievementToast = (achievement: Achievement) => {
  if (showAchievementCallback) {
    showAchievementCallback(achievement);
  } else {
    // 如果回调还没注册，加入队列
    achievementQueue.push({ id: achievement.id, achievement });
  }
};
