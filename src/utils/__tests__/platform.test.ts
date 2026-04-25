import { describe, it, expect } from 'vitest';
import { isTauriEnv, isMobilePlatform, isDesktopPlatform } from '../platform';

describe('platform detection', () => {
  it('isTauriEnv returns false in browser', () => {
    expect(isTauriEnv()).toBe(false);
  });

  it('isDesktopPlatform returns false in browser', () => {
    expect(isDesktopPlatform()).toBe(false);
  });
});
