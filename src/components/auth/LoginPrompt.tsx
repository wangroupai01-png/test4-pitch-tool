/**
 * 渐进式登录引导弹窗
 * 在游客完成一定课程后软性提醒登录
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cloud, Trophy, BookOpen, Users, Star, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { AuthModal } from './AuthModal';

const MotionDiv = motion.div as any;

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  completedLessons?: number;
  trigger?: 'lessons' | 'review' | 'friends' | 'leaderboard' | 'daily';
}

// 不同触发场景的文案配置
const PROMPT_CONFIG = {
  lessons: {
    icon: Star,
    iconBg: 'bg-primary',
    title: '太棒了！你已经完成了 {count} 节课',
    subtitle: '登录后可以：',
    benefits: [
      { icon: Cloud, text: '云端同步，换设备也不丢进度' },
      { icon: Trophy, text: '参与排行榜，和全服玩家比拼' },
      { icon: Zap, text: '解锁成就系统，获得专属徽章' },
    ],
  },
  review: {
    icon: BookOpen,
    iconBg: 'bg-secondary',
    title: '智能复习系统',
    subtitle: '登录后开启：',
    benefits: [
      { icon: BookOpen, text: '基于遗忘曲线的智能复习' },
      { icon: Star, text: '精准定位薄弱知识点' },
      { icon: Zap, text: '提升学习效率 200%' },
    ],
  },
  friends: {
    icon: Users,
    iconBg: 'bg-accent',
    title: '好友系统',
    subtitle: '登录后可以：',
    benefits: [
      { icon: Users, text: '添加好友，互相学习' },
      { icon: Trophy, text: '好友PK，看看谁更强' },
      { icon: Star, text: '分享成就，一起进步' },
    ],
  },
  leaderboard: {
    icon: Trophy,
    iconBg: 'bg-yellow-500',
    title: '全服排行榜',
    subtitle: '登录后可以：',
    benefits: [
      { icon: Trophy, text: '查看你的全服排名' },
      { icon: Star, text: '冲击每日/每周榜首' },
      { icon: Zap, text: '获得排名奖励' },
    ],
  },
  daily: {
    icon: Zap,
    iconBg: 'bg-accent',
    title: '每日挑战',
    subtitle: '登录后参与：',
    benefits: [
      { icon: Zap, text: '每日限定挑战任务' },
      { icon: Trophy, text: '排名前10%获额外奖励' },
      { icon: Star, text: '连续参与解锁成就' },
    ],
  },
};

export const LoginPrompt: React.FC<LoginPromptProps> = ({
  isOpen,
  onClose,
  completedLessons = 2,
  trigger = 'lessons',
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const config = PROMPT_CONFIG[trigger];
  const IconComponent = config.icon;
  
  // 替换标题中的变量
  const title = config.title.replace('{count}', String(completedLessons));

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    onClose();
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showAuthModal && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleLater}
          >
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white border-3 border-dark rounded-2xl shadow-neo p-6 w-full max-w-md relative overflow-hidden"
            >
              {/* 装饰元素 */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-secondary/10 rounded-full" />
              
              {/* 关闭按钮 */}
              <button
                onClick={handleLater}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 图标 */}
              <div className="relative z-10">
                <MotionDiv
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className={`w-20 h-20 ${config.iconBg} rounded-2xl border-3 border-dark shadow-neo flex items-center justify-center mx-auto mb-6`}
                >
                  <IconComponent className="w-10 h-10 text-white" />
                </MotionDiv>

                {/* 标题 */}
                <h2 className="text-2xl font-black text-center mb-2">{title}</h2>
                <p className="text-slate-500 font-bold text-center mb-6">{config.subtitle}</p>

                {/* 好处列表 */}
                <div className="space-y-3 mb-8">
                  {config.benefits.map((benefit, index) => (
                    <MotionDiv
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border-2 border-slate-200"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <benefit.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-bold text-dark">{benefit.text}</span>
                    </MotionDiv>
                  ))}
                </div>

                {/* 按钮 */}
                <div className="space-y-3">
                  <Button fullWidth onClick={handleLogin}>
                    登录 / 注册
                  </Button>
                  <button
                    onClick={handleLater}
                    className="w-full py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                  >
                    稍后再说
                  </button>
                </div>

                {/* 底部提示 */}
                <p className="text-xs text-slate-400 text-center mt-4">
                  💡 游客数据存储在本地，清除浏览器数据后会丢失
                </p>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* 登录弹窗 */}
      <AuthModal isOpen={showAuthModal} onClose={handleAuthClose} />
    </>
  );
};

// ============ 工具函数 ============

const GUEST_LESSONS_KEY = 'guest_completed_lessons';
const LAST_PROMPT_KEY = 'last_login_prompt_at';

// 获取游客完成的课程数
export const getGuestCompletedLessons = (): number => {
  const stored = localStorage.getItem(GUEST_LESSONS_KEY);
  return stored ? parseInt(stored, 10) : 0;
};

// 增加游客完成的课程数
export const incrementGuestCompletedLessons = (): number => {
  const current = getGuestCompletedLessons();
  const newCount = current + 1;
  localStorage.setItem(GUEST_LESSONS_KEY, String(newCount));
  return newCount;
};

// 检查是否应该显示登录提示（每2课提示一次，但每天最多提示2次）
export const shouldShowLoginPrompt = (): boolean => {
  const completedLessons = getGuestCompletedLessons();
  
  // 至少完成2课才提示
  if (completedLessons < 2) return false;
  
  // 每2课提示一次（2, 4, 6...）
  if (completedLessons % 2 !== 0) return false;
  
  // 检查今天是否已经提示过2次
  const lastPrompt = localStorage.getItem(LAST_PROMPT_KEY);
  if (lastPrompt) {
    const lastDate = new Date(lastPrompt).toDateString();
    const today = new Date().toDateString();
    if (lastDate === today) {
      // 今天已提示，检查次数
      const todayCount = parseInt(localStorage.getItem('login_prompt_count_today') || '0', 10);
      if (todayCount >= 2) return false;
    } else {
      // 新的一天，重置计数
      localStorage.setItem('login_prompt_count_today', '0');
    }
  }
  
  return true;
};

// 记录已显示登录提示
export const markLoginPromptShown = () => {
  localStorage.setItem(LAST_PROMPT_KEY, new Date().toISOString());
  const count = parseInt(localStorage.getItem('login_prompt_count_today') || '0', 10);
  localStorage.setItem('login_prompt_count_today', String(count + 1));
};
