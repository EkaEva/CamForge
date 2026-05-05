import type { CamParams } from '../../types';
import { params, setParams } from './core';

/**
 * Save current parameters as a named preset to localStorage.
 * 将当前参数保存为命名预设到 localStorage。
 * @param name - The preset name
 */
export function savePreset(name: string) {
  const presets = getSavedPresets();
  presets[name] = params();
  localStorage.setItem('camforge-presets', JSON.stringify(presets));
}

/**
 * Load a saved preset by name and apply it to the current session.
 * 按名称加载已保存的预设并应用到当前会话。
 * @param name - The preset name to load
 * @returns true if the preset was found and loaded, false otherwise
 */
export function loadPreset(name: string): boolean {
  const presets = getSavedPresets();
  if (presets[name]) {
    setParams(presets[name]);
    return true;
  }
  return false;
}

/**
 * Get all saved presets from localStorage.
 * 从 localStorage 获取所有已保存的预设。
 * @returns Record mapping preset names to CamParams
 */
export function getSavedPresets(): Record<string, CamParams> {
  try {
    return JSON.parse(localStorage.getItem('camforge-presets') || '{}');
  } catch {
    return {};
  }
}

/**
 * Delete a saved preset by name.
 * 按名称删除已保存的预设。
 * @param name - The preset name to delete
 */
export function deletePreset(name: string) {
  const presets = getSavedPresets();
  delete presets[name];
  localStorage.setItem('camforge-presets', JSON.stringify(presets));
}

/**
 * Generate a JSON string of the current parameters for sharing.
 * 生成当前参数的 JSON 字符串用于分享。
 * @returns JSON string of the current CamParams
 */
export function generatePresetJSON(): string {
  return JSON.stringify(params(), null, 2);
}

/**
 * Load parameters from a JSON string and apply them.
 * 从 JSON 字符串加载参数并应用。
 * @param json - JSON string containing CamParams
 * @returns true if loaded successfully, false if JSON is invalid
 */
export function loadPresetFromJSON(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    setParams(parsed);
    return true;
  } catch {
    return false;
  }
}
