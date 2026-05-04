import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { MainCanvas } from '../MainCanvas';

vi.mock('../../../stores/simulation', () => ({
  simulationData: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  lastRunTime: vi.fn(() => 0),
  validationErrors: vi.fn(() => []),
  params: vi.fn(() => ({
    omega: 10, alpha_threshold: 30, n_points: 360,
    follower_type: 1, e: 0, r_r: 10, r_0: 40, h: 20,
    delta_0: 60, delta_01: 30, delta_ret: 60, delta_02: 30,
    sn: 1, pz: 1, tc_law: 1, hc_law: 1, gamma: 45,
    pivot_distance: 100, arm_length: 80, initial_angle: 30,
  })),
  exportStatus: vi.fn(() => ({ type: 'idle' })),
  setExportStatus: vi.fn(),
  paramsUpdated: vi.fn(() => false),
  setParamsUpdated: vi.fn(),
  curveVisible: vi.fn(() => ({ s: true, v: true, a: true })),
  setCurveVisible: vi.fn(),
  cursorFrame: vi.fn(() => 0),
  setCursorFrame: vi.fn(),
  displayOptions: vi.fn(() => ({
    showTangent: false, showNormal: false, showBaseCircle: true,
  })),
  runSimulation: vi.fn(),
}));

vi.mock('../../../i18n', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    t: vi.fn(() => ({
      mainCanvas: {
        clickToStart: 'Click to start',
        simulation: 'Simulation',
        export: 'Export',
        kinematic: 'Kinematic',
        curvature: 'Curvature',
        pressure: 'Pressure',
      },
      status: { running: 'Running...', ready: 'Ready' },
      tabs: { camProfile: 'Cam Profile', simulation: 'Simulation' },
      export: { title: 'Export' },
    })),
  };
});

vi.mock('../../animation/CamAnimation', () => ({
  CamAnimation: () => <div data-testid="cam-animation">CamAnimation</div>,
}));

vi.mock('../../charts/MotionCurves', () => ({
  MotionCurves: () => <div data-testid="motion-curves">MotionCurves</div>,
}));

vi.mock('../../charts/PressureAngleChart', () => ({
  PressureAngleChart: () => <div data-testid="pressure-chart">PressureAngleChart</div>,
}));

vi.mock('../../charts/CurvatureChart', () => ({
  CurvatureChart: () => <div data-testid="curvature-chart">CurvatureChart</div>,
}));

vi.mock('../ExportPanel', () => ({
  ExportPanel: () => <div data-testid="export-panel">ExportPanel</div>,
}));

describe('MainCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders simulation tab by default', () => {
    const { getByText, queryByTestId } = render(() => <MainCanvas activeTab="simulation" onTabChange={() => {}} />);
    expect(getByText('Simulation')).toBeTruthy();
    expect(queryByTestId('export-panel')).toBeNull();
  });

  it('switches to export tab on click', async () => {
    const onTabChange = vi.fn();
    const { getByText } = render(() => <MainCanvas activeTab="simulation" onTabChange={onTabChange} />);
    const exportTab = getByText('Export');
    await fireEvent.click(exportTab);
    expect(onTabChange).toHaveBeenCalledWith('export');
  });

  it('renders export panel when export tab is active', () => {
    const { queryByTestId } = render(() => <MainCanvas activeTab="export" onTabChange={() => {}} />);
    expect(queryByTestId('export-panel')).toBeTruthy();
  });
});