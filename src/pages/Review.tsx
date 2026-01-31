import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, AlertCircle, CheckCircle, Brain, TrendingUp, Calendar, Target } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import { getReviewStatus, getReviewPriority } from '../utils/spacedRepetition';
import { getWeakPoints } from '../utils/reviewService';
import { getMidiNoteName } from '../utils/musicTheory';
import { InstrumentSelector } from '../components/ui/InstrumentSelector';
import { LoginPrompt } from '../components/auth/LoginPrompt';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface ReviewItem {
  id: string;
  lessonId: string;
  lessonName: string;
  skillName: string;
  skillIcon: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate?: Date;
  totalReviews: number;
  correctCount: number;
}

interface WeakPoint {
  questionType: string;
  targetValue: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export const Review = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCount: 0,
    overdueCount: 0,
    upcomingCount: 0,
    totalMastered: 0,
  });

  useEffect(() => {
    if (user) {
      loadReviewSchedule();
      loadWeakPoints();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadWeakPoints = async () => {
    if (!user) return;
    const points = await getWeakPoints(user.id, 5);
    setWeakPoints(points);
  };

  const loadReviewSchedule = async () => {
    if (!user) return;

    try {
      // 获取复习计划
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('user_review_schedule')
        .select(`
          id,
          lesson_id,
          ease_factor,
          interval_days,
          repetitions,
          next_review_date,
          last_review_date,
          total_reviews,
          correct_count
        `)
        .eq('user_id', user.id)
        .order('next_review_date');

      if (scheduleError) {
        console.error('[Review] Error loading schedule:', scheduleError);
        setLoading(false);
        return;
      }

      if (!scheduleData || scheduleData.length === 0) {
        setReviewItems([]);
        setLoading(false);
        return;
      }

      // 获取课程和技能信息
      const lessonIds = scheduleData.map(s => s.lesson_id);
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, name, skill_id')
        .in('id', lessonIds);

      const skillIds = [...new Set(lessonsData?.map(l => l.skill_id) || [])];
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, name, icon')
        .in('id', skillIds);

      const skillMap = new Map(skillsData?.map(s => [s.id, s]) || []);
      const lessonMap = new Map(lessonsData?.map(l => [l.id, l]) || []);

      // 组合数据
      const items: ReviewItem[] = scheduleData.map(schedule => {
        const lesson = lessonMap.get(schedule.lesson_id);
        const skill = lesson ? skillMap.get(lesson.skill_id) : null;

        return {
          id: schedule.id,
          lessonId: schedule.lesson_id,
          lessonName: lesson?.name || '未知课程',
          skillName: skill?.name || '未知技能',
          skillIcon: skill?.icon || '📚',
          easeFactor: schedule.ease_factor,
          intervalDays: schedule.interval_days,
          repetitions: schedule.repetitions,
          nextReviewDate: new Date(schedule.next_review_date),
          lastReviewDate: schedule.last_review_date ? new Date(schedule.last_review_date) : undefined,
          totalReviews: schedule.total_reviews,
          correctCount: schedule.correct_count,
        };
      });

      // 按优先级排序
      items.sort((a, b) => getReviewPriority(b as any) - getReviewPriority(a as any));

      setReviewItems(items);

      // 计算统计
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let todayCount = 0;
      let overdueCount = 0;
      let upcomingCount = 0;
      let totalMastered = 0;

      items.forEach(item => {
        const status = getReviewStatus(item.nextReviewDate);
        if (status.status === 'overdue') overdueCount++;
        else if (status.status === 'today') todayCount++;
        else if (status.status === 'upcoming') upcomingCount++;

        // 间隔超过30天算作已掌握
        if (item.intervalDays >= 30) totalMastered++;
      });

      setStats({ todayCount, overdueCount, upcomingCount, totalMastered });
    } catch (err) {
      console.error('[Review] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = (lessonId: string) => {
    navigate(`/lesson/${lessonId}?mode=review`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'today':
        return <Clock className="w-4 h-4" />;
      case 'upcoming':
        return <Calendar className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  if (!user) {
    return (
      <div className="min-h-screen bg-light-bg pattern-grid-lg">
        <header className="p-4 flex items-center gap-4 bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
          <MotionButton 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-100 rounded-xl border-2 border-dark"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </MotionButton>
          <h1 className="text-xl font-black text-dark">复习中心</h1>
        </header>

        <div className="p-4 max-w-2xl mx-auto">
          <Card className="!p-8 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-black text-dark mb-2">登录后开启智能复习</h2>
            <p className="text-slate-500 font-medium mb-6">
              复习系统会根据你的学习情况，智能安排复习计划
            </p>
            <Button onClick={() => setShowLoginPrompt(true)}>
              去登录
            </Button>
          </Card>
        </div>
        
        <LoginPrompt
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          trigger="review"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg">
        <MotionDiv
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const needsReviewItems = reviewItems.filter(item => {
    const status = getReviewStatus(item.nextReviewDate);
    return status.status === 'overdue' || status.status === 'today';
  });

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg">
      {/* Header */}
      <header className="p-4 flex items-center gap-4 bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
        <MotionButton 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-slate-100 rounded-xl border-2 border-dark"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5 text-dark" />
        </MotionButton>
        <div className="flex-1">
          <h1 className="text-xl font-black text-dark">复习中心</h1>
          <p className="text-sm text-slate-500 font-medium">科学复习，高效记忆</p>
        </div>
        <InstrumentSelector compact />
        <div className="p-2 bg-primary rounded-xl border-2 border-dark">
          <Brain className="w-5 h-5 text-white" />
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`!p-4 text-center !bg-white ${stats.overdueCount > 0 ? '!border-red-500' : ''}`}>
              <div className={`w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center border-2 border-dark ${stats.overdueCount > 0 ? 'bg-red-500' : 'bg-slate-200'}`}>
                <AlertCircle className={`w-6 h-6 ${stats.overdueCount > 0 ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <p className={`text-2xl font-black ${stats.overdueCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {stats.overdueCount}
              </p>
              <p className="text-sm font-bold text-slate-500">已过期</p>
            </Card>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className={`!p-4 text-center !bg-white ${stats.todayCount > 0 ? '!border-primary' : ''}`}>
              <div className={`w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center border-2 border-dark ${stats.todayCount > 0 ? 'bg-primary' : 'bg-slate-200'}`}>
                <Clock className={`w-6 h-6 ${stats.todayCount > 0 ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <p className={`text-2xl font-black ${stats.todayCount > 0 ? 'text-primary' : 'text-slate-400'}`}>
                {stats.todayCount}
              </p>
              <p className="text-sm font-bold text-slate-500">今日待复习</p>
            </Card>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="!p-4 text-center !bg-white">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center border-2 border-dark bg-secondary">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-black text-secondary">{stats.totalMastered}</p>
              <p className="text-sm font-bold text-slate-500">已掌握</p>
            </Card>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="!p-4 text-center !bg-white">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center border-2 border-dark bg-amber-400">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-black text-amber-500">{stats.upcomingCount}</p>
              <p className="text-sm font-bold text-slate-500">即将复习</p>
            </Card>
          </MotionDiv>
        </div>

        {/* 开始复习按钮 */}
        {needsReviewItems.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              className="w-full py-4 text-lg shadow-neo"
              onClick={() => handleStartReview(needsReviewItems[0].lessonId)}
            >
              <Brain className="w-5 h-5 mr-2" />
              开始复习 ({needsReviewItems.length} 个待复习)
            </Button>
          </MotionDiv>
        )}

        {/* 复习列表 */}
        {reviewItems.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-black text-lg text-dark flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              复习计划
            </h2>

            {reviewItems.map((item, index) => {
              const status = getReviewStatus(item.nextReviewDate);
              const accuracy = item.totalReviews > 0 
                ? Math.round((item.correctCount / item.totalReviews) * 100) 
                : 0;

              return (
                <MotionDiv
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                >
                  <Card 
                    className={`!p-4 cursor-pointer hover:shadow-neo-lg transition-all ${
                      status.status === 'overdue' ? '!border-red-500' :
                      status.status === 'today' ? '!border-primary' : ''
                    }`}
                    onClick={() => handleStartReview(item.lessonId)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-xl bg-white border-2 border-dark shadow-neo-sm flex items-center justify-center text-2xl flex-shrink-0">
                        {item.skillIcon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-dark truncate">{item.lessonName}</h3>
                        <p className="text-sm text-slate-500 font-medium truncate">{item.skillName}</p>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`flex items-center gap-1 text-sm font-bold ${status.color}`}>
                            {getStatusIcon(status.status)}
                            {status.label}
                          </span>
                          {item.totalReviews > 0 && (
                            <span className="text-sm font-bold text-slate-400">
                              正确率 {accuracy}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 复习次数 */}
                      <div className="text-center flex-shrink-0">
                        <p className="text-lg font-black text-primary">{item.repetitions}</p>
                        <p className="text-xs font-bold text-slate-400">复习次数</p>
                      </div>
                    </div>
                  </Card>
                </MotionDiv>
              );
            })}
          </div>
        ) : (
          <Card className="!p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl border-3 border-dark flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
            <h3 className="font-black text-xl text-dark mb-2">暂无复习任务</h3>
            <p className="text-slate-500 font-medium mb-6">
              完成课程后，系统会自动为你安排复习计划
            </p>
            <Button variant="secondary" onClick={() => navigate('/learn')}>
              去学习
            </Button>
          </Card>
        )}

        {/* 薄弱点分析 */}
        {weakPoints.length > 0 && (
          <div className="space-y-4 mt-8">
            <h2 className="font-black text-lg text-dark flex items-center gap-2">
              <Target className="w-5 h-5 text-red-500" />
              薄弱点分析
            </h2>
            <Card className="!p-4">
              <p className="text-sm text-slate-500 font-medium mb-4">
                以下是你正确率较低的内容，建议多加练习：
              </p>
              <div className="space-y-3">
                {weakPoints.map((point, index) => {
                  const displayName = point.questionType === 'note' 
                    ? getMidiNoteName(parseInt(point.targetValue))
                    : point.targetValue;
                  const typeLabel = point.questionType === 'note' ? '音符' 
                    : point.questionType === 'interval' ? '音程' 
                    : '和弦';

                  return (
                    <MotionDiv
                      key={`${point.questionType}-${point.targetValue}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border-2 border-red-200"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center border-2 border-red-300">
                        <span className="text-lg font-black text-red-600">{displayName}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-dark text-sm">{typeLabel}: {displayName}</p>
                        <p className="text-xs text-slate-500">
                          尝试 {point.attempts} 次，正确 {point.correct} 次
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${point.accuracy < 50 ? 'text-red-500' : 'text-amber-500'}`}>
                          {point.accuracy}%
                        </p>
                        <p className="text-xs text-slate-400">正确率</p>
                      </div>
                    </MotionDiv>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
