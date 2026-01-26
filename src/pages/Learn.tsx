import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Lock, CheckCircle, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  sort_order: number;
  prerequisite_skill_id: string | null;
  xp_reward: number;
}

interface SkillProgress {
  skill_id: string;
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed';
}

// 缓存数据结构
interface CacheData {
  skills: Skill[];
  lessonCounts: Map<string, { total: number; completed: number }>;
  skillProgress: Map<string, SkillProgress>;
  timestamp: number;
  userId: string | null;
}

// 全局缓存（组件外部，页面切换时保留）
let globalCache: CacheData | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

export const Learn = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillProgress, setSkillProgress] = useState<Map<string, SkillProgress>>(new Map());
  const [lessonCounts, setLessonCounts] = useState<Map<string, { total: number; completed: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useUserStore();
  const initialLoadDone = useRef(false);

  useEffect(() => {
    loadSkillTree();
  }, [user]);

  // 检查缓存是否有效
  const isCacheValid = useCallback(() => {
    if (!globalCache) return false;
    const now = Date.now();
    const isExpired = now - globalCache.timestamp > CACHE_DURATION;
    const userChanged = globalCache.userId !== (user?.id || null);
    return !isExpired && !userChanged;
  }, [user]);

  // 从缓存加载数据
  const loadFromCache = useCallback(() => {
    if (globalCache) {
      setSkills(globalCache.skills);
      setLessonCounts(new Map(globalCache.lessonCounts));
      setSkillProgress(new Map(globalCache.skillProgress));
      return true;
    }
    return false;
  }, []);

  // 保存到缓存
  const saveToCache = useCallback((
    skillsData: Skill[],
    counts: Map<string, { total: number; completed: number }>,
    progress: Map<string, SkillProgress>
  ) => {
    globalCache = {
      skills: skillsData,
      lessonCounts: new Map(counts),
      skillProgress: new Map(progress),
      timestamp: Date.now(),
      userId: user?.id || null,
    };
  }, [user]);

  const loadSkillTree = async (forceRefresh = false) => {
    // 如果不是强制刷新且缓存有效，使用缓存
    if (!forceRefresh && isCacheValid() && !initialLoadDone.current) {
      loadFromCache();
      setLoading(false);
      initialLoadDone.current = true;
      return;
    }

    if (!forceRefresh) {
      setLoading(true);
    }
    
    try {
      // 加载所有技能
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .order('sort_order');

      if (skillsError) {
        console.error('[Learn] Error loading skills:', skillsError);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      setSkills(skillsData || []);

      // 加载课程数量
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, skill_id');

      const counts = new Map<string, { total: number; completed: number }>();
      lessonsData?.forEach((lesson: any) => {
        const current = counts.get(lesson.skill_id) || { total: 0, completed: 0 };
        current.total++;
        counts.set(lesson.skill_id, current);
      });

      let progressMap = new Map<string, SkillProgress>();

      // 如果用户登录，加载进度
      if (user) {
        const { data: progressData } = await supabase
          .from('user_skill_progress')
          .select('*')
          .eq('user_id', user.id);

        progressData?.forEach((p: any) => {
          progressMap.set(p.skill_id, p);
        });

        // 获取课程完成进度
        const { data: lessonProgressData } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id, status')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        // 统计每个技能完成的课程数
        if (lessonProgressData && lessonsData) {
          const lessonToSkill = new Map<string, string>();
          lessonsData.forEach((l: any) => lessonToSkill.set(l.id, l.skill_id));
          
          lessonProgressData.forEach((lp: any) => {
            const skillId = lessonToSkill.get(lp.lesson_id);
            if (skillId) {
              const current = counts.get(skillId);
              if (current) {
                current.completed++;
              }
            }
          });
        }
      } else {
        // 访客模式：第一个技能解锁
        if (skillsData && skillsData.length > 0) {
          progressMap.set(skillsData[0].id, { skill_id: skillsData[0].id, status: 'unlocked' });
        }
      }

      setLessonCounts(new Map(counts));
      setSkillProgress(progressMap);

      // 保存到缓存
      saveToCache(skillsData || [], counts, progressMap);
      initialLoadDone.current = true;
    } catch (err) {
      console.error('[Learn] Error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // 手动刷新
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSkillTree(true);
  };

  const getSkillStatus = (skill: Skill): 'locked' | 'unlocked' | 'in_progress' | 'completed' => {
    const progress = skillProgress.get(skill.id);
    if (progress) return progress.status;
    
    // 检查前置技能
    if (!skill.prerequisite_skill_id) {
      return 'unlocked'; // 没有前置，默认解锁
    }
    
    const prereqProgress = skillProgress.get(skill.prerequisite_skill_id);
    if (prereqProgress?.status === 'completed') {
      return 'unlocked';
    }
    
    return 'locked';
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'basic': return '基础篇';
      case 'intermediate': return '进阶篇';
      case 'advanced': return '专业篇';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-secondary';
      case 'intermediate': return 'bg-primary';
      case 'advanced': return 'bg-accent';
      default: return 'bg-slate-500';
    }
  };

  // 按类别分组
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const categoryOrder = ['basic', 'intermediate', 'advanced'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MotionDiv
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header - Neo-Brutalism Style */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-white border-3 border-dark rounded-2xl shadow-neo p-6 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary rounded-full border-3 border-dark opacity-50 z-0" />
          <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-accent rounded-full border-3 border-dark opacity-30 z-0" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary rounded-xl border-3 border-dark shadow-neo-sm">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-dark flex-1">学习中心</h1>
              <MotionButton
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-slate-100 rounded-xl border-2 border-dark hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-dark ${isRefreshing ? 'animate-spin' : ''}`} />
              </MotionButton>
            </div>
            <p className="text-slate-500 font-bold">系统化学习，解锁你的音乐潜能 🎵</p>
          </div>
        </div>
      </MotionDiv>

      {/* Skill Tree */}
      <div className="space-y-8">
        {categoryOrder.map((category, catIndex) => {
          const categorySkills = groupedSkills[category];
          if (!categorySkills || categorySkills.length === 0) return null;

          return (
            <MotionDiv
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-4 py-1.5 rounded-full text-white font-black text-sm border-3 border-dark shadow-neo-sm ${getCategoryColor(category)}`}>
                  {getCategoryLabel(category)}
                </div>
                <div className="flex-1 h-1 bg-slate-200 rounded-full border border-dark/20"></div>
              </div>

              {/* Skills in Category */}
              <div className="space-y-4">
                {categorySkills.map((skill, index) => {
                  const status = getSkillStatus(skill);
                  const counts = lessonCounts.get(skill.id) || { total: 0, completed: 0 };
                  const isLocked = status === 'locked';
                  const isCompleted = status === 'completed';
                  const progress = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0;

                  return (
                    <MotionDiv
                      key={skill.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={!isLocked ? { scale: 1.02, x: 4 } : {}}
                      whileTap={!isLocked ? { scale: 0.98 } : {}}
                    >
                      <Link 
                        to={isLocked ? '#' : `/learn/skill/${skill.id}`}
                        onClick={(e) => isLocked && e.preventDefault()}
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
                        >
                          {/* Icon */}
                          <div className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
                            border-3 border-dark shadow-neo-sm
                            ${isCompleted 
                              ? 'bg-secondary text-white' 
                              : isLocked 
                                ? 'bg-slate-200 text-slate-400' 
                                : 'bg-white'
                            }
                          `}>
                            {isLocked ? (
                              <Lock className="w-7 h-7" />
                            ) : isCompleted ? (
                              <CheckCircle className="w-8 h-8" />
                            ) : (
                              skill.icon
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-lg text-dark truncate">{skill.name}</h3>
                              {isCompleted && <Sparkles className="w-4 h-4 text-secondary" />}
                            </div>
                            <p className="text-sm text-slate-500 font-medium truncate">{skill.description}</p>
                            
                            {/* Progress Bar */}
                            {!isLocked && counts.total > 0 && (
                              <div className="mt-3 flex items-center gap-3">
                                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden border-2 border-dark">
                                  <MotionDiv 
                                    className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                  />
                                </div>
                                <span className="text-sm font-black text-slate-500 min-w-[40px]">
                                  {counts.completed}/{counts.total}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Arrow */}
                          {!isLocked && (
                            <div className={`
                              p-2 rounded-xl border-2 border-dark
                              ${isCompleted ? 'bg-secondary text-white' : 'bg-slate-100 text-dark'}
                            `}>
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          )}
                        </Card>
                      </Link>
                    </MotionDiv>
                  );
                })}
              </div>
            </MotionDiv>
          );
        })}
      </div>

      {/* Empty State */}
      {skills.length === 0 && !loading && (
        <Card className="!p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl border-3 border-dark flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="font-black text-xl text-dark mb-2">课程正在准备中</h3>
          <p className="text-slate-500 font-medium">请先在 Supabase 中运行数据库脚本</p>
        </Card>
      )}
    </div>
  );
};
