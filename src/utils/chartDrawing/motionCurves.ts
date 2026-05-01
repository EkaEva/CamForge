// 绘制运动曲线图（三Y轴：位移、速度、加速度）

import type { SimulationData } from '../../types';
import { DATA_RANGE_MARGIN } from '../../constants/numeric';
import { MOTION_COLORS, CHART_COLORS } from '../../constants/chartColors';
import { arrayMaxAbs } from '../../utils/array';
import {
  type ChartDrawOptions,
  DEFAULT_DPI,
  validateChartData,
  normalizeChartOptions,
  getScaleFactor,
  tr,
} from './common';

export function drawMotionCurves(
  ctx: CanvasRenderingContext2D,
  data: SimulationData,
  options: ChartDrawOptions
): void {
  // 输入验证
  if (!validateChartData(data)) {
    console.warn('Invalid simulation data for motion curves');
    return;
  }

  const normalizedOptions = normalizeChartOptions(options);
  const { width, height, isDark, lang, dpi = DEFAULT_DPI, translations } = normalizedOptions;
  const { delta_deg, s, v, a, phase_bounds, h } = data;

  // DPI 缩放因子
  const scale = getScaleFactor(dpi);

  // 根据 DPI 缩放 padding（增加顶部空间给标题）
  const padding = {
    top: Math.round(55 * scale),
    right: Math.round(155 * scale),
    bottom: Math.round(55 * scale),
    left: Math.round(70 * scale)
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 背景
  ctx.fillStyle = isDark ? CHART_COLORS.bgDark : CHART_COLORS.bgLight;
  ctx.fillRect(0, 0, width, height);

  // 标题
  ctx.fillStyle = isDark ? CHART_COLORS.textDark : CHART_COLORS.textLight;
  ctx.font = `bold ${Math.round(14 * scale)}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(tr(lang, 'motionTitle', translations), width / 2, Math.round(25 * scale));

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

  // 相位分界线（灰色虚线）
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

  // 计算各轴范围
  const sMax = h * DATA_RANGE_MARGIN;
  const vMax = arrayMaxAbs(v) * DATA_RANGE_MARGIN || 1;
  const aMax = arrayMaxAbs(a) * DATA_RANGE_MARGIN || 1;

  // 绘制曲线的通用函数
  const drawCurve = (
    yData: number[],
    color: string,
    yMin: number,
    yMax: number,
    lineStyle: 'solid' | 'dashed' | 'dashdot' = 'solid'
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.round(1.5 * scale);

    if (lineStyle === 'dashed') {
      ctx.setLineDash([Math.round(6 * scale), Math.round(4 * scale)]);
    } else if (lineStyle === 'dashdot') {
      ctx.setLineDash([Math.round(8 * scale), Math.round(4 * scale), Math.round(2 * scale), Math.round(4 * scale)]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    for (let i = 0; i < yData.length; i++) {
      const yVal = yData[i];
      if (!Number.isFinite(yVal)) continue;
      const px = padding.left + (delta_deg[i] / 360) * chartWidth;
      const py = padding.top + (1 - (yVal - yMin) / (yMax - yMin)) * chartHeight;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // 绘制三条曲线
  drawCurve(s, MOTION_COLORS.displacement, 0, sMax, 'solid');           // 位移：红色实线
  drawCurve(v, MOTION_COLORS.velocity, -vMax, vMax, 'dashed');      // 速度：蓝色虚线
  drawCurve(a, MOTION_COLORS.acceleration, -aMax, aMax, 'dashdot');     // 加速度：绿色点划线

  // 绘制坐标轴边框
  ctx.strokeStyle = isDark ? CHART_COLORS.axisDark : CHART_COLORS.axisLight;
  ctx.lineWidth = Math.round(1 * scale);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // 右侧Y轴1 - 速度v（蓝色）
  const vAxisX = width - padding.right;
  ctx.strokeStyle = MOTION_COLORS.velocity;
  ctx.lineWidth = Math.round(1 * scale);
  ctx.beginPath();
  ctx.moveTo(vAxisX, padding.top);
  ctx.lineTo(vAxisX, height - padding.bottom);
  ctx.stroke();

  // 右侧Y轴2 - 加速度a（绿色，向外偏移）
  const aAxisX = width - padding.right + Math.round(70 * scale);
  ctx.strokeStyle = MOTION_COLORS.acceleration;
  ctx.lineWidth = Math.round(1 * scale);
  ctx.beginPath();
  ctx.moveTo(aAxisX, padding.top);
  ctx.lineTo(aAxisX, height - padding.bottom);
  ctx.stroke();

  // X轴标签和刻度
  ctx.fillStyle = isDark ? CHART_COLORS.textSecondaryLight : CHART_COLORS.textLight;
  ctx.font = `${Math.round(10 * scale)}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(tr(lang, 'angleX', translations), padding.left + chartWidth / 2, height - Math.round(10 * scale));

  ctx.textAlign = 'center';
  for (let x = 0; x <= 360; x += 30) {
    const px = padding.left + (x / 360) * chartWidth;
    ctx.fillText(String(x), px, height - padding.bottom + Math.round(15 * scale));
  }

  // 左侧Y轴 - 位移s（红色）
  ctx.fillStyle = MOTION_COLORS.displacement;
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(Math.round(16 * scale), padding.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(tr(lang, 'displacementY', translations), 0, 0);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.font = `${Math.round(9 * scale)}px -apple-system, sans-serif`;
  // s轴刻度（5个）
  for (let i = 0; i <= 4; i++) {
    const val = (sMax * i / 4).toFixed(1);
    const py = padding.top + (1 - i / 4) * chartHeight;
    ctx.fillText(val, padding.left - Math.round(5 * scale), py + Math.round(3 * scale));
  }

  // 右侧Y轴1 - 速度v（蓝色）
  ctx.fillStyle = MOTION_COLORS.velocity;
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(10 * scale)}px -apple-system, sans-serif`;
  ctx.save();
  ctx.translate(vAxisX + Math.round(28 * scale), padding.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(tr(lang, 'velocityY', translations), 0, 0);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.font = `${Math.round(9 * scale)}px -apple-system, sans-serif`;
  // v轴刻度（5个）
  for (let i = 0; i <= 4; i++) {
    const val = (vMax * (2 - i) / 2);
    const py = padding.top + (i / 4) * chartHeight;
    ctx.fillText(val.toFixed(1), vAxisX + Math.round(4 * scale), py + Math.round(3 * scale));
  }

  // 右侧Y轴2 - 加速度a（绿色）
  ctx.fillStyle = MOTION_COLORS.acceleration;
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(10 * scale)}px -apple-system, sans-serif`;
  ctx.save();
  ctx.translate(aAxisX + Math.round(28 * scale), padding.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(tr(lang, 'accelerationY', translations), 0, 0);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.font = `${Math.round(9 * scale)}px -apple-system, sans-serif`;
  // a轴刻度（5个）
  for (let i = 0; i <= 4; i++) {
    const val = (aMax * (2 - i) / 2);
    const py = padding.top + (i / 4) * chartHeight;
    ctx.fillText(val.toFixed(1), aAxisX + Math.round(4 * scale), py + Math.round(3 * scale));
  }

  // 图例（三行，右上角）
  const legendX = width - padding.right - Math.round(100 * scale);
  let legendY = padding.top + Math.round(12 * scale);
  ctx.font = `${Math.round(9 * scale)}px -apple-system, sans-serif`;

  // 位移图例
  ctx.strokeStyle = MOTION_COLORS.displacement;
  ctx.lineWidth = Math.round(1.5 * scale);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(legendX, legendY);
  ctx.lineTo(legendX + Math.round(20 * scale), legendY);
  ctx.stroke();
  ctx.fillStyle = isDark ? CHART_COLORS.textDark : CHART_COLORS.textLight;
  ctx.textAlign = 'left';
  ctx.fillText(tr(lang, 'displacement', translations), legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));

  // 速度图例
  legendY += Math.round(16 * scale);
  ctx.strokeStyle = MOTION_COLORS.velocity;
  ctx.setLineDash([Math.round(6 * scale), Math.round(4 * scale)]);
  ctx.beginPath();
  ctx.moveTo(legendX, legendY);
  ctx.lineTo(legendX + Math.round(20 * scale), legendY);
  ctx.stroke();
  ctx.fillText(tr(lang, 'velocity', translations), legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));

  // 加速度图例
  legendY += Math.round(16 * scale);
  ctx.strokeStyle = MOTION_COLORS.acceleration;
  ctx.setLineDash([Math.round(8 * scale), Math.round(4 * scale), Math.round(2 * scale), Math.round(4 * scale)]);
  ctx.beginPath();
  ctx.moveTo(legendX, legendY);
  ctx.lineTo(legendX + Math.round(20 * scale), legendY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(tr(lang, 'acceleration', translations), legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));
}