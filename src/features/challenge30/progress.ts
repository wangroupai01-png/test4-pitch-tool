import type { ChallengeProgress, ChallengeTaskId, DayProgress } from './types';

export const EMPTY_PROGRESS: ChallengeProgress = { version: 1, days: {}, rewards: [] };
export const TASK_ORDER: ChallengeTaskId[] = ['warmup', 'learn', 'drill', 'challenge', 'reward'];
export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultDay = (): DayProgress => ({ completedTasks: [], attempts: 0, correct: 0 });

export const normalizeProgress = (value: unknown): ChallengeProgress => {
  if (!value || typeof value !== 'object') return structuredClone(EMPTY_PROGRESS);
  const candidate = value as Partial<ChallengeProgress>;
  if (candidate.version !== 1 || !candidate.days || !Array.isArray(candidate.rewards)) return structuredClone(EMPTY_PROGRESS);
  return { version: 1, startedOn: typeof candidate.startedOn === 'string' ? candidate.startedOn : undefined, days: candidate.days, rewards: candidate.rewards.filter((day) => Number.isInteger(day) && day >= 1 && day <= 30) };
};

export const getDayProgress = (progress: ChallengeProgress, day: number): DayProgress => progress.days[String(day)] || defaultDay();

const dateDistance = (from: string, to: string) => Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export const getUnlockedDay = (progress: ChallengeProgress, today = localDateKey()): number => {
  let unlocked = 1;
  for (let day = 1; day <= 30; day += 1) {
    if (!getDayProgress(progress, day).completedAt) break;
    unlocked = Math.min(30, day + 1);
  }
  if (!progress.startedOn) return 1;
  const calendarDay = Math.max(1, Math.min(30, dateDistance(progress.startedOn, today) + 1));
  return Math.min(unlocked, calendarDay);
};

export const resolveSelectedDay = (requestedDay: number | null, unlockedDay: number) => {
  if (requestedDay === null || !Number.isFinite(requestedDay)) return unlockedDay;
  return Math.max(1, Math.min(unlockedDay, Math.floor(requestedDay)));
};

export const completeTask = (progress: ChallengeProgress, day: number, task: ChallengeTaskId, timestamp: string, today = localDateKey()): ChallengeProgress => {
  if (day > getUnlockedDay(progress)) return progress;
  const current = getDayProgress(progress, day);
  const taskIndex = TASK_ORDER.indexOf(task);
  const previousComplete = taskIndex === 0 || current.completedTasks.includes(TASK_ORDER[taskIndex - 1]);
  if (!previousComplete || current.completedTasks.includes(task)) return progress;

  const completedTasks = [...current.completedTasks, task];
  const completedAt = task === 'reward' ? timestamp : current.completedAt;
  return {
    ...progress,
    startedOn: progress.startedOn || today,
    days: { ...progress.days, [String(day)]: { ...current, completedTasks, startedAt: current.startedAt || timestamp, completedAt } },
    rewards: task === 'reward' && !progress.rewards.includes(day) ? [...progress.rewards, day] : progress.rewards,
  };
};

export const recordAnswer = (progress: ChallengeProgress, day: number, correct: boolean): ChallengeProgress => {
  const current = getDayProgress(progress, day);
  return { ...progress, days: { ...progress.days, [String(day)]: { ...current, attempts: current.attempts + 1, correct: current.correct + (correct ? 1 : 0) } } };
};

export const getCompletedCount = (progress: ChallengeProgress) => Object.values(progress.days).filter((day) => day.completedAt).length;

export const getWeekSummary = (progress: ChallengeProgress, week: number) => {
  const start = (week - 1) * 7 + 1;
  const end = Math.min(30, start + 6);
  const days = Array.from({ length: end - start + 1 }, (_, index) => getDayProgress(progress, start + index));
  const attempts = days.reduce((sum, item) => sum + item.attempts, 0);
  const correct = days.reduce((sum, item) => sum + item.correct, 0);
  return { week, start, end, completed: days.filter((item) => item.completedAt).length, attempts, correct, accuracy: attempts ? Math.round((correct / attempts) * 100) : null };
};
