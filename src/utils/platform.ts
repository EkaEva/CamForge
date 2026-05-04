/**
 * 平台检测工具函数
 */

interface TauriInternals {
  metadata?: {
    platform?: string;
  };
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: TauriInternals;
  }
}

/**
 * Check whether the app is running in a Tauri desktop/mobile environment
 * @returns true if Tauri internals are detected on window
 */
export function isTauriEnv(): boolean {
  try {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  } catch {
    return false;
  }
}

/**
 * Check whether the app is running on a mobile platform (Android/iOS)
 * @returns true if running on mobile via Tauri
 */
export function isMobilePlatform(): boolean {
  if (typeof window === 'undefined') return false;

  if (isTauriEnv()) {
    const internals = window.__TAURI_INTERNALS__;
    const platform = internals?.metadata?.platform;
    if (platform === 'android' || platform === 'ios') return true;

    // 回退：Tauri 环境下通过 userAgent 检测
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua) || /iPhone|iPad|iPod/i.test(ua)) return true;

    return false;
  }

  return false;
}

/**
 * Check whether the app is running on a desktop platform (Tauri but not mobile)
 * @returns true if running on desktop via Tauri
 */
export function isDesktopPlatform(): boolean {
  return isTauriEnv() && !isMobilePlatform();
}
