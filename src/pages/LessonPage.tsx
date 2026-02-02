import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, Star, ArrowRight, RotateCcw, List, Mic, MicOff, Play, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { usePitchDetector } from '../hooks/usePitchDetector';
import { PitchVisualizer } from '../components/game/PitchVisualizer';
import { getMidiNoteName, getFrequency } from '../utils/musicTheory';
import { checkAndUnlockAchievements, updateStreak } from '../utils/achievementChecker';
import { showLevelUpToast } from '../components/game/LevelUpToast';
import { updateReviewSchedule } from '../utils/reviewService';
import { clearLearnCache } from './Learn';
import { FeedbackCard } from '../components/game/FeedbackCard';
import { 
  INTERVAL_MNEMONICS, 
  CHORD_CHARACTERISTICS, 
  NOTE_TIPS,
  getNoteComparisonTip 
} from '../utils/feedbackData';
import { 
  LoginPrompt, 
  incrementGuestCompletedLessons, 
  shouldShowLoginPrompt,
  markLoginPromptShown
} from '../components/auth/LoginPrompt';
import { TheorySection } from '../components/game/TheorySection';
import type { TheoryContent } from '../components/game/TheorySection';

interface Lesson {
  id: string;
  skill_id: string;
  name: string;
  description: string;
  lesson_type: string;
  lesson_order: number;
  xp_reward: number;
  content: {
    type: string;
    questions: Question[];
    passThreshold: number;
    timeLimit?: number; // 限时模式秒数
    theory?: TheoryContent; // 课前理论内容
  };
}

interface Question {
  type: string;
  // 单音识别
  targetMidi?: number;
  options?: number[] | string[] | string[][];
  duration?: number;
  // 音程识别
  baseMidi?: number;
  intervalSemitones?: number;
  interval?: number;  // 半音数
  intervalName?: string;  // 音程名称
  answer?: string;
  // 和弦识别
  rootMidi?: number;
  chordType?: string;
  // 旋律听写
  notes?: number[];
  // 视唱
  startMidi?: number;
  noteName?: string;
  description?: string;
  tolerance?: number;
}

// Sing 课程相关状态
type SingState = 'idle' | 'listening' | 'demo' | 'countdown' | 'recording' | 'evaluating' | 'feedback';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

export const LessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { playNote, isReady } = useAudioPlayer();
  const { pitch, isListening, startListening, stopListening } = usePitchDetector();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<'loading' | 'theory' | 'playing' | 'result'>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [selectedIntervalAnswer, setSelectedIntervalAnswer] = useState<string | null>(null);
  
  // 登录引导状态
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [guestLessonCount, setGuestLessonCount] = useState(0);
  
  // 反馈相关状态
  const [feedbackData, setFeedbackData] = useState<{
    userAnswer: string;
    correctAnswer: string;
    tip?: string;
    mnemonic?: string;
    characteristic?: string;
    correctMidi?: number;
  } | null>(null);
  
  // Sing 模式专用状态
  const [singState, setSingState] = useState<SingState>('idle');
  const [singProgress, setSingProgress] = useState(0); // 0-100 进度
  const [countdown, setCountdown] = useState(3); // 倒计时
  
  // 限时模式状态
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accuracyBufferRef = useRef<number[]>([]); // 用于收集准确度数据
  const singTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (lessonId) {
      // 重置所有游戏状态
      setCurrentQuestionIndex(0);
      setCorrectCount(0);
      setSelectedAnswer(null);
      setSelectedIntervalAnswer(null);
      setShowFeedback(false);
      setIsCorrect(false);
      setNextLessonId(null);
      setGameState('loading');
      setTimeLeft(null);
      
      // 清除限时计时器
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      
      // 重置 Sing 模式状态
      setSingState('idle');
      setSingProgress(0);
      setCountdown(3);
      accuracyBufferRef.current = [];
      if (singTimerRef.current) {
        clearTimeout(singTimerRef.current);
        singTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (isListening) {
        stopListening();
      }
      
      loadLesson();
    }
  }, [lessonId]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (singTimerRef.current) {
        clearTimeout(singTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (isListening) {
        stopListening();
      }
    };
  }, []);

  const loadLesson = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) {
        console.error('[LessonPage] Error loading lesson:', error);
        return;
      }

      setLesson(data);
      
      // 如果有理论内容，先显示理论页面
      if (data?.content?.theory) {
        setGameState('theory');
      } else {
        setGameState('playing');
      }
    } catch (err) {
      console.error('[LessonPage] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = lesson?.content?.questions?.[currentQuestionIndex];
  const timeLimit = lesson?.content?.timeLimit; // 限时秒数

  // 限时模式计时器
  useEffect(() => {
    // 清除之前的计时器
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }

    // 如果有时间限制且正在答题，启动计时器
    if (timeLimit && gameState === 'playing' && !showFeedback && currentQuestion) {
      setTimeLeft(timeLimit);
      
      questionTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            // 时间到，自动判为错误
            if (questionTimerRef.current) {
              clearInterval(questionTimerRef.current);
              questionTimerRef.current = null;
            }
            // 触发超时处理
            setShowFeedback(true);
            setIsCorrect(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!timeLimit) {
      setTimeLeft(null);
    }

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
  }, [currentQuestionIndex, gameState, showFeedback, timeLimit, currentQuestion]);

  const handlePlayNote = useCallback(() => {
    if (currentQuestion && isReady) {
      if (currentQuestion.type === 'interval' && currentQuestion.baseMidi !== undefined && currentQuestion.intervalSemitones !== undefined) {
        // 音程类型：先播放基础音，然后播放第二个音
        const baseFreq = getFrequency(currentQuestion.baseMidi);
        const secondFreq = getFrequency(currentQuestion.baseMidi + currentQuestion.intervalSemitones);
        
        playNote(baseFreq);
        setTimeout(() => {
          playNote(secondFreq);
        }, 600); // 间隔 600ms 播放第二个音
      } else if (currentQuestion.type === 'interval_identify' && currentQuestion.rootMidi !== undefined && currentQuestion.interval !== undefined) {
        // 专业篇音程识别：使用 rootMidi 和 interval
        const baseFreq = getFrequency(currentQuestion.rootMidi);
        const secondFreq = getFrequency(currentQuestion.rootMidi + currentQuestion.interval);
        
        playNote(baseFreq);
        setTimeout(() => {
          playNote(secondFreq);
        }, 600);
      } else if ((currentQuestion.type === 'chord' || currentQuestion.type === 'chord_identify') && currentQuestion.rootMidi !== undefined && currentQuestion.chordType) {
        // 和弦类型：同时播放和弦音
        const root = currentQuestion.rootMidi;
        let intervals: number[];
        
        switch (currentQuestion.chordType) {
          case 'major':
            intervals = [0, 4, 7]; // 大三和弦
            break;
          case 'minor':
            intervals = [0, 3, 7]; // 小三和弦
            break;
          case 'dim':
            intervals = [0, 3, 6]; // 减三和弦
            break;
          case 'aug':
            intervals = [0, 4, 8]; // 增三和弦
            break;
          // 七和弦类型
          case 'maj7':
            intervals = [0, 4, 7, 11]; // 大七和弦
            break;
          case 'min7':
            intervals = [0, 3, 7, 10]; // 小七和弦
            break;
          case 'dom7':
            intervals = [0, 4, 7, 10]; // 属七和弦
            break;
          case 'dim7':
            intervals = [0, 3, 6, 9]; // 减七和弦
            break;
          case 'm7b5':
            intervals = [0, 3, 6, 10]; // 半减七和弦
            break;
          default:
            intervals = [0, 4, 7];
        }
        
        // 同时播放所有音符形成和弦
        intervals.forEach(interval => {
          playNote(getFrequency(root + interval));
        });
      } else if (currentQuestion.type === 'melody' && currentQuestion.notes) {
        // 旋律听写：依次播放多个音符
        currentQuestion.notes.forEach((midi, index) => {
          setTimeout(() => {
            playNote(getFrequency(midi), 0.6);
          }, index * 500); // 每个音符间隔 500ms
        });
      } else if (currentQuestion.targetMidi !== undefined) {
        // 单音识别类型
        const frequency = getFrequency(currentQuestion.targetMidi);
        playNote(frequency);
      }
    }
  }, [currentQuestion, isReady, playNote]);

  // ============ Sing 模式专用函数 ============

  // 开始演示（只播放不录音）
  const handleSingDemo = useCallback(() => {
    if (!currentQuestion || !isReady || currentQuestion.targetMidi === undefined) return;
    
    setSingState('demo');
    const frequency = getFrequency(currentQuestion.targetMidi);
    playNote(frequency, 1.5); // 播放 1.5 秒
    
    // 演示结束后返回空闲状态
    setTimeout(() => {
      setSingState('idle');
    }, 1500);
  }, [currentQuestion, isReady, playNote]);

  // 实际开始录音（内部函数）
  const startRecording = useCallback(async () => {
    if (!currentQuestion || currentQuestion.targetMidi === undefined) return;
    
    setSingState('recording');
    setSingProgress(0);
    accuracyBufferRef.current = [];
    
    await startListening();
    
    const duration = currentQuestion.duration || 2000;
    const startTime = Date.now();
    
    // 进度更新定时器
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setSingProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 50);
    
    // 录音结束定时器
    singTimerRef.current = setTimeout(() => {
      clearInterval(progressInterval);
      stopListening();
      evaluateSingPerformance();
    }, duration);
  }, [currentQuestion, startListening, stopListening]);

  // 开始跟唱（先播放示范音 -> 倒计时 -> 录音）
  const handleStartSing = useCallback(() => {
    if (!currentQuestion || !isReady || currentQuestion.targetMidi === undefined) return;
    
    // 1. 播放示范音
    setSingState('demo');
    const frequency = getFrequency(currentQuestion.targetMidi);
    playNote(frequency, 1.5);
    
    // 2. 示范音播放完后，开始倒计时（等1.5秒示范 + 0.5秒回声消失）
    setTimeout(() => {
      setSingState('countdown');
      setCountdown(3);
      
      // 开始倒计时
      let count = 3;
      countdownTimerRef.current = setInterval(() => {
        count--;
        setCountdown(count);
        
        if (count <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          // 3. 倒计时结束，开始录音
          startRecording();
        }
      }, 1000);
    }, 2000); // 1.5秒示范 + 0.5秒缓冲
  }, [currentQuestion, isReady, playNote, startRecording]);

  // 实时收集音准数据
  useEffect(() => {
    if (singState === 'recording' && pitch && currentQuestion?.targetMidi !== undefined) {
      // 计算音高偏差（半音）
      const deviation = Math.abs(pitch.midi - currentQuestion.targetMidi);
      // 转换为准确度分数（0-100），偏差越小分数越高
      const accuracy = Math.max(0, 100 - deviation * 50); // 偏差1个半音扣50分
      accuracyBufferRef.current.push(accuracy);
    }
  }, [pitch, singState, currentQuestion]);

  // 评估跟唱表现
  const evaluateSingPerformance = useCallback(() => {
    setSingState('evaluating');
    
    const samples = accuracyBufferRef.current;
    let avgAccuracy = 0;
    
    if (samples.length > 0) {
      // 过滤掉极低的样本（可能是静音或噪音）
      const validSamples = samples.filter(s => s > 10);
      if (validSamples.length > 0) {
        avgAccuracy = validSamples.reduce((a, b) => a + b, 0) / validSamples.length;
      }
    }
    
    // 判断是否通过（准确度 >= 60%）
    const passed = avgAccuracy >= 60;
    setIsCorrect(passed);
    
    // 如果通过，增加正确计数
    const newCorrectCount = passed ? correctCount + 1 : correctCount;
    if (passed) {
      setCorrectCount(newCorrectCount);
    }
    
    setSingState('feedback');
    setShowFeedback(true);
    
    // 延迟后进入下一题
    setTimeout(() => {
      if (currentQuestionIndex < (lesson?.content?.questions?.length || 1) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSingState('idle');
        setSingProgress(0);
        setShowFeedback(false);
        accuracyBufferRef.current = [];
      } else {
        // 完成课程
        handleLessonComplete(newCorrectCount);
      }
    }, 2000);
  }, [correctCount, currentQuestionIndex, lesson]);

  // 跳转到下一题或完成课程
  const goToNextQuestion = useCallback((finalCorrectCount: number) => {
    if (currentQuestionIndex < (lesson?.content?.questions?.length || 1) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setSelectedIntervalAnswer(null);
      setShowFeedback(false);
      setFeedbackData(null);
    } else {
      // 完成课程
      handleLessonComplete(finalCorrectCount);
    }
  }, [currentQuestionIndex, lesson]);

  // 用户手动点击继续（用于答错时）
  const handleContinue = useCallback(() => {
    goToNextQuestion(correctCount);
  }, [goToNextQuestion, correctCount]);

  const handleSelectAnswer = async (midi: number) => {
    if (showFeedback || !currentQuestion) return;

    setSelectedAnswer(midi);
    const correct = midi === currentQuestion.targetMidi;
    setIsCorrect(correct);
    setShowFeedback(true);

    // 计算新的正确数（因为 setState 是异步的）
    const newCorrectCount = correct ? correctCount + 1 : correctCount;
    
    if (correct) {
      setCorrectCount(newCorrectCount);
    }

    // 生成反馈数据
    const userNoteName = getMidiNoteName(midi);
    const correctNoteName = getMidiNoteName(currentQuestion.targetMidi!);
    setFeedbackData({
      userAnswer: userNoteName,
      correctAnswer: correctNoteName,
      tip: !correct ? getNoteComparisonTip(midi, currentQuestion.targetMidi!) : undefined,
      mnemonic: !correct ? NOTE_TIPS[currentQuestion.targetMidi!] : undefined,
      correctMidi: currentQuestion.targetMidi,
    });

    // 播放选择的音符（将 MIDI 转换为频率）
    playNote(getFrequency(midi));

    // 答对时自动跳转，答错时等待用户手动点击
    if (correct) {
      setTimeout(() => {
        goToNextQuestion(newCorrectCount);
      }, 1500);
    }
    // 答错时不自动跳转，由用户点击"继续"按钮
  };

  // 处理音程/和弦/旋律答案选择
  const handleSelectIntervalAnswer = async (answer: string) => {
    if (showFeedback || !currentQuestion) return;

    setSelectedIntervalAnswer(answer);
    
    // 根据题目类型判断正确答案
    let correctAnswer: string;
    if (currentQuestion.type === 'interval_identify') {
      correctAnswer = currentQuestion.intervalName || '';
    } else if (currentQuestion.type === 'melody') {
      // 旋律听写：第一个选项是正确答案
      const firstOption = (currentQuestion.options as string[][])?.[0];
      correctAnswer = firstOption?.join('-') || '';
    } else {
      correctAnswer = currentQuestion.answer || '';
    }
    
    const correct = answer === correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // 计算新的正确数
    const newCorrectCount = correct ? correctCount + 1 : correctCount;
    
    if (correct) {
      setCorrectCount(newCorrectCount);
    }

    // 生成反馈数据
    if (currentQuestion.type === 'interval' || currentQuestion.type === 'interval_identify') {
      setFeedbackData({
        userAnswer: answer,
        correctAnswer: correctAnswer,
        mnemonic: !correct ? INTERVAL_MNEMONICS[correctAnswer] : undefined,
      });
    } else if (currentQuestion.type === 'chord_identify') {
      setFeedbackData({
        userAnswer: answer,
        correctAnswer: correctAnswer,
        characteristic: !correct ? CHORD_CHARACTERISTICS[currentQuestion.chordType || ''] : undefined,
      });
    } else {
      setFeedbackData({
        userAnswer: answer,
        correctAnswer: correctAnswer,
      });
    }

    // 答对时自动跳转，答错时等待用户手动点击
    if (correct) {
      setTimeout(() => {
        goToNextQuestion(newCorrectCount);
      }, 1500);
    }
    // 答错时不自动跳转，由用户点击"继续"按钮
  };

  const handleLessonComplete = async (finalCorrectCount: number) => {
    setGameState('result');

    // 计算分数用于显示（使用传入的最终正确数量）
    const totalQuestions = lesson?.content?.questions?.length || 1;
    const score = Math.round((finalCorrectCount / totalQuestions) * 100);
    const passThreshold = lesson?.content?.passThreshold || 0.7;
    const passed = score >= (passThreshold * 100);

    console.log('[LessonPage] Lesson complete:', { 
      lessonId: lesson?.id, 
      score, 
      passed, 
      finalCorrectCount, 
      totalQuestions,
      userId: user?.id 
    });

    // 即使未登录，也尝试获取下一课信息
    if (lesson && passed) {
      await unlockNextLesson();
    }

    if (!lesson || !user) {
      console.log('[LessonPage] Skipping save - no user or lesson');
      
      // 游客完成课程：追踪并可能显示登录提示
      if (!user && passed) {
        const newCount = incrementGuestCompletedLessons();
        setGuestLessonCount(newCount);
        console.log('[LessonPage] Guest completed lesson, total:', newCount);
        
        // 检查是否应该显示登录提示
        if (shouldShowLoginPrompt()) {
          // 延迟显示，让用户先看到结果
          setTimeout(() => {
            setShowLoginPrompt(true);
            markLoginPromptShown();
          }, 2000);
        }
      }
      return;
    }
    
    // 计算星级
    let stars = 0;
    if (score >= 90) stars = 3;
    else if (score >= 70) stars = 2;
    else if (passed) stars = 1;

    try {
      // 保存进度
      const { data: existing, error: selectError } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (selectError) {
        console.error('[LessonPage] Error fetching existing progress:', selectError);
      }

      const progressData = {
        user_id: user.id,
        lesson_id: lesson.id,
        status: passed ? 'completed' : 'unlocked',
        best_score: existing ? Math.max(score, existing.best_score) : score,
        stars: existing ? Math.max(stars, existing.stars) : stars,
        attempts: (existing?.attempts || 0) + 1,
        last_attempt_at: new Date().toISOString(),
        completed_at: passed ? new Date().toISOString() : null,
      };

      console.log('[LessonPage] Saving progress:', progressData);

      const { error: upsertError } = await supabase
        .from('user_lesson_progress')
        .upsert(progressData, { onConflict: 'user_id,lesson_id' });

      if (upsertError) {
        console.error('[LessonPage] Error saving progress:', upsertError);
      } else {
        console.log('[LessonPage] Progress saved successfully');
        // 清除学习页面缓存，确保返回时显示最新数据
        clearLearnCache();
      }

      // 如果通过，添加 XP
      if (passed) {
        // 只在首次完成时给 XP
        if (!existing || existing.status !== 'completed') {
          await addXP(lesson.xp_reward);
        }
        
        // 更新打卡记录
        await updateStreak(user.id);
        
        // 检查成就解锁
        await checkAndUnlockAchievements(user.id);
      }

      // 更新复习计划（无论是否通过都更新，用于间隔重复算法）
      await updateReviewSchedule(user.id, lesson.id, score);
    } catch (err) {
      console.error('[LessonPage] Error saving progress:', err);
    }
  };

  const addXP = async (amount: number) => {
    if (!user) return;

    try {
      // 获取当前 XP
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      const isNewDay = xpData?.last_xp_date !== today;

      const newTotalXp = (xpData?.total_xp || 0) + amount;
      const newXpToday = isNewDay ? amount : (xpData?.xp_today || 0) + amount;

      // 计算等级
      const { data: levelData } = await supabase
        .from('level_config')
        .select('level')
        .lte('required_xp', newTotalXp)
        .order('level', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newLevel = levelData?.level || 1;
      const oldLevel = xpData?.current_level || 1;

      await supabase
        .from('user_xp')
        .upsert({
          user_id: user.id,
          total_xp: newTotalXp,
          current_level: newLevel,
          xp_today: newXpToday,
          last_xp_date: today,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      // 检测升级
      if (newLevel > oldLevel) {
        console.log('[LessonPage] Level up!', { oldLevel, newLevel });
        // 延迟一点显示，让其他动画先完成
        setTimeout(() => {
          showLevelUpToast(newLevel);
        }, 500);
      }

      // 记录 XP 日志
      await supabase
        .from('xp_logs')
        .insert({
          user_id: user.id,
          xp_amount: amount,
          source: 'lesson',
          source_id: lesson?.id,
        });
    } catch (err) {
      console.error('[LessonPage] Error adding XP:', err);
    }
  };

  const unlockNextLesson = async () => {
    if (!lesson) {
      console.log('[LessonPage] unlockNextLesson: no lesson');
      return;
    }

    console.log('[LessonPage] unlockNextLesson called:', {
      lessonId: lesson.id,
      skillId: lesson.skill_id,
      lessonOrder: lesson.lesson_order
    });

    try {
      // 获取同技能的下一课 (使用当前课程的 lesson_order)
      const { data: nextLesson, error: queryError } = await supabase
        .from('lessons')
        .select('id')
        .eq('skill_id', lesson.skill_id)
        .gt('lesson_order', lesson.lesson_order)
        .order('lesson_order')
        .limit(1)
        .maybeSingle();

      console.log('[LessonPage] Next lesson query result:', { nextLesson, queryError });

      if (nextLesson) {
        // 设置下一课 ID 用于导航按钮
        console.log('[LessonPage] Setting nextLessonId:', nextLesson.id);
        setNextLessonId(nextLesson.id);
        
        // 如果用户已登录，解锁下一课
        if (user) {
          // 检查是否已有进度
          const { data: existing } = await supabase
            .from('user_lesson_progress')
            .select('id')
            .eq('user_id', user.id)
            .eq('lesson_id', nextLesson.id)
            .maybeSingle();

          if (!existing) {
            const { error } = await supabase
              .from('user_lesson_progress')
              .insert({
                user_id: user.id,
                lesson_id: nextLesson.id,
                status: 'unlocked',
              });
            if (error) {
              console.error('[LessonPage] Error inserting next lesson progress:', error);
            } else {
              console.log('[LessonPage] Next lesson unlocked:', nextLesson.id);
            }
          }
        }
      } else {
        // 没有下一课，检查是否完成整个技能
        await checkSkillCompletion();
      }
    } catch (err) {
      console.error('[LessonPage] Error unlocking next lesson:', err);
    }
  };

  // 解锁所有以当前技能为前置条件的技能
  const unlockNextSkill = async (completedSkillId: string) => {
    if (!user) return;

    try {
      // 查找所有以当前技能为前置条件的技能
      const { data: dependentSkills, error: skillError } = await supabase
        .from('skills')
        .select('id')
        .eq('prerequisite_skill_id', completedSkillId);

      console.log('[LessonPage] Dependent skills:', { completedSkillId, dependentSkills, skillError });

      if (!dependentSkills || dependentSkills.length === 0) {
        console.log('[LessonPage] No dependent skills to unlock');
        return;
      }

      // 解锁所有依赖的技能
      for (const skill of dependentSkills) {
        // 解锁技能
        const { error: skillProgressError } = await supabase
          .from('user_skill_progress')
          .upsert({
            user_id: user.id,
            skill_id: skill.id,
            status: 'unlocked',
          }, { onConflict: 'user_id,skill_id' });

        if (skillProgressError) {
          console.error('[LessonPage] Error unlocking skill:', skill.id, skillProgressError);
        } else {
          console.log('[LessonPage] Skill unlocked:', skill.id);
        }

        // 解锁该技能的第一课
        const { data: firstLesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('skill_id', skill.id)
          .order('lesson_order')
          .limit(1)
          .maybeSingle();

        if (firstLesson) {
          const { data: existing } = await supabase
            .from('user_lesson_progress')
            .select('id')
            .eq('user_id', user.id)
            .eq('lesson_id', firstLesson.id)
            .maybeSingle();

          if (!existing) {
            await supabase
              .from('user_lesson_progress')
              .insert({
                user_id: user.id,
                lesson_id: firstLesson.id,
                status: 'unlocked',
              });
            console.log('[LessonPage] First lesson unlocked:', firstLesson.id);
          }
        }
      }
    } catch (err) {
      console.error('[LessonPage] Error unlocking dependent skills:', err);
    }
  };

  const checkSkillCompletion = async () => {
    if (!lesson || !user) return;

    try {
      // 获取技能的所有课程
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('skill_id', lesson.skill_id);

      if (!allLessons) return;

      // 获取用户完成的课程
      const { data: completedLessons } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const completedIds = new Set(completedLessons?.map(l => l.lesson_id));
      const allCompleted = allLessons.every(l => completedIds.has(l.id));

      if (allCompleted) {
        console.log('[LessonPage] All lessons completed for skill:', lesson.skill_id);
        
        // 标记技能完成
        await supabase
          .from('user_skill_progress')
          .upsert({
            user_id: user.id,
            skill_id: lesson.skill_id,
            status: 'completed',
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id,skill_id' });

        // 获取技能 XP 奖励
        const { data: skillData } = await supabase
          .from('skills')
          .select('xp_reward, skill_order')
          .eq('id', lesson.skill_id)
          .single();

        if (skillData) {
          await addXP(skillData.xp_reward);
          
          // 解锁所有以此技能为前置的技能
          await unlockNextSkill(lesson.skill_id);
        }
      }
    } catch (err) {
      console.error('[LessonPage] Error checking skill completion:', err);
    }
  };

  const getScore = () => {
    if (!lesson) return 0;
    return Math.round((correctCount / lesson.content.questions.length) * 100);
  };

  const getStars = () => {
    const score = getScore();
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= lesson!.content.passThreshold * 100) return 1;
    return 0;
  };

  // 播放正确答案（用于反馈卡片的重听按钮）
  const handlePlayCorrectAnswer = useCallback(() => {
    if (!currentQuestion || !isReady) return;
    
    if (currentQuestion.type === 'interval' || currentQuestion.type === 'interval_identify') {
      // 音程：播放两个音
      const baseMidi = currentQuestion.baseMidi ?? currentQuestion.rootMidi ?? 60;
      const intervalSemitones = currentQuestion.intervalSemitones ?? currentQuestion.interval ?? 0;
      
      playNote(getFrequency(baseMidi));
      setTimeout(() => {
        playNote(getFrequency(baseMidi + intervalSemitones));
      }, 600);
    } else if (currentQuestion.type === 'chord' || currentQuestion.type === 'chord_identify') {
      // 和弦：同时播放所有音
      const root = currentQuestion.rootMidi ?? 60;
      let intervals: number[] = [0, 4, 7];
      
      switch (currentQuestion.chordType) {
        case 'major': intervals = [0, 4, 7]; break;
        case 'minor': intervals = [0, 3, 7]; break;
        case 'dim': intervals = [0, 3, 6]; break;
        case 'aug': intervals = [0, 4, 8]; break;
        case 'maj7': intervals = [0, 4, 7, 11]; break;
        case 'min7': intervals = [0, 3, 7, 10]; break;
        case 'dom7': intervals = [0, 4, 7, 10]; break;
      }
      
      intervals.forEach(interval => {
        playNote(getFrequency(root + interval));
      });
    } else if (currentQuestion.targetMidi !== undefined) {
      // 单音
      playNote(getFrequency(currentQuestion.targetMidi));
    }
  }, [currentQuestion, isReady, playNote]);

  const isPassed = () => {
    if (!lesson) return false;
    return getScore() >= lesson.content.passThreshold * 100;
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

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg pattern-grid-lg p-4">
        <Card className="!p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl border-3 border-dark flex items-center justify-center">
            <span className="text-3xl">❓</span>
          </div>
          <p className="text-slate-500 font-bold mb-4">课程未找到</p>
          <Button className="w-full" onClick={() => navigate('/learn')}>
            返回学习中心
          </Button>
        </Card>
      </div>
    );
  }

  // 理论页面显示
  if (gameState === 'theory' && lesson.content.theory) {
    return (
      <TheorySection
        theory={lesson.content.theory}
        lessonName={lesson.name}
        onComplete={() => setGameState('playing')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg flex flex-col">
      {/* Header - Neo-Brutalism Style */}
      <header className="p-4 flex items-center justify-between bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
        <MotionButton 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-slate-100 rounded-xl border-2 border-dark"
          onClick={() => navigate(-1)}
        >
          <X className="w-5 h-5 text-dark" />
        </MotionButton>
        
        {/* Progress Bar */}
        <div className="flex-1 mx-4 max-w-md">
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden border-2 border-dark">
            <MotionDiv 
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${((currentQuestionIndex + (showFeedback ? 1 : 0)) / lesson.content.questions.length) * 100}%` 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 限时模式计时器 */}
          {timeLeft !== null && (
            <div className={`px-3 py-1 font-black rounded-lg border-2 border-dark shadow-neo-sm flex items-center gap-1 ${
              timeLeft <= 2 ? 'bg-red-500 text-white animate-pulse' : 
              timeLeft <= 5 ? 'bg-amber-400 text-dark' : 
              'bg-white text-dark'
            }`}>
              ⏱️ {timeLeft}s
            </div>
          )}
          <div className="px-3 py-1 bg-primary text-white font-black rounded-lg border-2 border-dark shadow-neo-sm">
            {currentQuestionIndex + 1}/{lesson.content.questions.length}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {gameState === 'playing' && currentQuestion && (
            <MotionDiv
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              {/* ========== SING 模式 UI ========== */}
              {lesson?.lesson_type === 'sing' ? (
                <>
                  {/* 音高可视化区域 */}
                  <Card className="!p-0 relative overflow-hidden mb-6 h-64 border-3 border-dark">
                    <PitchVisualizer 
                      pitch={pitch} 
                      isListening={isListening}
                      targetMidi={currentQuestion.targetMidi}
                    />
                    
                    {/* 覆盖层信息 */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-dark shadow-neo-sm">
                        <p className="font-black text-dark text-lg">
                          目标音：{getMidiNoteName(currentQuestion.targetMidi!)}
                        </p>
                      </div>
                    </div>
                    
                    {/* 当前检测到的音高 */}
                    {isListening && pitch && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className={`px-4 py-2 rounded-xl border-2 border-dark shadow-neo-sm ${
                          Math.abs(pitch.midi - currentQuestion.targetMidi!) < 0.5 
                            ? 'bg-secondary text-white' 
                            : 'bg-white/90 backdrop-blur-sm'
                        }`}>
                          <p className="font-black text-lg">
                            {pitch.note}{pitch.octave}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* 进度条 */}
                    {singState === 'recording' && (
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-200">
                        <MotionDiv 
                          className="h-full bg-gradient-to-r from-secondary to-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${singProgress}%` }}
                        />
                      </div>
                    )}
                  </Card>
                  
                  {/* 状态提示和操作按钮 */}
                  <Card className="!p-6 text-center">
                    {singState === 'idle' && (
                      <>
                        <h2 className="text-2xl font-black text-dark mb-4">
                          跟唱练习
                        </h2>
                        <p className="text-slate-500 font-bold mb-6">
                          先听一遍目标音，然后跟着唱出来！
                        </p>
                        <div className="flex gap-4 justify-center">
                          <Button 
                            variant="secondary"
                            className="px-6 py-3"
                            onClick={handleSingDemo}
                          >
                            <Play className="w-5 h-5 mr-2" />
                            听示范
                          </Button>
                          <Button 
                            className="px-6 py-3"
                            onClick={handleStartSing}
                          >
                            <Mic className="w-5 h-5 mr-2" />
                            开始跟唱
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {singState === 'demo' && (
                      <>
                        <MotionDiv
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center border-3 border-primary"
                        >
                          <Volume2 className="w-10 h-10 text-primary" />
                        </MotionDiv>
                        <h2 className="text-2xl font-black text-dark">
                          正在播放示范...
                        </h2>
                        <p className="text-slate-500 font-bold mt-2">请仔细听这个音</p>
                      </>
                    )}
                    
                    {singState === 'countdown' && (
                      <>
                        <MotionDiv
                          key={countdown}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.5, opacity: 0 }}
                          className="w-24 h-24 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center border-4 border-dark shadow-neo"
                        >
                          <span className="text-5xl font-black text-white">{countdown}</span>
                        </MotionDiv>
                        <h2 className="text-2xl font-black text-dark mb-2">
                          准备好了吗？
                        </h2>
                        <p className="text-slate-500 font-bold">
                          倒计时结束后开始唱！
                        </p>
                      </>
                    )}
                    
                    {singState === 'recording' && (
                      <>
                        <MotionDiv
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="w-20 h-20 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center border-3 border-dark shadow-neo"
                        >
                          <Mic className="w-10 h-10 text-white" />
                        </MotionDiv>
                        <h2 className="text-2xl font-black text-dark mb-2">
                          正在录音...
                        </h2>
                        <p className="text-slate-500 font-bold">
                          请唱出目标音并保持稳定
                        </p>
                      </>
                    )}
                    
                    {singState === 'evaluating' && (
                      <>
                        <MotionDiv
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full"
                        />
                        <h2 className="text-xl font-black text-dark">
                          正在分析...
                        </h2>
                      </>
                    )}
                    
                    {singState === 'feedback' && (
                      <MotionDiv
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center border-3 border-dark shadow-neo ${
                          isCorrect ? 'bg-secondary' : 'bg-red-500'
                        }`}>
                          {isCorrect ? (
                            <CheckCircle className="w-10 h-10 text-white" />
                          ) : (
                            <MicOff className="w-10 h-10 text-white" />
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-dark mb-2">
                          {isCorrect ? '非常棒！🎉' : '再试试！'}
                        </h2>
                        <p className="text-slate-500 font-bold">
                          {isCorrect 
                            ? '你的音准很准确！' 
                            : '音准有些偏差，继续练习！'
                          }
                        </p>
                      </MotionDiv>
                    )}
                  </Card>
                </>
              ) : (
                /* ========== QUIZ 模式 UI ========== */
                <>
              <Card className="!p-8 text-center relative overflow-hidden mb-6">
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary/10 rounded-full border-3 border-dark/5" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent/10 rounded-full border-3 border-dark/5" />
                
                <h2 className="text-2xl font-black text-dark mb-8 relative z-10">
                  {currentQuestion.type === 'interval' || currentQuestion.type === 'interval_identify' ? '这是什么音程？' : 
                   currentQuestion.type === 'chord' || currentQuestion.type === 'chord_identify' ? '这是什么和弦？' :
                   currentQuestion.type === 'melody' ? '这是什么旋律？' : '这是什么音？'}
                </h2>
                
                {/* Play Button */}
                <MotionButton
                  className="w-32 h-32 rounded-full bg-primary flex items-center justify-center mx-auto mb-6 shadow-neo border-4 border-dark relative z-10"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayNote}
                >
                  <Volume2 className="w-14 h-14 text-white" />
                </MotionButton>
                
                <p className="text-slate-500 font-bold relative z-10">点击播放音符</p>
              </Card>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                {(currentQuestion.type === 'interval' || currentQuestion.type === 'interval_identify' || 
                  currentQuestion.type === 'chord_identify') ? (
                  // 音程/和弦类型：文字选项
                  (currentQuestion.options as string[])?.map((option: string, index: number) => {
                    const isSelected = selectedIntervalAnswer === option;
                    // interval_identify 用 intervalName 作为正确答案
                    const correctAnswer = currentQuestion.type === 'interval_identify' 
                      ? currentQuestion.intervalName 
                      : currentQuestion.answer;
                    const isCorrectAnswer = option === correctAnswer;
                    
                    let bgColor = 'bg-white hover:bg-slate-50';
                    let borderColor = 'border-dark';
                    let textColor = 'text-dark';
                    
                    if (showFeedback) {
                      if (isCorrectAnswer) {
                        bgColor = 'bg-secondary';
                        textColor = 'text-white';
                      } else if (isSelected && !isCorrectAnswer) {
                        bgColor = 'bg-red-500';
                        borderColor = 'border-red-700';
                        textColor = 'text-white';
                      }
                    }

                    return (
                      <MotionButton
                        key={`${option}-${index}`}
                        className={`
                          p-6 rounded-2xl font-black text-xl border-3 transition-all shadow-neo-sm
                          ${bgColor} ${borderColor} ${textColor}
                          ${showFeedback ? 'cursor-default' : 'cursor-pointer'}
                        `}
                        whileHover={!showFeedback ? { scale: 1.02, y: -2, boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' } : {}}
                        whileTap={!showFeedback ? { scale: 0.98, y: 0, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)' } : {}}
                        onClick={() => handleSelectIntervalAnswer(option)}
                        disabled={showFeedback}
                      >
                        {option}
                      </MotionButton>
                    );
                  })
                ) : currentQuestion.type === 'melody' ? (
                  // 旋律听写：显示音符序列选项
                  (currentQuestion.options as string[][])?.map((noteSeq: string[], index: number) => {
                    const optionStr = noteSeq.join('-');
                    const isSelected = selectedIntervalAnswer === optionStr;
                    // 第一个选项是正确答案
                    const isCorrectAnswer = index === 0;
                    
                    let bgColor = 'bg-white hover:bg-slate-50';
                    let borderColor = 'border-dark';
                    let textColor = 'text-dark';
                    
                    if (showFeedback) {
                      if (isCorrectAnswer) {
                        bgColor = 'bg-secondary';
                        textColor = 'text-white';
                      } else if (isSelected && !isCorrectAnswer) {
                        bgColor = 'bg-red-500';
                        borderColor = 'border-red-700';
                        textColor = 'text-white';
                      }
                    }

                    return (
                      <MotionButton
                        key={optionStr}
                        className={`
                          p-4 rounded-2xl font-black text-lg border-3 transition-all shadow-neo-sm
                          ${bgColor} ${borderColor} ${textColor}
                          ${showFeedback ? 'cursor-default' : 'cursor-pointer'}
                        `}
                        whileHover={!showFeedback ? { scale: 1.02, y: -2, boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' } : {}}
                        whileTap={!showFeedback ? { scale: 0.98, y: 0, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)' } : {}}
                        onClick={() => handleSelectIntervalAnswer(optionStr)}
                        disabled={showFeedback}
                      >
                        {noteSeq.join(' → ')}
                      </MotionButton>
                    );
                  })
                ) : (
                  // 单音识别类型：MIDI 选项
                  (currentQuestion.options as number[])?.map((midi: number) => {
                    const isSelected = selectedAnswer === midi;
                    const isCorrectAnswer = midi === currentQuestion.targetMidi;
                    
                    let bgColor = 'bg-white hover:bg-slate-50';
                    let borderColor = 'border-dark';
                    let textColor = 'text-dark';
                    
                    if (showFeedback) {
                      if (isCorrectAnswer) {
                        bgColor = 'bg-secondary';
                        textColor = 'text-white';
                      } else if (isSelected && !isCorrectAnswer) {
                        bgColor = 'bg-red-500';
                        borderColor = 'border-red-700';
                        textColor = 'text-white';
                      }
                    }

                    return (
                      <MotionButton
                        key={midi}
                        className={`
                          p-6 rounded-2xl font-black text-xl border-3 transition-all shadow-neo-sm
                          ${bgColor} ${borderColor} ${textColor}
                          ${showFeedback ? 'cursor-default' : 'cursor-pointer'}
                        `}
                        whileHover={!showFeedback ? { scale: 1.02, y: -2, boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' } : {}}
                        whileTap={!showFeedback ? { scale: 0.98, y: 0, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)' } : {}}
                        onClick={() => handleSelectAnswer(midi)}
                        disabled={showFeedback}
                      >
                        {getMidiNoteName(midi)}
                      </MotionButton>
                    );
                  })
                )}
              </div>

              {/* 增强版反馈 */}
              <AnimatePresence>
                {showFeedback && feedbackData && (
                  <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6"
                  >
                    <FeedbackCard
                      isCorrect={isCorrect}
                      userAnswer={feedbackData.userAnswer}
                      correctAnswer={feedbackData.correctAnswer}
                      tip={feedbackData.tip}
                      mnemonic={feedbackData.mnemonic}
                      characteristic={feedbackData.characteristic}
                      onPlayCorrect={!isCorrect ? handlePlayCorrectAnswer : undefined}
                    />
                    
                    {/* 答错时显示继续按钮 */}
                    {!isCorrect && (
                      <MotionDiv
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4"
                      >
                        <Button 
                          className="w-full py-4 text-lg"
                          onClick={handleContinue}
                        >
                          继续 <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </MotionDiv>
                    )}
                  </MotionDiv>
                )}
              </AnimatePresence>
                </>
              )}
            </MotionDiv>
          )}

          {gameState === 'result' && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center"
            >
              <Card className="!p-8 !bg-white text-dark border-3 border-dark shadow-neo relative overflow-hidden">
                {/* Confetti decoration (simplified) */}
                {isPassed() && (
                  <>
                    <div className="absolute top-10 left-10 w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="absolute top-20 right-10 w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="absolute bottom-10 left-20 w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </>
                )}

                {/* Stars */}
                <div className="flex justify-center gap-3 mb-6">
                  {[1, 2, 3].map((i) => (
                    <MotionDiv
                      key={i}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.2, type: 'spring' }}
                    >
                      <Star
                        className={`w-14 h-14 ${i <= getStars() ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' : 'text-slate-200'}`}
                        strokeWidth={2.5}
                      />
                    </MotionDiv>
                  ))}
                </div>

                <h2 className="text-3xl font-black mb-2 text-dark">
                  {isPassed() ? '课程完成！' : '再接再厉！'}
                </h2>
                
                <div className="my-6">
                  <p className="text-6xl font-black text-primary drop-shadow-sm">{getScore()}</p>
                  <p className="text-slate-500 font-bold mt-2">
                    {correctCount} / {lesson.content.questions.length} 正确
                  </p>
                </div>

                {isPassed() && user && (
                  <MotionDiv 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-primary/10 rounded-xl p-4 mb-8 border-2 border-primary/20"
                  >
                    <p className="text-primary font-black text-xl">+{lesson.xp_reward} XP</p>
                  </MotionDiv>
                )}

                {/* 未登录提示 */}
                {!user && (
                  <div className="bg-amber-100 rounded-xl p-4 mb-8 text-amber-800 border-2 border-amber-200">
                    <p className="font-bold">💡 登录后可保存学习进度</p>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {/* 下一关按钮 - 仅在通过且有下一关时显示 */}
                  {isPassed() && nextLessonId && (
                    <Button 
                      className="w-full py-4 text-lg shadow-neo"
                      onClick={() => navigate(`/lesson/${nextLessonId}`)}
                    >
                      下一关 <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                  
                  <div className="flex gap-4">
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-3"
                      onClick={() => navigate(`/learn/skill/${lesson.skill_id}`)}
                    >
                      <List className="w-5 h-5 mr-2" />
                      返回目录
                    </Button>
                    <Button 
                      variant={isPassed() && nextLessonId ? "outline" : "primary"}
                      className="flex-1 py-3"
                      onClick={() => {
                        setCurrentQuestionIndex(0);
                        setCorrectCount(0);
                        setSelectedAnswer(null);
                        setSelectedIntervalAnswer(null);
                        setShowFeedback(false);
                        setNextLessonId(null);
                        setTimeLeft(null);
                        setGameState('playing');
                      }}
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      {isPassed() ? '再练一次' : '重试'}
                    </Button>
                  </div>
                </div>
              </Card>
            </MotionDiv>
          )}
        </AnimatePresence>
      </main>
      
      {/* 游客登录引导弹窗 */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        completedLessons={guestLessonCount}
        trigger="lessons"
      />
    </div>
  );
};
