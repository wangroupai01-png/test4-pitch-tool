import { useCallback, useEffect, useState } from 'react';
import { completeTask, EMPTY_PROGRESS, normalizeProgress, recordAnswer } from './progress';
import type { ChallengeProgress, ChallengeTaskId } from './types';

const STORAGE_KEY = 'melody-challenge-30-v1';

const readProgress = (): ChallengeProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeProgress(JSON.parse(stored)) : structuredClone(EMPTY_PROGRESS);
  } catch {
    return structuredClone(EMPTY_PROGRESS);
  }
};

export const useChallengeProgress = () => {
  const [progress, setProgress] = useState<ChallengeProgress>(readProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const finishTask = useCallback((day: number, task: ChallengeTaskId) => {
    setProgress((current) => completeTask(current, day, task, new Date().toISOString()));
  }, []);

  const saveAnswer = useCallback((day: number, correct: boolean) => {
    setProgress((current) => recordAnswer(current, day, correct));
  }, []);

  return { progress, finishTask, saveAnswer };
};
