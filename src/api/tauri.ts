/**
 * Tauri IPC API 实现
 *
 * 通过 Tauri IPC 调用 Rust 后端
 */

import type { CamParams, SimulationData } from '../types';
import type { CamApi } from './index';
import { invokeTauri } from '../utils/tauri';

/**
 * Tauri IPC API implementation of CamApi
 */
export class TauriApi implements CamApi {
  /**
   * Run cam simulation via Tauri IPC
   * @param params - Cam design parameters
   * @returns Simulation result data
   */
  async runSimulation(params: CamParams): Promise<SimulationData> {
    return invokeTauri<SimulationData>('run_simulation', { params });
  }

  /**
   * Export DXF file (placeholder - actual save uses Tauri file dialog)
   * @param _params - Cam design parameters (unused)
   * @param _includeActual - Whether to include actual profile (unused)
   * @returns Empty Blob placeholder
   */
  async exportDxf(_params: CamParams, _includeActual = true): Promise<Blob> {
    // Tauri 环境下使用文件保存对话框
    // 实际实现需要调用 Tauri 的文件保存 API
    // 这里作为占位符，实际导出逻辑在 simulation.ts 中
    return new Blob();
  }

  /**
   * Export CSV file (placeholder - actual logic in simulation.ts)
   * @param _params - Cam design parameters (unused)
   * @param _lang - Language code (unused)
   * @returns Empty string placeholder
   */
  async exportCsv(_params: CamParams, _lang = 'zh'): Promise<string> {
    // Tauri 环境下 CSV 生成在前端完成
    // 这里返回空字符串，实际逻辑在 simulation.ts
    return '';
  }

  /**
   * Export SVG file (placeholder - actual logic in simulation.ts)
   * @param _params - Cam design parameters (unused)
   * @param _lang - Language code (unused)
   * @returns Empty string placeholder
   */
  async exportSvg(_params: CamParams, _lang = 'zh'): Promise<string> {
    // SVG 生成在前端完成
    return '';
  }

  /**
   * Export Excel file (placeholder - actual logic in simulation.ts)
   * @param _params - Cam design parameters (unused)
   * @param _lang - Language code (unused)
   * @returns Empty Blob placeholder
   */
  async exportExcel(_params: CamParams, _lang = 'zh'): Promise<Blob> {
    // Excel 生成在前端完成
    return new Blob();
  }

  /**
   * Export GIF animation (placeholder - actual logic in simulation.ts)
   * @param _params - Cam design parameters (unused)
   * @param _lang - Language code (unused)
   * @param _onProgress - Progress callback (unused)
   * @returns Empty Blob placeholder
   */
  async exportGif(
    _params: CamParams,
    _lang = 'zh',
    _onProgress?: (progress: number) => void
  ): Promise<Blob> {
    // GIF 生成在前端完成（使用 Web Worker）
    return new Blob();
  }
}