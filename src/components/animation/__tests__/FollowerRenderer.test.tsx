import { describe, it, expect } from 'vitest';
import { render } from '@solidjs/testing-library';
import { FollowerRenderer } from '../FollowerRenderer';
import { FollowerType } from '../../../types';
import type { CamParams, SimulationData } from '../../../types';

const mockViewBoxData = { viewBox: '-100 -100 200 200', r_max: 80 };

const mockFrameData = {
  angleDeg: 0,
  followerX: 0,
  contactX: 0,
  contactY: 50,
  pivotX: null as number | null,
  pivotY: null as number | null,
  armAngle: null as number | null,
  tx: 1, ty: 0, nx: 0, ny: 1,
  alphaI: 15, sI: 10,
  xRot: [0, 10, 20], yRot: [0, 10, 20],
  xRotTheory: [0, 10, 20], yRotTheory: [0, 10, 20],
  isRising: true, isReturning: false,
};

const mockData = {
  s: [0, 10, 20],
  s_0: 40,
  ds_ddelta: [0, 1, 2],
  flat_face_min_half_width: 10,
  flat_face_offset: 0,
} as unknown as SimulationData;

const baseParams: CamParams = {
  follower_type: FollowerType.TranslatingRoller,
  r_r: 10,
  r_0: 40,
  e: 0,
  h: 20,
  omega: 10,
  delta_0: 60,
  delta_01: 30,
  delta_ret: 60,
  delta_02: 30,
  n_points: 360,
  sn: 1,
  pz: 1,
  tc_law: 1,
  hc_law: 1,
  gamma: 45,
  pivot_distance: 100,
  arm_length: 80,
  initial_angle: 30,
  alpha_threshold: 30,
  flat_face_offset: 0,
};

describe('FollowerRenderer', () => {
  it('renders translating roller follower', () => {
    const { container } = render(() => (
      <FollowerRenderer
        frameData={mockFrameData}
        zoom={1}
        data={mockData}
        params={baseParams}
        viewBoxData={mockViewBoxData}
      />
    ));
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('renders knife-edge follower when r_r is 0', () => {
    const params = { ...baseParams, r_r: 0 };
    const { container } = render(() => (
      <FollowerRenderer
        frameData={mockFrameData}
        zoom={1}
        data={mockData}
        params={params}
        viewBoxData={mockViewBoxData}
      />
    ));
    const polygon = container.querySelector('polygon');
    expect(polygon).toBeTruthy();
  });

  it('renders translating flat-faced follower', () => {
    const params = { ...baseParams, follower_type: FollowerType.TranslatingFlatFaced, r_r: 0 };
    const { container } = render(() => (
      <FollowerRenderer
        frameData={mockFrameData}
        zoom={1}
        data={mockData}
        params={params}
        viewBoxData={mockViewBoxData}
      />
    ));
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('renders oscillating roller follower with pivot', () => {
    const params = { ...baseParams, follower_type: FollowerType.OscillatingRoller };
    const oscillatingFrameData = {
      ...mockFrameData,
      pivotX: -70.7,
      pivotY: -70.7,
      armAngle: 0.5,
    };
    const { container } = render(() => (
      <FollowerRenderer
        frameData={oscillatingFrameData}
        zoom={1}
        data={mockData}
        params={params}
        viewBoxData={mockViewBoxData}
      />
    ));
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('renders oscillating flat-faced follower', () => {
    const params = { ...baseParams, follower_type: FollowerType.OscillatingFlatFaced };
    const oscillatingFrameData = {
      ...mockFrameData,
      pivotX: -70.7,
      pivotY: -70.7,
      armAngle: 0.5,
    };
    const { container } = render(() => (
      <FollowerRenderer
        frameData={oscillatingFrameData}
        zoom={1}
        data={mockData}
        params={params}
        viewBoxData={mockViewBoxData}
      />
    ));
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });
});