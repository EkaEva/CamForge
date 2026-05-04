/**
 * HTTP API 实现
 *
 * 通过 HTTP REST API 调用后端服务器
 */

import type { CamParams, SimulationData } from '../types';
import type { CamApi } from './index';

/**
 * HTTP API 配置
 *
 * 生产环境使用空字符串（相对路径），浏览器自动解析为页面同源 URL，
 * 从而满足 CSP `connect-src 'self'` 限制。
 * 本地开发通过 .env 设置 VITE_API_URL=http://localhost:3000。
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/** API Key for server authentication (optional) / 服务器认证 API Key（可选） */
const API_KEY = import.meta.env.VITE_API_KEY || '';

/** Build headers with Content-Type and optional API Key / 构建 headers（含 Content-Type 和可选 API Key） */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }
  return headers;
}

/**
 * HTTP REST API implementation of CamApi
 */
export class HttpApi implements CamApi {
  private baseUrl: string;

  /**
   * @param baseUrl - Optional base URL override; defaults to VITE_API_URL or ''
   */
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  /**
   * Run cam simulation via HTTP API
   * @param params - Cam design parameters
   * @returns Simulation result data
   * @throws Error on HTTP failure or non-OK response
   */
  async runSimulation(params: CamParams): Promise<SimulationData> {
    const response = await fetch(`${this.baseUrl}/api/simulate`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ params }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as SimulationData;
  }

  /**
   * Export DXF file via HTTP API
   * @param params - Cam design parameters
   * @param includeActual - Whether to include actual profile
   * @returns DXF file as Blob
   * @throws Error on HTTP failure or non-OK response
   */
  async exportDxf(params: CamParams, includeActual = true): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/export/dxf`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ params, include_actual: includeActual }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Export CSV file via HTTP API
   * @param params - Cam design parameters
   * @param lang - Language code
   * @returns CSV content as string
   * @throws Error on HTTP failure or non-OK response
   */
  async exportCsv(params: CamParams, lang = 'zh'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/export/csv`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ params, lang }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.text();
  }

  /**
   * Export SVG file (not supported via HTTP)
   * @param _params - Cam design parameters (unused)
   * @param _lang - Language code (unused)
   * @returns Never resolves normally
   * @throws Error always - SVG requires frontend rendering
   */
  async exportSvg(_params: CamParams, _lang = 'zh'): Promise<string> {
    // SVG 需要前端 Canvas 渲染，无法在纯后端生成
    throw new Error('SVG export requires frontend rendering. Use the desktop app.');
  }

  /**
   * Export Excel file (not supported via HTTP)
   * @param _params - Cam design parameters (unused)
   * @param _lang - Language code (unused)
   * @returns Never resolves normally
   * @throws Error always - Excel requires frontend library
   */
  async exportExcel(_params: CamParams, _lang = 'zh'): Promise<Blob> {
    // Excel 生成需要 xlsx 库，在前端完成
    throw new Error('Excel export requires frontend library. Use the desktop app.');
  }

  /**
   * Export GIF animation (not supported via HTTP)
   * @param _params - Cam design parameters (unused)
   * @param _lang - Language code (unused)
   * @param _onProgress - Progress callback (unused)
   * @returns Never resolves normally
   * @throws Error always - GIF requires frontend rendering
   */
  async exportGif(
    _params: CamParams,
    _lang = 'zh',
    _onProgress?: (progress: number) => void
  ): Promise<Blob> {
    // GIF 需要前端 Canvas 渲染
    throw new Error('GIF export requires frontend rendering. Use the desktop app.');
  }

  /**
   * Perform a health check on the HTTP API server
   * @returns Server status and version
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}