import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Headphones, Target, Sparkles, Volume2, Check, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

// 类型断言解决 framer-motion 类型问题
const MotionDiv = motion.div as any;
const MotionH1 = motion.h1 as any;
const MotionP = motion.p as any;
const MotionButton = motion.button as any;

// 能力等级映射
const ABILITY_LEVELS = {
  0: { level: '完全新手', skill: 'single_note_1', message: '从零开始，稳扎稳打' },
  1: { level: '初级', skill: 'single_note_1', message: '有基础概念，继续加油' },
  2: { level: '入门', skill: 'single_note_1', message: '音感不错，可以快速进步' },
  3: { level: '中级', skill: 'interval_basic', message: '有一定基础，挑战音程吧' },
  4: { level: '进阶', skill: 'fast_recognition', message: '很棒！试试限时挑战' },
  5: { level: '高级', skill: 'complex_intervals', message: '专业水准，直接进阶' },
};

// 能力测试题目
const TEST_QUESTIONS = [
  {
    id: 1,
    type: 'identify',
    targetMidi: 60, // C4
    options: [
      { midi: 60, label: 'C4 (Do)' },
      { midi: 62, label: 'D4 (Re)' },
      { midi: 64, label: 'E4 (Mi)' },
      { midi: 65, label: 'F4 (Fa)' },
    ],
    difficulty: 'easy',
  },
  {
    id: 2,
    type: 'identify',
    targetMidi: 67, // G4
    options: [
      { midi: 64, label: 'E4 (Mi)' },
      { midi: 65, label: 'F4 (Fa)' },
      { midi: 67, label: 'G4 (Sol)' },
      { midi: 69, label: 'A4 (La)' },
    ],
    difficulty: 'easy',
  },
  {
    id: 3,
    type: 'identify',
    targetMidi: 72, // C5
    options: [
      { midi: 69, label: 'A4 (La)' },
      { midi: 71, label: 'B4 (Ti)' },
      { midi: 72, label: 'C5 (高Do)' },
      { midi: 74, label: 'D5 (高Re)' },
    ],
    difficulty: 'medium',
  },
  {
    id: 4,
    type: 'identify',
    targetMidi: 55, // G3
    options: [
      { midi: 52, label: 'E3 (低Mi)' },
      { midi: 53, label: 'F3 (低Fa)' },
      { midi: 55, label: 'G3 (低Sol)' },
      { midi: 57, label: 'A3 (低La)' },
    ],
    difficulty: 'medium',
  },
  {
    id: 5,
    type: 'identify',
    targetMidi: 76, // E5
    options: [
      { midi: 74, label: 'D5' },
      { midi: 76, label: 'E5' },
      { midi: 77, label: 'F5' },
      { midi: 79, label: 'G5' },
    ],
    difficulty: 'hard',
  },
];

// 每日目标选项
const DAILY_GOALS = [
  { minutes: 5, label: '每天5分钟', desc: '轻松入门', icon: '🌱' },
  { minutes: 10, label: '每天10分钟', desc: '稳步提升', icon: '🌿', recommended: true },
  { minutes: 15, label: '每天15分钟', desc: '快速进阶', icon: '🌳' },
];

// MIDI 转频率
const midiToFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export const Onboarding = () => {
  const navigate = useNavigate();
  const { playNote } = useAudioPlayer();
  const user = useUserStore((state) => state.user);
  
  const [step, setStep] = useState<'welcome' | 'test' | 'result' | 'goal'>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 播放音符
  const handlePlayNote = useCallback(async (midi: number) => {
    if (isPlaying) return;
    setIsPlaying(true);
    const freq = midiToFrequency(midi);
    await playNote(freq, 1.2);
    setTimeout(() => setIsPlaying(false), 1200);
  }, [playNote, isPlaying]);

  // 自动播放当前题目
  useEffect(() => {
    if (step === 'test' && currentQuestion < TEST_QUESTIONS.length) {
      const timer = setTimeout(() => {
        handlePlayNote(TEST_QUESTIONS[currentQuestion].targetMidi);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, currentQuestion, handlePlayNote]);

  // 选择答案
  const handleSelectAnswer = (midi: number) => {
    if (showFeedback) return;
    
    setSelectedAnswer(midi);
    const isCorrect = midi === TEST_QUESTIONS[currentQuestion].targetMidi;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setShowFeedback(true);
    
    // 延迟进入下一题
    setTimeout(() => {
      if (currentQuestion < TEST_QUESTIONS.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setStep('result');
      }
    }, 1000);
  };

  // 获取能力等级信息
  const getAbilityInfo = () => {
    const scoreKey = Math.min(score, 5) as keyof typeof ABILITY_LEVELS;
    return ABILITY_LEVELS[scoreKey];
  };

  // 保存引导状态并跳转
  const handleComplete = async () => {
    setIsSaving(true);
    
    const abilityInfo = getAbilityInfo();
    
    if (user) {
      try {
        // 保存到数据库
        await supabase.from('user_onboarding').upsert({
          user_id: user.id,
          onboarding_completed: true,
          ability_test_score: score,
          ability_level: score <= 2 ? 'beginner' : score <= 4 ? 'intermediate' : 'advanced',
          recommended_skill: abilityInfo.skill,
          daily_goal_minutes: dailyGoal,
          onboarding_step: 4,
        }, {
          onConflict: 'user_id',
        });
      } catch (error) {
        console.error('Failed to save onboarding:', error);
      }
    } else {
      // 游客模式：保存到本地（登录后会同步到数据库）
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_ability_level', abilityInfo.level);
      localStorage.setItem('onboarding_ability_score', score.toString());
      localStorage.setItem('onboarding_data', JSON.stringify({
        score,
        dailyGoal,
        recommendedSkill: abilityInfo.skill,
      }));
    }
    
    setIsSaving(false);
    
    // 跳转到推荐的首课
    navigate('/lesson/single_note_1_l1');
  };

  // 跳过引导
  const handleSkip = async () => {
    if (user) {
      try {
        await supabase.from('user_onboarding').upsert({
          user_id: user.id,
          onboarding_completed: true,
          onboarding_step: 0, // 表示跳过
        }, {
          onConflict: 'user_id',
        });
      } catch (error) {
        console.error('Failed to save skip:', error);
      }
    } else {
      localStorage.setItem('onboarding_completed', 'true');
    }
    navigate('/learn');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-light-bg to-secondary/10 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* Step 1: 欢迎页 */}
        {step === 'welcome' && (
          <MotionDiv
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full bg-white rounded-2xl border-4 border-dark shadow-[8px_8px_0_#000] p-8 text-center"
          >
            <MotionDiv
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Music className="w-12 h-12 text-white" />
            </MotionDiv>
            
            <MotionH1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-dark mb-4"
            >
              欢迎来到 Melody Challenger
            </MotionH1>
            
            <MotionP
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-dark/70 text-lg mb-8"
            >
              「让每个人都能拥有好音感」
            </MotionP>
            
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <Button
                onClick={() => setStep('test')}
                className="w-full py-4 text-lg"
              >
                开始我的音乐之旅
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              
              <button
                onClick={handleSkip}
                className="text-dark/50 hover:text-dark text-sm transition-colors"
              >
                跳过引导，直接开始
              </button>
            </MotionDiv>
          </MotionDiv>
        )}

        {/* Step 2: 能力测试 */}
        {step === 'test' && (
          <MotionDiv
            key="test"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full bg-white rounded-2xl border-4 border-dark shadow-[8px_8px_0_#000] p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Headphones className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-dark">快速音感测试</h2>
                <p className="text-dark/60 text-sm">听一听，找到正确的音</p>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="flex gap-2 mb-6">
              {TEST_QUESTIONS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    idx < currentQuestion ? 'bg-secondary' :
                    idx === currentQuestion ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            
            <div className="text-center mb-6">
              <p className="text-dark/60 text-sm mb-2">
                第 {currentQuestion + 1} / {TEST_QUESTIONS.length} 题
              </p>
              <p className="text-dark/80">
                💡 不用担心，这不是考试，只是帮你找到起点
              </p>
            </div>
            
            {/* 播放按钮 */}
            <MotionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlayNote(TEST_QUESTIONS[currentQuestion].targetMidi)}
              disabled={isPlaying}
              className={`w-full py-6 rounded-xl border-3 border-dark mb-6 flex items-center justify-center gap-3 transition-colors ${
                isPlaying ? 'bg-primary/20' : 'bg-primary/10 hover:bg-primary/20'
              }`}
            >
              <Volume2 className={`w-8 h-8 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
              <span className="text-lg font-bold text-dark">
                {isPlaying ? '正在播放...' : '点击播放音符'}
              </span>
            </MotionButton>
            
            {/* 选项 */}
            <div className="grid grid-cols-2 gap-3">
              {TEST_QUESTIONS[currentQuestion].options.map((option) => {
                const isSelected = selectedAnswer === option.midi;
                const isCorrect = option.midi === TEST_QUESTIONS[currentQuestion].targetMidi;
                const showResult = showFeedback && (isSelected || isCorrect);
                
                return (
                  <MotionButton
                    key={option.midi}
                    whileHover={!showFeedback ? { scale: 1.02 } : undefined}
                    whileTap={!showFeedback ? { scale: 0.98 } : undefined}
                    onClick={() => handleSelectAnswer(option.midi)}
                    disabled={showFeedback}
                    className={`p-4 rounded-xl border-3 font-bold transition-all ${
                      showResult
                        ? isCorrect
                          ? 'bg-secondary/20 border-secondary text-secondary'
                          : isSelected
                            ? 'bg-red-100 border-red-400 text-red-600'
                            : 'border-gray-200 text-dark/60'
                        : isSelected
                          ? 'bg-primary/20 border-primary'
                          : 'border-dark hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    {showResult && isCorrect && <Check className="w-4 h-4 inline mr-1" />}
                    {option.label}
                  </MotionButton>
                );
              })}
            </div>
          </MotionDiv>
        )}

        {/* Step 3: 测试结果 */}
        {step === 'result' && (
          <MotionDiv
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full bg-white rounded-2xl border-4 border-dark shadow-[8px_8px_0_#000] p-8 text-center"
          >
            <MotionDiv
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles className="w-10 h-10 text-secondary" />
            </MotionDiv>
            
            <h2 className="text-2xl font-bold text-dark mb-2">测试完成！</h2>
            
            {/* 等级徽章 */}
            <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full font-bold text-lg mb-4">
              <span>🎵</span>
              <span>{getAbilityInfo().level}</span>
            </div>
            
            {/* 得分详情 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-center gap-8 mb-3">
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">{score}</p>
                  <p className="text-sm text-dark/60">正确</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-dark/40">{TEST_QUESTIONS.length - score}</p>
                  <p className="text-sm text-dark/60">错误</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-secondary">{Math.round(score / TEST_QUESTIONS.length * 100)}%</p>
                  <p className="text-sm text-dark/60">正确率</p>
                </div>
              </div>
            </div>
            
            {/* 推荐信息 */}
            <div className="bg-primary/10 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-dark/60 mb-1">💡 专属学习建议</p>
              <p className="text-dark font-medium mb-2">
                {getAbilityInfo().message}
              </p>
              <div className="flex items-center gap-2 text-primary">
                <Music className="w-4 h-4" />
                <span className="font-bold text-sm">推荐从「单音识别」开始学习</span>
              </div>
            </div>
            
            <Button
              onClick={() => setStep('goal')}
              className="w-full py-4"
            >
              设定学习目标
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </MotionDiv>
        )}

        {/* Step 4: 目标设定 */}
        {step === 'goal' && (
          <MotionDiv
            key="goal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full bg-white rounded-2xl border-4 border-dark shadow-[8px_8px_0_#000] p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-accent" />
              <div>
                <h2 className="text-xl font-bold text-dark">设定学习目标</h2>
                <p className="text-dark/60 text-sm">每天花多少时间练习？</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-8">
              {DAILY_GOALS.map((goal) => (
                <MotionButton
                  key={goal.minutes}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDailyGoal(goal.minutes)}
                  className={`w-full p-4 rounded-xl border-3 flex items-center justify-between transition-all ${
                    dailyGoal === goal.minutes
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div className="text-left">
                      <p className="font-bold text-dark">{goal.label}</p>
                      <p className="text-sm text-dark/60">{goal.desc}</p>
                    </div>
                  </div>
                  {goal.recommended && (
                    <span className="bg-secondary text-white text-xs px-2 py-1 rounded-full">
                      推荐
                    </span>
                  )}
                  {dailyGoal === goal.minutes && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </MotionButton>
              ))}
            </div>
            
            <Button
              onClick={handleComplete}
              disabled={isSaving}
              className="w-full py-4 text-lg"
            >
              {isSaving ? '保存中...' : '开始第一课'}
              {!isSaving && <Sparkles className="w-5 h-5 ml-2" />}
            </Button>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};
