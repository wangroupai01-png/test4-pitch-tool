import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useManagedTimeouts } from './useManagedTimeouts';

describe('useManagedTimeouts', () => {
  afterEach(() => vi.useRealTimers());

  it('runs scheduled work while mounted', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result } = renderHook(() => useManagedTimeouts());
    act(() => result.current.schedule(callback, 100));
    act(() => vi.advanceTimersByTime(100));
    expect(callback).toHaveBeenCalledOnce();
  });

  it('cancels pending work on unmount', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useManagedTimeouts());
    act(() => result.current.schedule(callback, 100));
    unmount();
    act(() => vi.runAllTimers());
    expect(callback).not.toHaveBeenCalled();
  });
});
