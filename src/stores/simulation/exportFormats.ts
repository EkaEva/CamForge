import { drawMotionCurves, drawPressureAngleChart, drawCurvatureChart, drawCamProfileChart, MAX_DPI } from '../../utils/chartDrawing';
import type { ChartDrawOptions } from '../../utils/chartDrawing';
import { generateTIFFBlob } from '../../exporters';
import { getDefaultDpi } from '../settings';
import { t } from '../../i18n';
import { simulationData, params } from './core';

export function createChartCanvas(
  type: 'motion' | 'curvature' | 'pressure' | 'profile',
  dpi: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; width: number; height: number } {
  const width = type === 'profile' ? 6 * dpi : 8 * dpi;
  const height = type === 'profile' ? 6 * dpi : 5 * dpi;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  return { canvas, ctx, width, height };
}

export function drawChartToCanvas(
  ctx: CanvasRenderingContext2D,
  type: 'motion' | 'curvature' | 'pressure' | 'profile',
  lang: string,
  dpi: number,
  width: number,
  height: number
): void {
  const data = simulationData();
  const p = params();
  if (!data) return;

  const options: ChartDrawOptions = {
    width,
    height,
    isDark: false,
    lang,
    dpi,
    translations: t()
  };

  switch (type) {
    case 'motion':
      drawMotionCurves(ctx, data, options);
      break;
    case 'pressure':
      drawPressureAngleChart(ctx, data, p, options);
      break;
    case 'curvature':
      drawCurvatureChart(ctx, data, p, options);
      break;
    case 'profile':
      drawCamProfileChart(ctx, data, p, options);
      break;
  }
}

export function generateHighResPNG(
  type: 'motion' | 'curvature' | 'pressure' | 'profile',
  lang: string,
  customDpi?: number
): Promise<Blob> {
  return new Promise((resolve) => {
    const data = simulationData();
    if (!data) {
      resolve(new Blob());
      return;
    }

    const dpi = Math.min(customDpi || getDefaultDpi(), MAX_DPI);
    const { canvas, ctx, width, height } = createChartCanvas(type, dpi);
    drawChartToCanvas(ctx, type, lang, dpi, width, height);

    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png');
  });
}

export const generateTIFF = generateHighResPNG;

export async function generateRealTIFF(
  type: 'motion' | 'curvature' | 'pressure' | 'profile',
  lang: string,
  customDpi?: number
): Promise<Blob> {
  const data = simulationData();
  if (!data) {
    return new Blob();
  }

  const dpi = Math.min(customDpi || getDefaultDpi(), MAX_DPI);
  const { canvas, ctx, width, height } = createChartCanvas(type, dpi);
  drawChartToCanvas(ctx, type, lang, dpi, width, height);

  return generateTIFFBlob(canvas, dpi);
}