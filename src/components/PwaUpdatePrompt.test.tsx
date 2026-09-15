import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UpdateNotice } from './UpdateNotice';

describe('UpdateNotice', () => {
  it('stays hidden until a new version is ready', () => {
    const { container } = render(<UpdateNotice visible={false} onDismiss={() => {}} onUpdate={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lets the user update or defer safely', () => {
    const onUpdate = vi.fn();
    const onDismiss = vi.fn();
    render(<UpdateNotice visible onDismiss={onDismiss} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole('button', { name: '更新并刷新' }));
    fireEvent.click(screen.getByRole('button', { name: '暂不更新' }));
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
