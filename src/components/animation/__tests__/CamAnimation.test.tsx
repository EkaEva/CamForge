import { describe, it, expect, vi } from 'vitest';
import { render } from '@solidjs/testing-library';
import { CamAnimation } from '../CamAnimation';

// Use vi.fn() directly inside the mock factory (hoisted)
vi.mock('../../../stores/simulation', () => ({
  simulationData: vi.fn(() => null),
  params: vi.fn(() => ({
    omega: 10, alpha_threshold: 30, n_points: 360,
    follower_type: 1, e: 0, r_r: 10, r_0: 40, h: 20,
    delta_0: 60, delta_01: 30, delta_ret: 60, delta_02: 30,
    sn: 1, pz: 1, tc_law: 1, hc_law: 1, gamma: 45,
    pivot_distance: 100, arm_length: 80, initial_angle: 30,
  })),
  displayOptions: vi.fn(() => ({
    showTangent: false, showNormal: false, showBaseCircle: true,
    showNodes: false, showOffsetCircle: false, showCenterLine: true,
    showUpperLimit: false, showLowerLimit: false, showPressureArc: false,
    showBoundaries: false,
  })),
  cursorFrame: vi.fn(() => 0),
  setCursorFrame: vi.fn(),
}));

vi.mock('../../../i18n', () => ({
  t: vi.fn(() => ({
    mainCanvas: { clickToStart: 'Click to start' },
  })),
}));

vi.mock('../../ui/Icon', () => ({
  Icon: (props: any) => <span data-testid="icon">{props.name}</span>,
}));

describe('CamAnimation', () => {
  it('renders fallback when no simulation data', () => {
    const { getByText } = render(() => <CamAnimation />);
    expect(getByText('Click to start')).toBeTruthy();
  });
});