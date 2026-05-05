// Select 组件测试：渲染、选项、选择

import { render, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../controls/Select';

describe('Select', () => {
  const options = [
    { value: 1, label: 'Uniform' },
    { value: 2, label: 'Constant Acceleration' },
    { value: 3, label: 'Simple Harmonic' },
  ];

  it('renders with label and options', () => {
    const onChange = vi.fn();
    const { container } = render(() => <Select label="Motion Law" value={1} options={options} onChange={onChange} />);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('1');
    expect(container.textContent).toContain('Motion Law');
    expect(select.options.length).toBe(3);
  });

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn();
    const { container } = render(() => <Select label="Motion Law" value={1} options={options} onChange={onChange} />);
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('renders all option labels', () => {
    const onChange = vi.fn();
    const { container } = render(() => <Select label="Motion Law" value={1} options={options} onChange={onChange} />);
    const select = container.querySelector('select') as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map(o => o.textContent);
    expect(optionTexts).toEqual(['Uniform', 'Constant Acceleration', 'Simple Harmonic']);
  });

  it('reflects value change', () => {
    const onChange = vi.fn();
    const { container } = render(() => <Select label="Motion Law" value={2} options={options} onChange={onChange} />);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('2');
  });
});