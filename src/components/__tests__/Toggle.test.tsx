// Toggle 组件测试：渲染、状态切换

import { createSignal } from 'solid-js';
import { render, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import { Toggle } from '../controls/Toggle';

describe('Toggle', () => {
  it('renders with label', () => {
    const onChange = vi.fn();
    const [checked] = createSignal(false);
    const { container } = render(() => <Toggle label="Dark Mode" checked={checked} onChange={onChange} />);
    expect(container.textContent).toContain('Dark Mode');
  });

  it('reflects checked state via aria-checked', () => {
    const onChange = vi.fn();
    const [checked] = createSignal(true);
    const { container } = render(() => <Toggle label="Dark Mode" checked={checked} onChange={onChange} />);
    const button = container.querySelector('[role="switch"]') as HTMLElement;
    expect(button.getAttribute('aria-checked')).toBe('true');
  });

  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    const [checked, setChecked] = createSignal(false);
    const { container } = render(() => <Toggle label="Dark Mode" checked={checked} onChange={(v) => { setChecked(v); onChange(v); }} />);
    const button = container.querySelector('[role="switch"]') as HTMLElement;
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles from checked to unchecked', () => {
    const onChange = vi.fn();
    const [checked, setChecked] = createSignal(true);
    const { container } = render(() => <Toggle label="Dark Mode" checked={checked} onChange={(v) => { setChecked(v); onChange(v); }} />);
    const button = container.querySelector('[role="switch"]') as HTMLElement;
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});