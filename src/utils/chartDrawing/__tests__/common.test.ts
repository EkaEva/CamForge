import { describe, it, expect } from 'vitest';
import {
  sanitizeNumber,
  validateChartData,
  normalizeChartOptions,
  validateAnimationFrameOptions,
  getScaleFactor,
  tr,
  DEFAULT_DPI,
  MAX_DPI,
  MAX_DIMENSION,
} from '../common';
import type { SimulationData, ChartDrawOptions, AnimationFrameOptions } from '../common';

describe('sanitizeNumber', () => {
  it('returns finite values unchanged', () => {
    expect(sanitizeNumber(42)).toBe(42);
    expect(sanitizeNumber(-3.14)).toBe(-3.14);
    expect(sanitizeNumber(0)).toBe(0);
  });

  it('returns fallback for NaN', () => {
    expect(sanitizeNumber(NaN)).toBe(0);
    expect(sanitizeNumber(NaN, -1)).toBe(-1);
  });

  it('returns fallback for Infinity', () => {
    expect(sanitizeNumber(Infinity)).toBe(0);
    expect(sanitizeNumber(-Infinity, 99)).toBe(99);
  });
});

describe('validateChartData', () => {
  it('returns false for null', () => {
    expect(validateChartData(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(validateChartData(undefined)).toBe(false);
  });

  it('returns false for empty arrays', () => {
    expect(validateChartData({ s: [], v: [], a: [], delta_deg: [] } as unknown as SimulationData)).toBe(false);
  });

  it('returns false for mismatched lengths', () => {
    expect(validateChartData({ s: [1, 2], v: [1], a: [1, 2], delta_deg: [1, 2] } as unknown as SimulationData)).toBe(false);
  });

  it('returns true for valid data', () => {
    const data = { s: [1, 2], v: [3, 4], a: [5, 6], delta_deg: [0, 1] } as unknown as SimulationData;
    expect(validateChartData(data)).toBe(true);
  });
});

describe('normalizeChartOptions', () => {
  it('clamps DPI to MAX_DPI', () => {
    const opts: ChartDrawOptions = { width: 100, height: 100, isDark: false, lang: 'en', dpi: 9999 };
    expect(normalizeChartOptions(opts).dpi).toBe(MAX_DPI);
  });

  it('defaults DPI to DEFAULT_DPI when not specified', () => {
    const opts: ChartDrawOptions = { width: 100, height: 100, isDark: false, lang: 'en' };
    expect(normalizeChartOptions(opts).dpi).toBe(DEFAULT_DPI);
  });

  it('clamps width to [1, MAX_DIMENSION]', () => {
    const opts1: ChartDrawOptions = { width: 0, height: 100, isDark: false, lang: 'en' };
    expect(normalizeChartOptions(opts1).width).toBe(1);

    const opts2: ChartDrawOptions = { width: 99999, height: 100, isDark: false, lang: 'en' };
    expect(normalizeChartOptions(opts2).width).toBe(MAX_DIMENSION);
  });

  it('clamps height to [1, MAX_DIMENSION]', () => {
    const opts1: ChartDrawOptions = { width: 100, height: -5, isDark: false, lang: 'en' };
    expect(normalizeChartOptions(opts1).height).toBe(1);

    const opts2: ChartDrawOptions = { width: 100, height: 99999, isDark: false, lang: 'en' };
    expect(normalizeChartOptions(opts2).height).toBe(MAX_DIMENSION);
  });
});

describe('validateAnimationFrameOptions', () => {
  const validOpts: AnimationFrameOptions = {
    width: 800, height: 600, frameIndex: 0,
    displayOptions: {} as any, zoom: 1,
  };

  it('returns true for valid options', () => {
    expect(validateAnimationFrameOptions(validOpts, 360)).toBe(true);
  });

  it('returns false for zero width', () => {
    expect(validateAnimationFrameOptions({ ...validOpts, width: 0 }, 360)).toBe(false);
  });

  it('returns false for negative height', () => {
    expect(validateAnimationFrameOptions({ ...validOpts, height: -1 }, 360)).toBe(false);
  });

  it('returns false for out-of-range frameIndex', () => {
    expect(validateAnimationFrameOptions({ ...validOpts, frameIndex: 360 }, 360)).toBe(false);
    expect(validateAnimationFrameOptions({ ...validOpts, frameIndex: -1 }, 360)).toBe(false);
  });

  it('returns false for zero zoom', () => {
    expect(validateAnimationFrameOptions({ ...validOpts, zoom: 0 }, 360)).toBe(false);
  });
});

describe('getScaleFactor', () => {
  it('returns 1 for default DPI', () => {
    expect(getScaleFactor(DEFAULT_DPI)).toBe(1);
  });

  it('returns 3 for 300 DPI', () => {
    expect(getScaleFactor(300)).toBe(3);
  });
});

describe('tr', () => {
  it('returns Chinese fallback for zh lang', () => {
    expect(tr('zh', 'motionTitle')).toBe('推杆运动线图');
  });

  it('returns English fallback for en lang', () => {
    expect(tr('en', 'motionTitle')).toBe('Motion Curves');
  });

  it('uses translations object when provided', () => {
    const translations = {
      chart: { motionTitle: 'Custom Title' },
    } as any;
    expect(tr('en', 'motionTitle', translations)).toBe('Custom Title');
  });

  it('falls back when key not in translations', () => {
    const translations = { chart: {} } as any;
    expect(tr('en', 'motionTitle', translations)).toBe('Motion Curves');
  });
});
