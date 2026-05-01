// ErrorBoundary 组件测试：错误捕获、回退渲染

import { render } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { container } = render(() => (
      <ErrorBoundary>
        <div data-testid="child">Content</div>
      </ErrorBoundary>
    ));
    expect(container.textContent).toContain('Content');
  });

  it('renders default fallback on error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };
    const { container } = render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));
    expect(container.textContent).toContain('Error');
    expect(container.textContent).toContain('Test error');
  });

  it('calls onError callback on error', () => {
    const onError = vi.fn();
    const ThrowError = () => {
      throw new Error('Callback test');
    };
    render(() => (
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    ));
    expect(onError).toHaveBeenCalled();
    const error = onError.mock.calls[0][0] as Error;
    expect(error.message).toBe('Callback test');
  });

  it('renders custom fallback when provided', () => {
    const ThrowError = () => {
      throw new Error('Custom fallback test');
    };
    const { container } = render(() => (
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <ThrowError />
      </ErrorBoundary>
    ));
    expect(container.textContent).toContain('Custom Error UI');
  });
});