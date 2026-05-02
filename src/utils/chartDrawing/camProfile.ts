// 绘制凸轮廓形图

import type { SimulationData, CamParams } from '../../types';
import { CAM_PROFILE_COLORS, CHART_COLORS } from '../../constants/chartColors';
import {
  type ChartDrawOptions,
  DEFAULT_DPI,
  validateChartData,
  normalizeChartOptions,
  getScaleFactor,
  tr,
} from './common';

export function drawCamProfileChart(
  ctx: CanvasRenderingContext2D,
  data: SimulationData,
  params: CamParams,
  options: ChartDrawOptions
): void {
  // 输入验证
  if (!validateChartData(data)) {
    console.warn('Invalid simulation data for cam profile chart');
    return;
  }

  const normalizedOptions = normalizeChartOptions(options);
  const { width, height, isDark, lang, dpi = DEFAULT_DPI, translations } = normalizedOptions;
  const { x, y, x_actual, y_actual, r_max } = data;

  // DPI 缩放因子
  const dpiScale = getScaleFactor(dpi);

  // 背景
  ctx.fillStyle = isDark ? CHART_COLORS.bgDark : CHART_COLORS.bgLight;
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const drawScale = Math.min(width, height) / (2 * r_max * 1.3);

  // 基圆
  ctx.strokeStyle = isDark ? '#666' : CHART_COLORS.phaseBoundLight;
  ctx.lineWidth = Math.round(1 * dpiScale);
  ctx.setLineDash([Math.round(5 * dpiScale), Math.round(5 * dpiScale)]);
  ctx.beginPath();
  ctx.arc(centerX, centerY, params.r_0 * drawScale, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);

  // 偏距圆
  if (Math.abs(params.e) > 0.01) {
    ctx.strokeStyle = isDark ? '#555' : '#BBB';
    ctx.lineWidth = Math.round(1 * dpiScale);
    ctx.setLineDash([Math.round(3 * dpiScale), Math.round(3 * dpiScale)]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.abs(params.e) * drawScale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 理论廓形
  ctx.strokeStyle = CAM_PROFILE_COLORS.theoryProfile;
  ctx.lineWidth = Math.round(2 * dpiScale);
  ctx.beginPath();
  let profileStarted = false;
  for (let i = 0; i < x.length; i++) {
    if (!Number.isFinite(x[i]) || !Number.isFinite(y[i])) continue;
    const px = centerX + x[i] * drawScale;
    const py = centerY - y[i] * drawScale;
    if (!profileStarted) { ctx.moveTo(px, py); profileStarted = true; }
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // 实际廓形（如果有滚子）
  if (params.r_r > 0 && x_actual.length > 0) {
    ctx.strokeStyle = CAM_PROFILE_COLORS.actualProfile;
    ctx.lineWidth = Math.round(2 * dpiScale);
    ctx.beginPath();
    profileStarted = false;
    for (let i = 0; i < x_actual.length; i++) {
      if (!Number.isFinite(x_actual[i]) || !Number.isFinite(y_actual[i])) continue;
      const px = centerX + x_actual[i] * drawScale;
      const py = centerY - y_actual[i] * drawScale;
      if (!profileStarted) { ctx.moveTo(px, py); profileStarted = true; }
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 图例
  const legendX = Math.round(20 * dpiScale);
  let legendY = Math.round(30 * dpiScale);
  ctx.font = `${Math.round(12 * dpiScale)}px -apple-system, sans-serif`;

  // 理论廓形
  ctx.strokeStyle = CAM_PROFILE_COLORS.theoryProfile;
  ctx.lineWidth = Math.round(2 * dpiScale);
  ctx.beginPath();
  ctx.moveTo(legendX, legendY);
  ctx.lineTo(legendX + Math.round(30 * dpiScale), legendY);
  ctx.stroke();
  ctx.fillStyle = isDark ? '#FFF' : '#333';
  ctx.textAlign = 'left';
  ctx.fillText(tr(lang, 'theoryProfile', translations), legendX + Math.round(40 * dpiScale), legendY + Math.round(4 * dpiScale));

  // 实际廓形
  if (params.r_r > 0) {
    legendY += Math.round(20 * dpiScale);
    ctx.strokeStyle = CAM_PROFILE_COLORS.actualProfile;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + Math.round(30 * dpiScale), legendY);
    ctx.stroke();
    ctx.fillText(tr(lang, 'actualProfile', translations), legendX + Math.round(40 * dpiScale), legendY + Math.round(4 * dpiScale));
  }

  // 基圆
  legendY += Math.round(20 * dpiScale);
  ctx.strokeStyle = isDark ? '#666' : CHART_COLORS.phaseBoundLight;
  ctx.setLineDash([Math.round(5 * dpiScale), Math.round(5 * dpiScale)]);
  ctx.beginPath();
  ctx.moveTo(legendX, legendY);
  ctx.lineTo(legendX + Math.round(30 * dpiScale), legendY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(tr(lang, 'baseCircle', translations), legendX + Math.round(40 * dpiScale), legendY + Math.round(4 * dpiScale));

  // 标题
  ctx.fillStyle = isDark ? '#FFF' : '#333';
  ctx.font = `${Math.round(14 * dpiScale)}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(tr(lang, 'camProfile', translations), width / 2, Math.round(25 * dpiScale));
}