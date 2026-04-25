import { describe, it, expect } from 'vitest';
import { DATA_RANGE_MARGIN, PERCENTILE_CLIP_LOW, PERCENTILE_CLIP_HIGH, EPSILON, TARGET_FPS } from '../../constants/numeric';

describe('numeric constants', () => {
  it('should have valid DATA_RANGE_MARGIN', () => {
    expect(DATA_RANGE_MARGIN).toBeGreaterThan(1);
  });

  it('should have valid percentile values', () => {
    expect(PERCENTILE_CLIP_LOW).toBeGreaterThan(0);
    expect(PERCENTILE_CLIP_HIGH).toBeLessThan(1);
    expect(PERCENTILE_CLIP_LOW).toBeLessThan(PERCENTILE_CLIP_HIGH);
  });

  it('should have valid EPSILON', () => {
    expect(EPSILON).toBeGreaterThan(0);
    expect(EPSILON).toBeLessThan(1);
  });

  it('should have valid TARGET_FPS', () => {
    expect(TARGET_FPS).toBe(60);
  });
});
