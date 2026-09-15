import { useCallback, useEffect, useRef } from 'react';

export const useManagedTimeouts = () => {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
    return timer;
  }, []);

  const clearAll = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  useEffect(() => clearAll, [clearAll]);

  return { schedule, clearAll };
};
