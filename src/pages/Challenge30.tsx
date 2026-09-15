import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, Check, CheckCircle2, ChevronRight, Circle, Clock3, Headphones, Lock, Map, Play, RotateCcw, Sparkles, Target, Trophy, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useManagedTimeouts } from '../hooks/useManagedTimeouts';
import { buildQuestions, CHALLENGE_DAYS } from '../features/challenge30/content';
import { getCompletedCount, getDayProgress, getUnlockedDay, getWeekSummary, resolveSelectedDay, TASK_ORDER } from '../features/challenge30/progress';
import { useChallengeProgress } from '../features/challenge30/useChallengeProgress';
import type { ChallengeTaskId, ListeningQuestion } from '../features/challenge30/types';
import { getMidiNoteName, getFrequency } from '../utils/musicTheory';
import { usePitchDetector } from '../hooks/usePitchDetector';

const taskMeta: Record<ChallengeTaskId, { label: string; duration: string; icon: typeof Headphones }> = {
  warmup: { label: '听觉热身', duration: '1 分钟', icon: Headphones },
  learn: { label: '今日新内容', duration: '2 分钟', icon: BookOpen },
  drill: { label: '专项练习', duration: '2 分钟', icon: Target },
  challenge: { label: '今日挑战', duration: '3 分钟', icon: Trophy },
  reward: { label: '领取奖励', duration: '完成', icon: Award },
};

interface QuizPanelProps {
  title: string;
  questions: ListeningQuestion[];
  onAnswer: (correct: boolean) => void;
  onComplete: (score: number) => void;
}

const QuizPanel = ({ title, questions, onAnswer, onComplete }: QuizPanelProps) => {
  const { playNote } = useAudioPlayer();
  const { schedule, clearAll } = useManagedTimeouts();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const question = questions[index];

  useEffect(() => {
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
  }, [questions]);

  const playQuestion = () => {
    clearAll();
    question.audioMidis.forEach((midi, noteIndex) => {
      const delay = question.playTogether ? 0 : noteIndex * 650;
      schedule(() => void playNote(getFrequency(midi), question.playTogether ? 1.3 : 0.8), delay);
    });
  };

  const answer = (option: string) => {
    if (selected !== null) return;
    const correct = option === question.answer;
    setSelected(option);
    setCorrectCount((value) => value + (correct ? 1 : 0));
    onAnswer(correct);
  };

  const next = () => {
    const finalCorrect = correctCount;
    if (index === questions.length - 1) {
      onComplete(Math.round((finalCorrect / questions.length) * 100));
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  };

  if (!question) return null;
  return (
    <section className="rounded-2xl border-3 border-dark bg-white p-5 shadow-neo">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-primary">{title}</p>
          <h2 className="mt-1 text-2xl font-black">听音选出正确音高</h2>
        </div>
        <span className="rounded-full border-2 border-dark bg-slate-100 px-3 py-1 text-sm font-black">{index + 1}/{questions.length}</span>
      </div>
      <button type="button" onClick={playQuestion} className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full border-3 border-dark bg-primary text-white shadow-neo transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none" aria-label="播放题目声音">
        <Volume2 className="h-11 w-11" />
      </button>
      <p className="mt-3 text-center text-sm font-bold text-slate-500">可以反复试听，再作答</p>
      <div className="mt-7 grid grid-cols-2 gap-3">
        {question.options.map((option) => {
          const answered = selected !== null;
          const isCorrect = option.value === question.answer;
          const isSelected = option.value === selected;
          const color = answered && isCorrect ? 'bg-secondary text-white' : answered && isSelected ? 'bg-red-100 text-red-700' : 'bg-white hover:bg-slate-50';
          return <button key={option.value} type="button" disabled={answered} onClick={() => answer(option.value)} className={`rounded-xl border-3 border-dark p-4 text-lg font-black shadow-neo-sm transition-all disabled:opacity-100 ${color}`}>{option.label}</button>;
        })}
      </div>
      {selected !== null && (
        <div className={`mt-5 rounded-xl border-2 border-dark p-4 font-bold ${selected === question.answer ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
          {selected === question.answer ? '听对了。记住这个声音特征。' : `${question.feedback}，再听一次比较差异。`}
          <Button className="mt-4 w-full" onClick={next}>{index === questions.length - 1 ? '查看结果' : '下一题'}<ChevronRight className="h-5 w-5" /></Button>
        </div>
      )}
    </section>
  );
};

interface SingingPanelProps {
  title: string;
  targets: number[];
  onAnswer: (correct: boolean) => void;
  onComplete: (score: number) => void;
}

const SingingPanel = ({ title, targets, onAnswer, onComplete }: SingingPanelProps) => {
  const { playNote } = useAudioPlayer();
  const { pitch, isListening, isStarting, error, startListening, stopListening } = usePitchDetector();
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const target = targets[index];

  useEffect(() => stopListening, [stopListening]);

  const checkPitch = () => {
    if (!pitch || result !== null) return;
    const deviation = Math.abs(pitch.midi + pitch.cents / 100 - target);
    const correct = deviation <= 0.5 && pitch.clarity >= 0.65;
    setResult(correct);
    setCorrectCount((value) => value + (correct ? 1 : 0));
    onAnswer(correct);
  };

  const next = () => {
    if (index === targets.length - 1) {
      stopListening();
      onComplete(Math.round((correctCount / targets.length) * 100));
      return;
    }
    setIndex((value) => value + 1);
    setResult(null);
  };

  return (
    <section className="rounded-2xl border-3 border-dark bg-white p-5 shadow-neo">
      <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-primary">{title}</p><h2 className="mt-1 text-2xl font-black">听目标音，再唱出来</h2></div><span className="rounded-full border-2 border-dark bg-slate-100 px-3 py-1 text-sm font-black">{index + 1}/{targets.length}</span></div>
      <button type="button" onClick={() => void playNote(getFrequency(target), 1.2)} className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full border-3 border-dark bg-primary text-white shadow-neo" aria-label="播放目标音"><Volume2 className="h-9 w-9" /></button>
      <p className="mt-3 text-center text-xl font-black">目标：{getMidiNoteName(target)}</p>
      {!isListening ? <Button className="mt-6 w-full" disabled={isStarting} onClick={() => void startListening()}>{isStarting ? '正在请求麦克风…' : '打开麦克风开始唱'}</Button> : <div className="mt-6 rounded-xl border-2 border-dark bg-slate-50 p-5 text-center"><p className="text-sm font-bold text-slate-500">当前检测</p><p className="mt-1 text-3xl font-black">{pitch ? `${pitch.note}${pitch.octave}` : '等待声音…'}</p><p className="mt-1 text-sm font-bold text-slate-500">{pitch ? `${pitch.cents > 0 ? '+' : ''}${pitch.cents} 音分` : '保持一个稳定长音'}</p><Button className="mt-4 w-full" disabled={!pitch || result !== null} onClick={checkPitch}>检查我的音准</Button></div>}
      {error && <p role="alert" className="mt-4 rounded-xl border-2 border-dark bg-red-50 p-3 font-bold text-red-700">{error}</p>}
      {result !== null && <div className={`mt-4 rounded-xl border-2 border-dark p-4 font-bold ${result ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>{result ? '唱准了，目标音已经稳定命中。' : '还差一点。先重听目标音，下一题继续。'}<Button className="mt-4 w-full" onClick={next}>{index === targets.length - 1 ? '查看结果' : '下一题'}<ChevronRight className="h-5 w-5" /></Button></div>}
    </section>
  );
};

export const Challenge30 = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { progress, finishTask, saveAnswer } = useChallengeProgress();
  const { playNote } = useAudioPlayer();
  const { schedule, clearAll } = useManagedTimeouts();
  const unlockedDay = getUnlockedDay(progress);
  const dayParam = searchParams.get('day');
  const selectedDay = resolveSelectedDay(dayParam === null ? null : Number(dayParam), unlockedDay);
  const trainingDay = CHALLENGE_DAYS[selectedDay - 1];
  const dayProgress = getDayProgress(progress, selectedDay);
  const currentTask = TASK_ORDER.find((task) => !dayProgress.completedTasks.includes(task)) || 'reward';
  const [activeTask, setActiveTask] = useState<ChallengeTaskId>(currentTask);
  const [view, setView] = useState<'today' | 'map' | 'report'>('today');
  const [challengeScore, setChallengeScore] = useState<number | null>(null);
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const completedCount = getCompletedCount(progress);
  const drillQuestions = useMemo(() => buildQuestions(trainingDay, 3, 10), [trainingDay]);
  const challengeQuestions = useMemo(() => buildQuestions(trainingDay, 5, 30 + challengeAttempt), [trainingDay, challengeAttempt]);
  const drillSingTargets = useMemo(() => Array.from({ length: 3 }, (_, index) => trainingDay.notePool[(selectedDay + index) % trainingDay.notePool.length]), [selectedDay, trainingDay]);
  const challengeSingTargets = useMemo(() => Array.from({ length: 5 }, (_, index) => trainingDay.notePool[(selectedDay + challengeAttempt + index * 2) % trainingDay.notePool.length]), [challengeAttempt, selectedDay, trainingDay]);

  useEffect(() => {
    if (!searchParams.has('day')) setSearchParams({ day: String(selectedDay) }, { replace: true });
  }, [searchParams, selectedDay, setSearchParams]);

  useEffect(() => {
    setActiveTask(TASK_ORDER.find((task) => !getDayProgress(progress, selectedDay).completedTasks.includes(task)) || 'reward');
    setChallengeScore(null);
    clearAll();
  }, [clearAll, progress, selectedDay]);

  const selectDay = (day: number) => {
    if (day > unlockedDay) return;
    setSearchParams({ day: String(day) });
    setView('today');
  };

  const playWarmup = () => {
    const notes = trainingDay.notePool.slice(0, 3);
    notes.forEach((note, index) => schedule(() => void playNote(getFrequency(note), 0.8), index * 850));
  };

  const completeAndAdvance = (task: ChallengeTaskId) => {
    finishTask(selectedDay, task);
    const nextIndex = TASK_ORDER.indexOf(task) + 1;
    if (nextIndex < TASK_ORDER.length) setActiveTask(TASK_ORDER[nextIndex]);
  };

  const progressPercent = Math.round((dayProgress.completedTasks.length / TASK_ORDER.length) * 100);
  const latestReportWeek = Math.max(1, Math.min(5, Math.ceil(Math.max(1, completedCount) / 7)));
  const report = getWeekSummary(progress, latestReportWeek);

  return (
    <div className="min-h-screen bg-[#f7f5ee] pb-12 text-dark">
      <header className="sticky top-0 z-40 border-b-3 border-dark bg-[#f7f5ee]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link to="/learn" className="rounded-xl border-2 border-dark bg-white p-2 shadow-neo-sm" aria-label="返回学习中心"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="min-w-0 flex-1"><p className="text-xs font-black text-primary">30 天音感挑战</p><h1 className="truncate text-lg font-black">第 {selectedDay} 天 · {trainingDay.title}</h1></div>
          <div className="rounded-xl border-2 border-dark bg-white px-3 py-2 text-sm font-black shadow-neo-sm">{completedCount}/30</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border-3 border-dark bg-white p-2 shadow-neo">
          {[{ id: 'today', label: '今日训练', icon: Play }, { id: 'map', label: '30天地图', icon: Map }, { id: 'report', label: '成长报告', icon: Trophy }].map((item) => (
            <button key={item.id} type="button" onClick={() => setView(item.id as typeof view)} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-black ${view === item.id ? 'bg-dark text-white' : 'hover:bg-slate-100'}`}><item.icon className="h-4 w-4" /><span className="hidden sm:inline">{item.label}</span></button>
          ))}
        </div>

        {view === 'today' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside>
              <section className="overflow-hidden rounded-2xl border-3 border-dark bg-primary text-white shadow-neo">
                <div className="p-6"><p className="text-sm font-black text-white/75">{trainingDay.chapter}</p><h2 className="mt-2 text-3xl font-black">{trainingDay.title}</h2><p className="mt-3 font-medium text-white/85">{trainingDay.goal}</p><div className="mt-5 flex items-center gap-2 text-sm font-bold"><Clock3 className="h-4 w-4" />约 8 分钟</div></div>
                <div className="border-t-3 border-dark bg-white p-4 text-dark"><div className="flex justify-between text-sm font-black"><span>今日进度</span><span>{progressPercent}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-dark bg-slate-100"><div className="h-full bg-secondary transition-all" style={{ width: `${progressPercent}%` }} /></div></div>
              </section>
              <div className="mt-5 space-y-2">
                {TASK_ORDER.map((task, index) => {
                  const done = dayProgress.completedTasks.includes(task);
                  const available = index === 0 || dayProgress.completedTasks.includes(TASK_ORDER[index - 1]);
                  const MetaIcon = taskMeta[task].icon;
                  return <button key={task} type="button" disabled={!available} onClick={() => setActiveTask(task)} className={`flex w-full items-center gap-3 rounded-xl border-2 border-dark p-3 text-left transition-all ${activeTask === task ? 'bg-dark text-white shadow-neo-sm' : done ? 'bg-green-50' : 'bg-white'} disabled:cursor-not-allowed disabled:opacity-45`}><span className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-dark ${done ? 'bg-secondary text-white' : 'bg-white text-dark'}`}>{done ? <Check className="h-5 w-5" /> : <MetaIcon className="h-5 w-5" />}</span><span className="flex-1"><span className="block font-black">{taskMeta[task].label}</span><span className={`text-xs font-bold ${activeTask === task ? 'text-white/65' : 'text-slate-400'}`}>{taskMeta[task].duration}</span></span></button>;
                })}
              </div>
            </aside>

            <div>
              {activeTask === 'warmup' && <section className="rounded-2xl border-3 border-dark bg-white p-6 shadow-neo"><Headphones className="h-10 w-10 text-primary" /><h2 className="mt-4 text-3xl font-black">先唤醒耳朵</h2><p className="mt-3 font-medium text-slate-600">连续听三个音，不用回答。注意它们的高低位置和移动方向。</p><Button className="mt-8 w-full" onClick={playWarmup}><Volume2 className="h-5 w-5" />播放热身音组</Button><Button variant="secondary" className="mt-3 w-full" onClick={() => completeAndAdvance('warmup')}>完成热身<ChevronRight className="h-5 w-5" /></Button></section>}

              {activeTask === 'learn' && <section className="rounded-2xl border-3 border-dark bg-white p-6 shadow-neo"><p className="text-sm font-black text-primary">今日新内容</p><h2 className="mt-2 text-3xl font-black">{trainingDay.title}</h2><p className="mt-5 text-lg font-medium leading-8 text-slate-700">{trainingDay.theory}</p><div className="mt-6 rounded-xl border-2 border-dark bg-amber-50 p-4"><p className="font-black">听音提示</p><p className="mt-1 font-medium text-amber-900">{trainingDay.listeningTip}</p></div><div className="mt-6 grid grid-cols-2 gap-3">{trainingDay.notePool.slice(0, 4).map((note) => <button key={note} type="button" onClick={() => void playNote(getFrequency(note), 1)} className="rounded-xl border-2 border-dark bg-white p-4 font-black shadow-neo-sm"><Volume2 className="mx-auto mb-2 h-5 w-5 text-primary" />{getMidiNoteName(note)}</button>)}</div><Button className="mt-7 w-full" onClick={() => completeAndAdvance('learn')}>理解了，开始练习<ChevronRight className="h-5 w-5" /></Button></section>}

              {activeTask === 'drill' && trainingDay.mode !== 'sing' && <QuizPanel key={`drill-${selectedDay}`} title="专项练习 · 3题" questions={drillQuestions} onAnswer={(correct) => saveAnswer(selectedDay, correct)} onComplete={() => completeAndAdvance('drill')} />}
              {activeTask === 'drill' && trainingDay.mode === 'sing' && <SingingPanel key={`sing-drill-${selectedDay}`} title="专项模唱 · 3题" targets={drillSingTargets} onAnswer={(correct) => saveAnswer(selectedDay, correct)} onComplete={() => completeAndAdvance('drill')} />}

              {activeTask === 'challenge' && challengeScore === null && trainingDay.mode !== 'sing' && <QuizPanel key={`challenge-${selectedDay}-${challengeAttempt}`} title="今日挑战 · 5题" questions={challengeQuestions} onAnswer={(correct) => saveAnswer(selectedDay, correct)} onComplete={setChallengeScore} />}
              {activeTask === 'challenge' && challengeScore === null && trainingDay.mode === 'sing' && <SingingPanel key={`sing-challenge-${selectedDay}-${challengeAttempt}`} title="今日模唱挑战 · 5题" targets={challengeSingTargets} onAnswer={(correct) => saveAnswer(selectedDay, correct)} onComplete={setChallengeScore} />}
              {activeTask === 'challenge' && challengeScore !== null && <section className={`rounded-2xl border-3 border-dark p-6 shadow-neo ${challengeScore >= 60 ? 'bg-green-50' : 'bg-amber-50'}`}><div className="flex h-16 w-16 items-center justify-center rounded-full border-3 border-dark bg-white">{challengeScore >= 60 ? <CheckCircle2 className="h-9 w-9 text-secondary" /> : <RotateCcw className="h-9 w-9 text-accent" />}</div><h2 className="mt-5 text-3xl font-black">{challengeScore >= 60 ? '今日挑战通过' : '再听一轮会更稳'}</h2><p className="mt-2 text-lg font-bold">正确率 {challengeScore}%</p>{challengeScore >= 60 ? <Button className="mt-7 w-full" onClick={() => completeAndAdvance('challenge')}>去领取奖励<ChevronRight className="h-5 w-5" /></Button> : <Button className="mt-7 w-full" onClick={() => { setChallengeScore(null); setChallengeAttempt((value) => value + 1); }}>重新挑战</Button>}</section>}

              {activeTask === 'reward' && <section className="overflow-hidden rounded-2xl border-3 border-dark bg-dark text-white shadow-neo"><div className="p-7 text-center"><div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl border-3 border-white bg-primary text-5xl font-black shadow-[6px_6px_0_#fff]">{trainingDay.reward.symbol}</div><p className="mt-7 text-sm font-black text-accent">{trainingDay.reward.rarity}收藏</p><h2 className="mt-2 text-3xl font-black">{trainingDay.reward.name}</h2><p className="mt-3 text-white/70">{trainingDay.reward.description}</p></div><div className="border-t-3 border-white/30 bg-white p-5 text-dark">{dayProgress.completedAt ? <div className="text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-secondary" /><p className="mt-2 font-black">第 {selectedDay} 天已完成</p>{selectedDay < 30 && (unlockedDay > selectedDay ? <Button className="mt-4 w-full" onClick={() => selectDay(selectedDay + 1)}>进入第 {selectedDay + 1} 天</Button> : <div className="mt-4 rounded-xl border-2 border-dark bg-amber-50 p-4"><p className="font-black">第 {selectedDay + 1} 天明日解锁</p><p className="mt-1 text-sm font-medium text-amber-900">明天回来，用约 8 分钟继续。</p></div>)}</div> : <Button className="w-full" onClick={() => completeAndAdvance('reward')}><Sparkles className="h-5 w-5" />收下奖励并完成今天</Button>}</div></section>}
            </div>
          </div>
        )}

        {view === 'map' && <section className="mt-6"><div className="rounded-2xl border-3 border-dark bg-white p-6 shadow-neo"><h2 className="text-3xl font-black">30 天训练地图</h2><p className="mt-2 font-medium text-slate-600">每天约 8 分钟，完成当天才会打开下一天。</p></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{CHALLENGE_DAYS.map((item) => { const itemProgress = getDayProgress(progress, item.day); const locked = item.day > unlockedDay; const complete = Boolean(itemProgress.completedAt); return <button key={item.day} type="button" disabled={locked} onClick={() => selectDay(item.day)} className={`min-h-36 rounded-2xl border-3 border-dark p-4 text-left shadow-neo-sm transition-all ${complete ? 'bg-secondary text-white' : locked ? 'bg-slate-200 text-slate-400' : item.day === unlockedDay ? 'bg-primary text-white' : 'bg-white'}`}><div className="flex items-center justify-between"><span className="text-sm font-black">DAY {item.day}</span>{complete ? <Check className="h-5 w-5" /> : locked ? <Lock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</div><p className="mt-5 font-black leading-tight">{item.title}</p><p className="mt-2 text-xs font-bold opacity-70">{item.chapter.split(' · ')[0]}</p></button>; })}</div></section>}

        {view === 'report' && <section className="mt-6 grid gap-5 md:grid-cols-2"><div className="rounded-2xl border-3 border-dark bg-white p-6 shadow-neo"><p className="text-sm font-black text-primary">第 {report.week} 周</p><h2 className="mt-2 text-3xl font-black">成长报告</h2>{report.completed === 0 ? <p className="mt-5 font-medium text-slate-600">完成训练后，这里会显示真实正确率和完成天数。</p> : <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl border-2 border-dark bg-slate-50 p-4"><p className="text-3xl font-black">{report.completed}/{report.end - report.start + 1}</p><p className="text-sm font-bold text-slate-500">完成天数</p></div><div className="rounded-xl border-2 border-dark bg-slate-50 p-4"><p className="text-3xl font-black">{report.accuracy === null ? '—' : `${report.accuracy}%`}</p><p className="text-sm font-bold text-slate-500">真实正确率</p></div><div className="col-span-2 rounded-xl border-2 border-dark bg-green-50 p-4"><p className="font-black">本周已完成 {report.attempts} 次听音判断</p><p className="mt-1 text-sm font-medium text-green-900">继续完成训练，报告会自动更新。</p></div></div>}</div><div className="rounded-2xl border-3 border-dark bg-white p-6 shadow-neo"><h3 className="text-xl font-black">我的收藏</h3><p className="mt-1 text-sm font-medium text-slate-500">每完成一天，获得一张训练收藏。</p><div className="mt-5 grid grid-cols-4 gap-3">{progress.rewards.length ? progress.rewards.map((dayNumber) => { const reward = CHALLENGE_DAYS[dayNumber - 1].reward; return <div key={dayNumber} title={reward.name} className="flex aspect-square items-center justify-center rounded-xl border-2 border-dark bg-primary text-2xl font-black text-white shadow-neo-sm">{reward.symbol}</div>; }) : <p className="col-span-4 rounded-xl border-2 border-dashed border-slate-300 p-5 text-center font-medium text-slate-500">完成第 1 天后获得第一张收藏</p>}</div></div></section>}
      </main>
    </div>
  );
};
