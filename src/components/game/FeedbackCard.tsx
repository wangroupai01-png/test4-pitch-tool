/**
 * 增强版答题反馈卡片
 * 显示正确/错误反馈，包含学习提示和记忆口诀
 */

import { motion } from 'framer-motion';
import { Volume2, CheckCircle, XCircle, Lightbulb, Music } from 'lucide-react';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface FeedbackCardProps {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  tip?: string;
  mnemonic?: string;
  characteristic?: string;
  onPlayCorrect?: () => void;
  className?: string;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  isCorrect,
  userAnswer,
  correctAnswer,
  tip,
  mnemonic,
  characteristic,
  onPlayCorrect,
  className = '',
}) => {
  // 正确时简洁显示
  if (isCorrect) {
    return (
      <MotionDiv
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`p-4 rounded-xl border-3 border-dark shadow-neo-sm bg-secondary text-white ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-black text-lg">正确！🎉</p>
            <p className="text-white/80 text-sm font-bold">{correctAnswer}</p>
          </div>
        </div>
      </MotionDiv>
    );
  }

  // 错误时详细显示
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`rounded-xl border-3 border-dark shadow-neo-sm bg-white overflow-hidden ${className}`}
    >
      {/* 头部 - 错误提示 */}
      <div className="bg-red-500 text-white p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-black text-lg">再想想</p>
            <p className="text-white/80 text-sm font-bold">别灰心，记住这个音</p>
          </div>
        </div>
      </div>

      {/* 答案对比 */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          {/* 用户答案 */}
          <div className="flex-1 bg-red-50 rounded-lg p-3 border-2 border-red-200">
            <p className="text-xs text-red-400 font-bold mb-1">你选择了</p>
            <p className="font-black text-red-600">{userAnswer}</p>
          </div>
          
          {/* 箭头 */}
          <div className="text-slate-300 font-black text-xl">→</div>
          
          {/* 正确答案 */}
          <div className="flex-1 bg-secondary/10 rounded-lg p-3 border-2 border-secondary/30">
            <p className="text-xs text-secondary font-bold mb-1">正确答案</p>
            <p className="font-black text-secondary">{correctAnswer}</p>
          </div>
        </div>

        {/* 比较提示 */}
        {tip && (
          <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 border-2 border-amber-200">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-amber-700">{tip}</p>
          </div>
        )}

        {/* 记忆口诀 */}
        {mnemonic && (
          <div className="flex items-start gap-2 bg-primary/10 rounded-lg p-3 border-2 border-primary/20">
            <Music className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-primary font-bold mb-1">💡 记忆技巧</p>
              <p className="text-sm font-bold text-primary/80">{mnemonic}</p>
            </div>
          </div>
        )}

        {/* 和弦特征 */}
        {characteristic && (
          <div className="flex items-start gap-2 bg-primary/10 rounded-lg p-3 border-2 border-primary/20">
            <Music className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-primary font-bold mb-1">🎹 和弦特征</p>
              <p className="text-sm font-bold text-primary/80">{characteristic}</p>
            </div>
          </div>
        )}

        {/* 重听按钮 */}
        {onPlayCorrect && (
          <MotionButton
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlayCorrect}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-lg p-3 border-2 border-dark font-bold text-dark transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            重听正确答案
          </MotionButton>
        )}
      </div>
    </MotionDiv>
  );
};
