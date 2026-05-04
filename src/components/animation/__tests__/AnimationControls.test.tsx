import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { AnimationControls } from '../AnimationControls';

const mockFrameData = {
  angleDeg: 90,
  followerX: 0,
  contactX: 0,
  contactY: 50,
  pivotX: null as number | null,
  pivotY: null as number | null,
  armAngle: null as number | null,
  tx: 1, ty: 0, nx: 0, ny: 1,
  alphaI: 15,
  sI: 10,
  xRot: [], yRot: [],
  xRotTheory: [], yRotTheory: [],
  isRising: true, isReturning: false,
};

describe('AnimationControls', () => {
  it('renders play button when not playing', () => {
    const { container } = render(() => (
      <AnimationControls
        playing={false}
        togglePlay={() => {}}
        frame={0}
        setFrame={() => {}}
        maxFrame={359}
        speed={1}
        setSpeed={() => {}}
        frameData={mockFrameData}
        chartPadding={{ left: 60, right: 30 }}
      />
    ));
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('calls togglePlay on button click', async () => {
    const togglePlay = vi.fn();
    const { container } = render(() => (
      <AnimationControls
        playing={false}
        togglePlay={togglePlay}
        frame={0}
        setFrame={() => {}}
        maxFrame={359}
        speed={1}
        setSpeed={() => {}}
        frameData={mockFrameData}
        chartPadding={{ left: 60, right: 30 }}
      />
    ));
    const button = container.querySelector('button')!;
    await fireEvent.click(button);
    expect(togglePlay).toHaveBeenCalled();
  });

  it('displays angle from frameData', () => {
    const { getByText } = render(() => (
      <AnimationControls
        playing={false}
        togglePlay={() => {}}
        frame={90}
        setFrame={() => {}}
        maxFrame={359}
        speed={1}
        setSpeed={() => {}}
        frameData={mockFrameData}
        chartPadding={{ left: 60, right: 30 }}
      />
    ));
    expect(getByText(/90.*360/)).toBeTruthy();
  });

  it('renders speed selector with options', () => {
    const { container } = render(() => (
      <AnimationControls
        playing={false}
        togglePlay={() => {}}
        frame={0}
        setFrame={() => {}}
        maxFrame={359}
        speed={1}
        setSpeed={() => {}}
        frameData={mockFrameData}
        chartPadding={{ left: 60, right: 30 }}
      />
    ));
    const select = container.querySelector('select');
    expect(select).toBeTruthy();
    expect(select!.querySelectorAll('option').length).toBe(5);
  });

  it('calls setSpeed on speed change', async () => {
    const setSpeed = vi.fn();
    const { container } = render(() => (
      <AnimationControls
        playing={false}
        togglePlay={() => {}}
        frame={0}
        setFrame={() => {}}
        maxFrame={359}
        speed={1}
        setSpeed={setSpeed}
        frameData={mockFrameData}
        chartPadding={{ left: 60, right: 30 }}
      />
    ));
    const select = container.querySelector('select')!;
    await fireEvent.change(select, { target: { value: '5' } });
    expect(setSpeed).toHaveBeenCalledWith(5);
  });

  it('renders correctly with null frameData', () => {
    const { container } = render(() => (
      <AnimationControls
        playing={false}
        togglePlay={() => {}}
        frame={0}
        setFrame={() => {}}
        maxFrame={359}
        speed={1}
        setSpeed={() => {}}
        frameData={null}
        chartPadding={{ left: 60, right: 30 }}
      />
    ));
    expect(container.querySelector('button')).toBeTruthy();
  });
});
