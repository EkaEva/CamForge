import { isTauriEnv } from '../../utils/tauri';
import { isMobilePlatform } from '../../utils/platform';
import { generateGifAsync, terminateGifWorker } from '../../services/gifEncoder';
import { generateDXF as generateDXFCore, generateCSV as generateCSVCore, generateExcel as generateExcelCore } from '../../exporters';
import { getDownloadDir } from '../settings';
import { language } from '../../i18n';
import { simulationData, params, displayOptions } from './core';

// Re-export from split modules
export { generateHighResPNG, generateTIFF, generateRealTIFF } from './exportFormats';
export { generateSVG } from './exportSVG';

const isTauri = isTauriEnv();

export function generateDXF(includeActual: boolean): string {
  const data = simulationData();
  if (!data) return '';
  return generateDXFCore(data, includeActual);
}

export function generateCSV(lang: string): string {
  const data = simulationData();
  const p = params();
  if (!data) return '';
  return generateCSVCore(data, p, lang);
}

export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function saveFile(
  content: string | Blob,
  filename: string,
  mimeType: string,
  options?: {
    showDialog?: boolean;
    saveDir?: string;
  }
): Promise<{ success: boolean; path?: string; error?: string }> {
  const showDialog = options?.showDialog ?? false;
  const finalSaveDir = options?.saveDir || getDownloadDir();

  if (isTauri) {
    try {
      const { writeFile, mkdir } = await import('@tauri-apps/plugin-fs');
      const { join, dirname, downloadDir } = await import('@tauri-apps/api/path');

      let filePath: string;
      if (finalSaveDir) {
        filePath = await join(finalSaveDir, filename);
      } else if (showDialog && !isMobilePlatform()) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const ext = filename.split('.').pop() || '*';
        const filterName = ext.toUpperCase();
        const selectedPath = await save({
          defaultPath: filename,
          filters: [{ name: filterName, extensions: [ext] }],
        });
        if (!selectedPath) {
          return { success: false, error: 'Cancelled' };
        }
        filePath = selectedPath;
      } else {
        const dlDir = await downloadDir();
        filePath = await join(dlDir, filename);
      }

      let data: Uint8Array;
      if (content instanceof Blob) {
        const buffer = await content.arrayBuffer();
        data = new Uint8Array(buffer);
      } else {
        const encoder = new TextEncoder();
        data = encoder.encode(content);
      }

      const dir = await dirname(filePath);
      try {
        await mkdir(dir, { recursive: true });
      } catch {
        // Directory may already exist
      }

      await writeFile(filePath, data);

      return { success: true, path: filePath };
    } catch (e) {
      console.error('Save file error:', e);
      return { success: false, error: String(e) };
    }
  } else {
    downloadFile(content, filename, mimeType);
    return { success: true };
  }
}

export function getCurrentLang(): string {
  return language();
}

export function getExportFilename(type: string, lang: string): string {
  const names: Record<string, Record<string, string>> = {
    motion: { zh: '推杆运动线图', en: 'motion_curves' },
    curvature: { zh: '曲率半径曲线', en: 'curvature_radius' },
    pressure: { zh: '压力角曲线', en: 'pressure_angle' },
    profile: { zh: '凸轮廓形', en: 'cam_profile' },
    animation: { zh: '凸轮动画', en: 'cam_animation' },
    csv: { zh: '凸轮数据', en: 'cam_data' },
    excel: { zh: '凸轮数据', en: 'cam_data' },
    svg: { zh: '凸轮综合图', en: 'cam_all' },
    dxf: { zh: '凸轮廓形', en: 'cam_profile' },
    preset: { zh: '凸轮预设', en: 'cam_preset' },
  };
  return names[type]?.[lang] || names[type]?.zh || type;
}

export async function generateGIF(
  lang: string,
  onProgress?: (progress: number) => void,
  customDpi?: number,
  maxFrames?: number
): Promise<Blob> {
  const data = simulationData();
  const p = params();
  const disp = displayOptions();

  if (!data) return new Blob();

  const dpi = customDpi || 150;

  try {
    return await generateGifAsync(
      data,
      p,
      disp,
      {
        dpi,
        width: 5 * dpi,
        height: 5 * dpi,
        lang,
        maxFrames: maxFrames || 360,
      },
      onProgress
    );
  } catch (error) {
    console.error('GIF generation failed:', error);
    return new Blob();
  }
}

export { terminateGifWorker };

export function generateExcel(lang: string): Blob {
  const data = simulationData();
  const p = params();
  if (!data) return new Blob();
  return generateExcelCore(data, p, lang);
}
