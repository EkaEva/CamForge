import { describe, it, expect } from 'vitest';
import { computeSimulationLocally, validateParams } from '../simulation';
import { defaultParams } from '../../constants';
import { FollowerType } from '../../types';

describe('validateParams', () => {
  it('should validate default params', () => {
    const result = validateParams(defaultParams);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject when angles do not sum to 360', () => {
    const p = { ...defaultParams, delta_0: 100, delta_01: 100, delta_ret: 100, delta_02: 100 };
    const result = validateParams(p);
    expect(result.valid).toBe(false);
  });

  it('should reject when base radius <= |offset|', () => {
    const p = { ...defaultParams, r_0: 5, e: 10 };
    const result = validateParams(p);
    expect(result.valid).toBe(false);
  });

  it('should reject zero stroke', () => {
    const p = { ...defaultParams, h: 0 };
    const result = validateParams(p);
    expect(result.valid).toBe(false);
  });

  it('should reject zero angular velocity', () => {
    const p = { ...defaultParams, omega: 0 };
    const result = validateParams(p);
    expect(result.valid).toBe(false);
  });

  it('should validate oscillating geometry like the backend', () => {
    const p = {
      ...defaultParams,
      follower_type: FollowerType.OscillatingRoller,
      e: 0,
      arm_length: 80,
      h: 10,
      r_0: 40,
      pivot_distance: 95,
    };

    expect(validateParams(p).valid).toBe(true);
    expect(validateParams({ ...p, pivot_distance: 89 }).valid).toBe(false);
    expect(validateParams({ ...p, e: 1 }).valid).toBe(false);
  });

  it('should apply flat face offset to required half width', () => {
    const base = {
      ...defaultParams,
      follower_type: FollowerType.TranslatingFlatFaced,
      r_r: 0,
      e: 0,
      flat_face_offset: 0,
    };
    const offset = { ...base, flat_face_offset: 5 };

    expect(computeSimulationLocally(offset).flat_face_min_half_width)
      .not.toBe(computeSimulationLocally(base).flat_face_min_half_width);
  });
});
