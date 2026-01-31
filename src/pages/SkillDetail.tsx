import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Lock, CheckCircle, Star, Sparkles, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  xp_reward: number;
}

interface Lesson {
  id: string;
  skill_id: string;
  name: string;
  description: string;
  lesson_order: number;
  lesson_type: string;
  xp_reward: number;
}

interface LessonProgress {
  lesson_id: string;
  status: 'locked' | 'unlocked' | 'completed';
  best_score: number;
  stars: number;
}

const MotionDiv = motion.div as any;

export const SkillDetail = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();
  
  const [skill, setSkill] = useState<Skill | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadSkillData = useCallback(async () => {
    setLoading(true);
    try {
      // 加载技能信息
      const { data: skillData, error: skillError } = await supabase
        .from('skills')
        .select('*')
        .eq('id', skillId)
        .single();

      if (skillError) {
        console.error('[SkillDetail] Error loading skill:', skillError);
        setLoading(false);
        return;
      }

      setSkill(skillData);

      // 加载课程列表
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('skill_id', skillId)
        .order('lesson_order');

      if (lessonsError) {
        console.error('[SkillDetail] Error loading lessons:', lessonsError);
      }

      setLessons(lessonsData || []);

      // 加载用户进度
      if (user) {
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id);

        const progressMap = new Map<string, LessonProgress>();
        progressData?.forEach((p: any) => {
          progressMap.set(p.lesson_id, p);
        });
        setLessonProgress(progressMap);
      } else {
        // 访客模式：第一课解锁
        const progressMap = new Map<string, LessonProgress>();
        if (lessonsData && lessonsData.length > 0) {
          progressMap.set(lessonsData[0].id, {
            lesson_id: lessonsData[0].id,
            status: 'unlocked',
            best_score: 0,
            stars: 0,
          });
        }
        setLessonProgress(progressMap);
      }
    } catch (err) {
      console.error('[SkillDetail] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [skillId, user]);

  // 刷新所有数据
  const refreshData = useCallback(() => {
    if (skillId) {
      console.log('[SkillDetail] Refreshing data...');
      loadSkillData();
    }
  }, [skillId, loadSkillData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 监听页面可见性变化，当用户返回页面时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[SkillDetail] Page became visible, refreshing...');
        refreshData();
      }
    };

    // 监听 popstate 事件（用户点击返回按钮）
    const handlePopState = () => {
      console.log('[SkillDetail] PopState triggered, refreshing...');
      refreshData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', refreshData);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('focus', refreshData);
    };
  }, [refreshData]);

  const getLessonStatus = (lesson: Lesson, index: number): 'locked' | 'unlocked' | 'completed' => {
    const progress = lessonProgress.get(lesson.id);
    if (progress) return progress.status;
    
    // 第一课默认解锁
    if (index === 0) return 'unlocked';
    
    // 检查前一课是否完成
    const prevLesson = lessons[index - 1];
    if (prevLesson) {
      const prevProgress = lessonProgress.get(prevLesson.id);
      if (prevProgress?.status === 'completed') {
        return 'unlocked';
      }
    }
    
    return 'locked';
  };

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'quiz': return '🎧 听音练习';
      case 'sing': return '🎤 哼唱练习';
      case 'listen': return '👂 听力练习';
      case 'theory': return '📖 理论学习';
      default: return type;
    }
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <MotionDiv
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Star
              className={`w-5 h-5 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
            />
          </MotionDiv>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg pattern-grid-lg">
        <MotionDiv
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg pattern-grid-lg p-4">
        <Card className="!p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl border-3 border-dark flex items-center justify-center">
            <span className="text-3xl">❓</span>
          </div>
          <p className="text-slate-500 font-bold mb-4">技能未找到</p>
          <Link to="/learn">
            <Button>返回学习中心</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const completedCount = lessons.filter(l => lessonProgress.get(l.id)?.status === 'completed').length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg">
      {/* Header - Neo-Brutalism Style */}
      <header className="bg-white border-b-3 border-dark sticky top-[52px] z-40 shadow-neo-sm">
        {/* 标题栏 */}
        <div className="max-w-2xl mx-auto flex items-center gap-4 p-4">
          <Link to="/learn">
            <MotionDiv 
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-slate-100 rounded-xl border-2 border-dark hover:shadow-neo-sm transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-dark" />
            </MotionDiv>
          </Link>
          <div className="flex-1 flex items-center gap-3">
            <div className="text-3xl">{skill.icon}</div>
            <h1 className="text-xl md:text-2xl font-black text-dark">{skill.name}</h1>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-2xl mx-auto pb-24">
        {/* Skill Info Card */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="!p-6 mb-6 relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary/20 rounded-full border-3 border-dark/10" />
            
            <div className="relative">
              <p className="text-slate-600 font-medium text-lg">{skill.description}</p>
              
              {/* Progress */}
              <div className="mt-5 bg-slate-50 rounded-xl p-4 border-2 border-dark">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-black text-slate-600">学习进度</span>
                  <span className="font-black text-primary">{completedCount}/{lessons.length} 课程</span>
                </div>
                <div className="h-4 bg-white rounded-full overflow-hidden border-2 border-dark">
                  <MotionDiv 
                    className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Reward */}
              <div className="mt-4 pt-4 border-t-3 border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  完成奖励
                </span>
                <span className="font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full border-2 border-primary/30">
                  +{skill.xp_reward} XP
                </span>
              </div>
            </div>
          </Card>
        </MotionDiv>

        {/* Lessons List Header */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-black text-xl text-dark">课程列表</h2>
          <div className="flex-1 h-1 bg-slate-200 rounded-full border border-dark/10" />
        </div>

        {/* Lessons */}
        <div className="space-y-4">
          {lessons.map((lesson, index) => {
            const status = getLessonStatus(lesson, index);
            const progress = lessonProgress.get(lesson.id);
            const isLocked = status === 'locked';
            const isCompleted = status === 'completed';

            return (
              <MotionDiv
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={!isLocked ? { scale: 1.02, x: 4 } : {}}
                whileTap={!isLocked ? { scale: 0.98 } : {}}
              >
                <Card 
                  className={`
                    !p-5 flex items-center gap-4 transition-all
                    ${isLocked 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-neo-lg cursor-pointer'
                    }
                    ${isCompleted ? '!border-secondary !bg-white' : ''}
                  `}
                  onClick={() => !isLocked && navigate(`/lesson/${lesson.id}`)}
                >
                  {/* Order Number / Status Icon */}
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl
                    border-3 border-dark shadow-neo-sm
                    ${isCompleted 
                      ? 'bg-secondary text-white' 
                      : isLocked 
                        ? 'bg-slate-200 text-slate-400' 
                        : 'bg-primary text-white'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-7 h-7" />
                    ) : isLocked ? (
                      <Lock className="w-6 h-6" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg text-dark truncate">{lesson.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm px-3 py-1 bg-slate-100 rounded-full text-slate-600 font-bold border border-slate-200">
                        {getLessonTypeLabel(lesson.lesson_type)}
                      </span>
                      <span className="text-sm font-bold text-primary">+{lesson.xp_reward} XP</span>
                    </div>
                  </div>

                  {/* Status / Stars */}
                  <div className="shrink-0">
                    {isCompleted && progress?.stars ? (
                      renderStars(progress.stars)
                    ) : !isLocked ? (
                      <div className="p-2 bg-primary rounded-xl border-2 border-dark shadow-neo-sm">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    ) : null}
                  </div>
                </Card>
              </MotionDiv>
            );
          })}
        </div>

        {/* Coming Soon Card - 当有课程时显示 */}
        {lessons.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: lessons.length * 0.05 + 0.1 }}
            className="mt-4"
          >
            <div className="
              p-5 rounded-xl border-3 border-dashed border-slate-300 bg-slate-50
              flex items-center gap-4 select-none
            ">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-200 border-2 border-slate-300">
                <Clock className="w-6 h-6 text-slate-400" />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-400">更多课程敬请期待</h3>
                <p className="text-sm text-slate-400 mt-1">新课程正在精心准备中...</p>
              </div>
              
              {/* Emoji */}
              <span className="text-2xl opacity-50">🚀</span>
            </div>
          </MotionDiv>
        )}

        {/* Empty State - 当没有课程时显示 */}
        {lessons.length === 0 && (
          <Card className="!p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl border-3 border-dark flex items-center justify-center">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-black text-xl text-slate-500 mb-2">课程正在准备中</h3>
            <p className="text-slate-400 font-medium">新课程即将上线，敬请期待！</p>
          </Card>
        )}
      </main>
    </div>
  );
};
