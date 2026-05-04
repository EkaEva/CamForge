import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CamParams } from '../../../types';

// Test the store functions and logic that Sidebar depends on
// rather than rendering the full component tree (which has deep mock requirements)

const defaultParams: CamParams = {
  delta_0: 150, delta_01: 30, delta_ret: 150, delta_02: 30,
  h: 20, omega: 10, n_points: 360, r_0: 40, e: 0, r_r: 10,
  follower_type: 2, sn: 1, pz: 1, tc_law: 1, hc_law: 1,
  gamma: 45, pivot_distance: 100, arm_length: 80,
  initial_angle: 30, alpha_threshold: 30, flat_face_offset: 0,
};

describe('Sidebar logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('randomizeParams generates valid params', async () => {
    const { randomizeParams, params } = await import('../../../stores/simulation');
    randomizeParams();
    const p = params();
    expect(p).toHaveProperty('omega');
    expect(p).toHaveProperty('n_points');
    expect(p).toHaveProperty('follower_type');
  });

  it('validateParams returns errors for invalid input', async () => {
    const { validateParams } = await import('../../../stores/simulation');
    const result = validateParams({ ...defaultParams, omega: -1, n_points: 0 });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validateParams returns no errors for valid input', async () => {
    const { validateParams } = await import('../../../stores/simulation');
    const result = validateParams({ ...defaultParams, omega: 10, n_points: 360 });
    expect(result.errors.length).toBe(0);
  });

  it('updateParam is callable', async () => {
    const { updateParam } = await import('../../../stores/simulation');
    expect(typeof updateParam).toBe('function');
    updateParam('omega', 20);
  });

  it('updateDisplayOption is callable', async () => {
    const { updateDisplayOption } = await import('../../../stores/simulation');
    expect(typeof updateDisplayOption).toBe('function');
    updateDisplayOption('showTangent', true);
  });

  it('preset save/load/delete cycle is callable', async () => {
    const { savePreset, loadPreset, deletePreset, getSavedPresets } = await import('../../../stores/simulation');
    expect(typeof savePreset).toBe('function');
    expect(typeof loadPreset).toBe('function');
    expect(typeof deletePreset).toBe('function');
    expect(typeof getSavedPresets).toBe('function');

    savePreset('test-preset');
    loadPreset('test-preset');
    deletePreset('test-preset');
    const presets = getSavedPresets();
    expect(Array.isArray(presets)).toBe(true);
  });
});