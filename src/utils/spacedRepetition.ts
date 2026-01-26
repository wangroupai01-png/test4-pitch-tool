/**
 * SM-2 间隔重复算法实现
 * 基于 SuperMemo 2 算法，用于智能复习调度
 */

export interface ReviewItem {
  lessonId: string;
  lessonName?: string;
  easeFactor: number;      // 难度因子 (1.3 - 2.5)
  intervalDays: number;    // 当前复习间隔(天)
  repetitions: number;     // 成功复习次数
  nextReviewDate: Date;    // 下次复习日期
  lastReviewDate?: Date;   // 上次复习日期
  lastQuality?: number;    // 上次复习评分 (0-5)
}

export interface ReviewResult {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * 根据用户表现计算下次复习时间
 * 
 * @param item 当前复习项
 * @param quality 用户表现评分 (0-5)
 *   - 0: 完全忘记，需要重新学习
 *   - 1: 严重错误，勉强记得一点
 *   - 2: 错误，但看到答案后记起来了
 *   - 3: 正确，但很费力
 *   - 4: 正确，稍有犹豫
 *   - 5: 完美，轻松记住
 * @returns 更新后的复习参数
 */
export function calculateNextReview(
  item: ReviewItem,
  quality: number
): ReviewResult {
  // 确保 quality 在 0-5 范围内
  quality = Math.max(0, Math.min(5, Math.round(quality)));
  
  let newEaseFactor = item.easeFactor;
  let newInterval: number;
  let newRepetitions: number;
  
  if (quality < 3) {
    // 回答不好，重置进度
    newRepetitions = 0;
    newInterval = 1;
    // 降低难度因子，但不低于 1.3
    newEaseFactor = Math.max(1.3, item.easeFactor - 0.2);
  } else {
    // 回答正确
    newRepetitions = item.repetitions + 1;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 3;
    } else {
      newInterval = Math.round(item.intervalDays * item.easeFactor);
    }
    
    // 更新难度因子
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEaseFactor = item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor); // 最低 1.3
  }
  
  // 计算下次复习日期
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);
  nextDate.setHours(0, 0, 0, 0);
  
  return {
    easeFactor: newEaseFactor,
    intervalDays: newInterval,
    repetitions: newRepetitions,
    nextReviewDate: nextDate,
  };
}

/**
 * 根据课程得分计算质量评分
 * 
 * @param score 课程得分 (0-100)
 * @returns 质量评分 (0-5)
 */
export function scoreToQuality(score: number): number {
  if (score >= 95) return 5;      // 完美
  if (score >= 85) return 4;      // 很好
  if (score >= 70) return 3;      // 及格
  if (score >= 50) return 2;      // 需要复习
  if (score >= 30) return 1;      // 严重需要复习
  return 0;                        // 需要重新学习
}

/**
 * 获取复习状态描述
 */
export function getReviewStatus(nextReviewDate: Date): {
  status: 'overdue' | 'today' | 'upcoming' | 'future';
  label: string;
  color: string;
  daysUntil: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  
  const diffTime = reviewDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      status: 'overdue',
      label: `已过期 ${Math.abs(diffDays)} 天`,
      color: 'text-red-500',
      daysUntil: diffDays,
    };
  } else if (diffDays === 0) {
    return {
      status: 'today',
      label: '今日复习',
      color: 'text-primary',
      daysUntil: 0,
    };
  } else if (diffDays <= 3) {
    return {
      status: 'upcoming',
      label: `${diffDays} 天后`,
      color: 'text-amber-500',
      daysUntil: diffDays,
    };
  } else {
    return {
      status: 'future',
      label: `${diffDays} 天后`,
      color: 'text-slate-400',
      daysUntil: diffDays,
    };
  }
}

/**
 * 获取复习优先级（用于排序）
 * 优先级越高的越应该先复习
 */
export function getReviewPriority(item: ReviewItem): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const reviewDate = new Date(item.nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // 过期的优先级最高，已过期越久优先级越高
  if (diffDays < 0) {
    return 1000 + Math.abs(diffDays);
  }
  
  // 今日的优先级次之
  if (diffDays === 0) {
    return 500;
  }
  
  // 未来的优先级较低
  return Math.max(0, 100 - diffDays);
}
