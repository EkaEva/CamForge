import { describe, it, expect } from 'vitest';
import { validateParams } from '../simulation';
import { defaultParams } from '../../constants';

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
});
