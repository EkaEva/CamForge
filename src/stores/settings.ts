import { createSignal, createEffect } from 'solid-js';
import { isTauriEnv } from '../utils/platform';

/**
 * Theme mode: 'light', 'dark', or 'system' (follows OS preference).
 * 主题模式：'light'（浅色）、'dark'（深色）或 'system'（跟随系统）
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Export settings for file output configuration.
 * 文件导出设置
 */
export interface ExportSettings {
  /** Default DPI for raster exports / 默认导出 DPI */
  defaultDpi: number;
  /** Default export format ('dxf' | 'csv' | 'svg' | 'png' | 'tiff') / 默认导出格式 */
  defaultFormat: string;
  /** Custom download directory path (Tauri only) / 自定义下载目录路径（仅 Tauri） */
  downloadDir: string;
}

const [themeMode, setThemeMode] = createSignal<ThemeMode>(
  (localStorage.getItem('camforge-theme-mode') as ThemeMode) || 'system'
);

const [exportSettings, setExportSettings] = createSignal<ExportSettings>({
  defaultDpi: parseInt(localStorage.getItem('camforge-default-dpi') || '100'),
  defaultFormat: localStorage.getItem('camforge-default-format') || 'dxf',
  downloadDir: localStorage.getItem('camforge-download-dir') || '',
});

/**
 * Initialize theme based on stored preference and apply to document.
 * 根据存储的偏好初始化主题并应用到文档。
 */
export function initTheme() {
  createEffect(() => {
    const mode = themeMode();
    const isDark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('camforge-theme-mode', mode);
  });
}

/**
 * Toggle between light and dark theme.
 * 在浅色和深色主题之间切换。
 */
export function toggleTheme() {
  const current = themeMode();
  setThemeMode(current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light');
}

/**
 * Set the theme mode explicitly.
 * 显式设置主题模式。
 * @param mode - The theme mode to set
 */
export function setThemeMode(mode: ThemeMode) {
  setThemeMode(mode);
}

/**
 * Update export settings with partial changes.
 * 使用部分变更更新导出设置。
 * @param updates - Partial export settings to merge
 */
export function updateExportSettings(updates: Partial<ExportSettings>) {
  setExportSettings((prev) => {
    const next = { ...prev, ...updates };
    localStorage.setItem('camforge-default-dpi', String(next.defaultDpi));
    localStorage.setItem('camforge-default-format', next.defaultFormat);
    localStorage.setItem('camforge-download-dir', next.downloadDir);
    return next;
  });
}

/**
 * Get the configured download directory (Tauri only).
 * 获取配置的下载目录（仅 Tauri 桌面端）。
 * @returns The download directory path, or empty string if not set
 */
export function getDownloadDir(): string {
  return exportSettings().downloadDir;
}

/**
 * Get the default DPI for raster exports.
 * 获取默认导出 DPI。
 * @returns The default DPI value
 */
export function getDefaultDpi(): number {
  return exportSettings().defaultDpi;
}

/**
 * Get the default export format.
 * 获取默认导出格式。
 * @returns The default format string (e.g. 'dxf', 'csv')
 */
export function getDefaultFormat(): string {
  return exportSettings().defaultFormat;
}

/**
 * Set the download directory for file exports (Tauri only).
 * 设置文件导出的下载目录（仅 Tauri 桌面端）。
 * @param dir - The directory path
 */
export function setDownloadDir(dir: string) {
  updateExportSettings({ downloadDir: dir });
}

/**
 * Reactive hook for the current resolved theme ('light' or 'dark').
 * 响应式主题钩子，返回当前解析后的主题（'light' 或 'dark'）。
 * @returns A signal with the current theme
 */
export function useTheme() {
  return () => {
    const mode = themeMode();
    return mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  };
}

/**
 * Reactive hook for export settings.
 * 响应式导出设置钩子。
 * @returns A signal with the current export settings
 */
export function useExportSettings() {
  return exportSettings;
}
