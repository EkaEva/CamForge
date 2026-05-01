// 绘制压力角图

import type { SimulationData, CamParams } from '../../types';
import { DATA_RANGE_MARGIN } from '../../constants/numeric';
import { PRESSURE_ANGLE_COLORS, CHART_COLORS } from '../../constants/chartColors';
import {
  type ChartDrawOptions,
  DEFAULT_DPI,
  validateChartData,
  normalizeChartOptions,
  getScaleFactor,
  tr,
} from './common';

export function drawPressureAngleChart(
  ctx: CanvasRenderingContext2D,
  data: SimulationData,
  params: CamParams,
  options: ChartDrawOptions
): void {
  // 输入验证
  if (!validateChartData(data)) {
    console.warn('Invalid simulation data for pressure angle chart');
    return;
  }

  const normalizedOptions = normalizeChartOptions(options);
  const { width, height, isDark, lang, dpi = DEFAULT_DPI, translations } = normalizedOptions;
  const { delta_deg, alpha_all, phase_bounds } = data;

  // DPI 缩放因子
  const scale = getScaleFactor(dpi);

  // 根据 DPI 缩放 padding（增加顶部空间给标题）
  const padding = {
    top: Math.round(55 * scale),
    right: Math.round(70 * scale),
    bottom: Math.round(55 * scale),
    left: Math.round(70 * scale)
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 背景
  ctx.fillStyle = isDark ? CHART_COLORS.bgDark : CHART_COLORS.bgLight;
  ctx.fillRect(0, 0, width, height);

  // 标题
  ctx.fillStyle = isDark ? '#FFF' : '#333';
  ctx.font = `bold ${Math.round(14 * scale)}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(tr(lang, 'pressureTitle', translations), width / 2, Math.round(25 * scale));

  // 网格线（点线）
  ctx.strokeStyle = isDark ? CHART_COLORS.gridDark : CHART_COLORS.gridLight;
  ctx.lineWidth = Math.round(0.5 * scale);
  ctx.setLineDash([Math.round(2 * scale), Math.round(2 * scale)]);

  // 垂直网格线（每30°）
  for (let x = 0; x <= 360; x += 30) {
    const px = padding.left + (x / 360) * chartWidth;
    ctx.beginPath();
    ctx.moveTo(px, padding.top);
    ctx.lineTo(px, height - padding.bottom);
    ctx.stroke();
  }

  // 水平网格线（更密集）
  for (let i = 0; i <= 10; i++) {
    const py = padding.top + (i / 10) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, py);
    ctx.lineTo(width - padding.right, py);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 相位分界线
  ctx.strokeStyle = isDark ? CHART_COLORS.phaseBoundDark : CHART_COLORS.phaseBoundLight;
  ctx.lineWidth = Math.round(0.8 * scale);
  ctx.setLineDash([Math.round(4 * scale), Math.round(4 * scale)]);
  for (const bound of phase_bounds.slice(1, -1)) {
    const px = padding.left + (bound / 360) * chartWidth;
    ctx.beginPath();
    ctx.moveTo(px, padding.top);
    ctx.lineTo(px, height - padding.bottom);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 压力角范围
  const threshold = params.alpha_threshold;
  const alphaMax = Math.max(...alpha_all.map(Math.abs), threshold) * DATA_RANGE_MARGIN;

  // 压力角阈值线（橙色虚线）
  ctx.strokeStyle = PRESSURE_ANGLE_COLORS.threshold;
  ctx.lineWidth = Math.round(1 * scale);
  ctx.setLineDash([Math.round(4 * scale), Math.round(4 * scale)]);
  const thresholdY1 = padding.top + (1 - threshold / alphaMax) * chartHeight;
  ctx.beginPath();
  ctx.moveTo(padding.left, thresholdY1);
  ctx.lineTo(width - padding.right, thresholdY1);
  ctx.stroke();
  ctx.setLineDash([]);

  // 压力角曲线（红色实线）
  ctx.strokeStyle = PRESSURE_ANGLE_COLORS.curve;
  ctx.lineWidth = Math.round(1.5 * scale);
  ctx.setLineDash([]);
  ctx.beginPath();
  for (let i = 0; i < alpha_all.length; i++) {
    const px = padding.left + (delta_deg[i] / 360) * chartWidth;
    const py = padding.top + (1 - alpha_all[i] / alphaMax) * chartHeight;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // 标记超限点
  ctx.fillStyle = PRESSURE_ANGLE_COLORS.exceedPoint;
  for (let i = 0; i < alpha_all.length; i++) {
    if (Math.abs(alpha_all[i]) > threshold) {
      const px = padding.left + (delta_deg[i] / 360) * chartWidth;
      const py = padding.top + (1 - alpha_all[i] / alphaMax) * chartHeight;
      ctx.beginPath();
      ctx.arc(px, py, Math.round(2 * scale), 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // 绘制坐标轴边框
  ctx.strokeStyle = isDark ? CHART_COLORS.axisDark : CHART_COLORS.axisLight;
  ctx.lineWidth = Math.round(1 * scale);
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // X轴标签
  ctx.fillStyle = isDark ? CHART_COLORS.textSecondaryLight : CHART_COLORS.textLight;
  ctx.font = `${Math.round(10 * scale)}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(tr(lang, 'angleX', translations), padding.left + chartWidth / 2, height - Math.round(10 * scale));

  ctx.textAlign = 'center';
  for (let x = 0; x <= 360; x += 30) {
    const px = padding.left + (x / 360) * chartWidth;
    ctx.fillText(String(x), px, height - padding.bottom + Math.round(15 * scale));
  }

  // 左侧Y轴 - 压力角α（红色）
  ctx.fillStyle = PRESSURE_ANGLE_COLORS.curve;
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(Math.round(16 * scale), padding.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(tr(lang, 'pressureY', translations), 0, 0);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.font = `${Math.round(9 * scale)}px -apple-system, sans-serif`;
  // α轴刻度（5个）
  for (let i = 0; i <= 4; i++) {
    const val = (alphaMax * (2 - i) / 2);
    const py = padding.top + (i / 4) * chartHeight;
    ctx.fillText(val.toFixed(0), padding.left - Math.round(5 * scale), py + Math.round(3 * scale));
  }

  // 图例（两行）
  const legendX = padding.left + Math.round(10 * scale);
  let legendY = padding.top + Math.round(12 * scale);
  ctx.font = `${Math.round(9 * scale)}px -apple-system, sans-serif`;

  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = Math.round(1.5 * scale);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(legendX, legendY);
  ctx.lineTo(legendX + Math.round(20 * scale), legendY);
  ctx.stroke();
  ctx.fillStyle = isDark ? '#FFF' : '#333';
  ctx.textAlign = 'left';
  ctx.fillText(tr(lang, 'pressureAngle', translations), legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));

  legendY += Math.round(16 * scale);
  ctx.strokeStyle = PRESSURE_ANGLE_COLORS.threshold;
  ctx.setLineDash([Math.round(4 * scale), Math.round(4 * scale)]);
  ctx.beginPath();
  ctx.moveTo(legendX, legendY);
  ctx.lineTo(legendX + Math.round(20 * scale), legendY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(`${tr(lang, 'threshold', translations)} ${threshold}°`, legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));
}