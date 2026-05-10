import { describe, it, expect } from 'vitest';
import { getDownloadDir, getDefaultDpi, getDefaultFormat } from '../settings';

describe('settings getters', () => {
  it('getDownloadDir returns a string', () => {
    expect(typeof getDownloadDir()).toBe('string');
  });

  it('getDefaultDpi returns a valid DPI', () => {
    const dpi = getDefaultDpi();
    expect([100, 150, 300, 600]).toContain(dpi);
  });

  it('getDefaultFormat returns a valid format', () => {
    const format = getDefaultFormat();
    expect(['dxf', 'csv', 'png', 'tiff', 'svg']).toContain(format);
  });
});
