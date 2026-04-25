/**
 * 平台检测工具函数
 */

export function isTauriEnv(): boolean {
  try {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  } catch {
    return false;
  }
}

export function isMobilePlatform(): boolean {
  if (typeof window === 'undefined') return false;

  // Tauri 移动端检测
  if (isTauriEnv()) {
    const internals = (window as any).__TAURI_INTERNALS__;
    const platform = internals?.metadata?.platform;
    if (platform === 'android' || platform === 'ios') return true;
    // Tauri 桌面端但窄视口，不算移动端平台
    return false;
  }

  // 非 Tauri Web 环境不算移动端平台（仅做视口响应式）
  return false;
}

export function isDesktopPlatform(): boolean {
  return isTauriEnv() && !isMobilePlatform();
}
