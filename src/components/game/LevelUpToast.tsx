import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const MotionDiv = motion.div as any;

interface LevelUpToastProps {
  newLevel: number | null;
  onClose: () => void;
}

export const LevelUpToast: React.FC<LevelUpToastProps> = ({ newLevel, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (newLevel) {
      setIsVisible(true);
      
      // 触发撒花动效
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#7F5AF0', '#2CB67D', '#FF8906', '#FFD700'],
      });
      
      // 5秒后自动关闭
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newLevel, onClose]);

  return (
    <AnimatePresence>
      {isVisible && newLevel && (
        <MotionDiv
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 12 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
        >
          <MotionDiv
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-gradient-to-br from-primary to-secondary p-1 rounded-3xl shadow-neo"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl p-8 text-center relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/20 rounded-full" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-secondary/20 rounded-full" />
              
              {/* Close button */}
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
              
              {/* Content */}
              <div className="relative z-10">
                <MotionDiv
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-dark shadow-neo"
                >
                  <Star className="w-12 h-12 text-white fill-white" />
                </MotionDiv>
                
                <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-sm font-bold text-primary mb-2">恭喜升级！</p>
                  <h2 className="text-4xl font-black text-dark mb-2">
                    等级 {newLevel}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    继续努力，解锁更多内容！
                  </p>
                </MotionDiv>
              </div>
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

// 升级通知管理器
let showLevelUpCallback: ((level: number) => void) | null = null;

export const registerLevelUpCallback = (callback: (level: number) => void) => {
  showLevelUpCallback = callback;
};

export const showLevelUpToast = (level: number) => {
  if (showLevelUpCallback) {
    showLevelUpCallback(level);
  }
};
