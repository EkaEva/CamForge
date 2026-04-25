import { describe, it, expect } from 'vitest';
import { validateChartData, normalizeChartOptions } from '../chartDrawing';

describe('validateChartData', () => {
  it('should return false for null', () => {
    expect(validateChartData(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(validateChartData(undefined)).toBe(false);
  });

  it('should return false for empty data', () => {
    expect(validateChartData({ s: [], v: [], a: [], delta_deg: [] } as any)).toBe(false);
  });
});

describe('normalizeChartOptions', () => {
  it('should clamp DPI to max 600', () => {
    const result = normalizeChartOptions({ width: 800, height: 600, isDark: false, lang: 'zh', dpi: 1200 });
    expect(result.dpi).toBe(600);
  });

  it('should clamp dimensions to max 10000', () => {
    const result = normalizeChartOptions({ width: 20000, height: 20000, isDark: false, lang: 'zh' });
    expect(result.width).toBe(10000);
    expect(result.height).toBe(10000);
  });
});
