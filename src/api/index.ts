/**
 * API 适配层
 *
 * 提供统一的 API 接口，自动检测环境并选择正确的实现：
 * - Tauri 环境：使用 IPC 调用
 * - Web 环境：使用 HTTP API
 */

import type { CamParams, SimulationData } from '../types';
import { isTauriEnv } from '../utils/tauri';

// 导出具体实现
export { TauriApi } from './tauri';
export { HttpApi } from './http';

// API 接口定义
export interface CamApi {
  /**
   * Run cam simulation
   * @param params - Cam design parameters
   * @returns Simulation result data
   */
  runSimulation(params: CamParams): Promise<SimulationData>;

  /**
   * Export DXF file
   * @param params - Cam design parameters
   * @param includeActual - Whether to include actual profile (default true)
   * @returns DXF file as Blob
   */
  exportDxf(params: CamParams, includeActual?: boolean): Promise<Blob>;

  /**
   * Export CSV file
   * @param params - Cam design parameters
   * @param lang - Language code (default 'zh')
   * @returns CSV content as string
   */
  exportCsv(params: CamParams, lang?: string): Promise<string>;

  /**
   * Export SVG file
   * @param params - Cam design parameters
   * @param lang - Language code (default 'zh')
   * @returns SVG content as string
   */
  exportSvg(params: CamParams, lang?: string): Promise<string>;

  /**
   * Export Excel file
   * @param params - Cam design parameters
   * @param lang - Language code (default 'zh')
   * @returns Excel file as Blob
   */
  exportExcel(params: CamParams, lang?: string): Promise<Blob>;

  /**
   * Export GIF animation
   * @param params - Cam design parameters
   * @param lang - Language code (default 'zh')
   * @param onProgress - Progress callback (0-1)
   * @returns GIF file as Blob
   */
  exportGif(
    params: CamParams,
    lang?: string,
    onProgress?: (progress: number) => void
  ): Promise<Blob>;
}

// 动态导入，避免循环依赖
async function getTauriApi(): Promise<import('./tauri').TauriApi> {
  const { TauriApi } = await import('./tauri');
  return new TauriApi();
}

async function getHttpApi(): Promise<import('./http').HttpApi> {
  const { HttpApi } = await import('./http');
  return new HttpApi();
}

/**
 * Get the API implementation for the current environment
 * @returns CamApi instance (TauriApi or HttpApi)
 */
export async function getApi(): Promise<CamApi> {
  if (isTauriEnv()) {
    return getTauriApi();
  }
  return getHttpApi();
}

/**
 * Get the current API type synchronously
 * @returns 'tauri' or 'http'
 */
export function getApiType(): 'tauri' | 'http' {
  return isTauriEnv() ? 'tauri' : 'http';
}