// 绘制曲率半径图

import type { SimulationData, CamParams } from '../../types';
import { PERCENTILE_CLIP_LOW, PERCENTILE_CLIP_HIGH, PERCENTILE_CLIP_MID_LOW, PERCENTILE_CLIP_MID_HIGH } from '../../constants/numeric';
import { CURVATURE_COLORS, CHART_COLORS } from '../../constants/chartColors';
import {
  type ChartDrawOptions,
  DEFAULT_DPI,
  validateChartData,
  normalizeChartOptions,
  getScaleFactor,
  tr,
} from './common';

export function drawCurvatureChart(
  ctx: CanvasRenderingContext2D,
  data: SimulationData,
  params: CamParams,
  options: ChartDrawOptions
): void {
  // 输入验证
  if (!validateChartData(data)) {
    console.warn('Invalid simulation data for curvature chart');
    return;
  }

  const normalizedOptions = normalizeChartOptions(options);
  const { width, height, isDark, lang, dpi = DEFAULT_DPI, translations } = normalizedOptions;
  const { delta_deg, rho, rho_actual, phase_bounds, min_rho, min_rho_idx, min_rho_actual, min_rho_actual_idx } = data;

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
  ctx.fillText(tr(lang, 'curvatureTitle', translations), width / 2, Math.round(25 * scale));

  // 网格线（点线）
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
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

  // 过滤有限值计算范围（合并理论轮廓和实际轮廓）
  const rhoFinite = rho.filter(r => isFinite(r) && !isNaN(r));
  const rhoActualFinite = rho_actual ? rho_actual.filter(r => isFinite(r) && !isNaN(r)) : [];
  const allRhoFinite = [...rhoFinite, ...rhoActualFinite];

  if (allRhoFinite.length === 0) {
    ctx.fillStyle = isDark ? CHART_COLORS.textDark : CHART_COLORS.textLight;
    ctx.font = `${Math.round(12 * scale)}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(tr(lang, 'noData', translations), width / 2, height / 2);
    return;
  }

  // 使用百分位数来避免极端值影响显示
  const rhoSorted = [...allRhoFinite].sort((a, b) => a - b);
  const p5Idx = Math.floor(rhoSorted.length * PERCENTILE_CLIP_LOW);
  const p95Idx = Math.floor(rhoSorted.length * PERCENTILE_CLIP_HIGH);
  const p5 = rhoSorted[p5Idx];
  const p95 = rhoSorted[p95Idx];

  let rhoMin: number, rhoMax: number;
  const range = p95 - p5;

  const p10 = rhoSorted[Math.floor(rhoSorted.length * PERCENTILE_CLIP_MID_LOW)];
  const p90 = rhoSorted[Math.floor(rhoSorted.length * PERCENTILE_CLIP_MID_HIGH)];
  if (range > 10 * (p90 - p10 + 1)) {
    rhoMin = p5 - range * 0.1;
    rhoMax = p95 + range * 0.1;
  } else {
    rhoMin = Math.min(...allRhoFinite) * 0.9;
    rhoMax = Math.max(...allRhoFinite) * 1.1;
    if (rhoMin > 0) rhoMin = Math.min(...allRhoFinite) * 0.9;
    else rhoMin = Math.min(...allRhoFinite) - 1;
    if (rhoMax < 0) rhoMax = Math.max(...allRhoFinite) + 1;
  }

  const yRange = rhoMax - rhoMin;

  // 滚子半径阈值线（如果存在滚子）
  const r_r = params.r_r;
  if (r_r > 0) {
    ctx.strokeStyle = CURVATURE_COLORS.threshold;
    ctx.lineWidth = Math.round(1 * scale);
    ctx.setLineDash([Math.round(4 * scale), Math.round(4 * scale)]);
    const thresholdRho = r_r;
    const thresholdY = padding.top + (1 - (thresholdRho - rhoMin) / yRange) * chartHeight;
    if (thresholdY >= padding.top && thresholdY <= height - padding.bottom) {
      ctx.beginPath();
      ctx.moveTo(padding.left, thresholdY);
      ctx.lineTo(width - padding.right, thresholdY);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // 绘制理论轮廓曲率半径曲线（红色实线）
  ctx.strokeStyle = CURVATURE_COLORS.theoryRho;
  ctx.lineWidth = Math.round(1.5 * scale);
  ctx.setLineDash([]);
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < rho.length; i++) {
    if (!isFinite(rho[i]) || isNaN(rho[i])) continue;
    const px = padding.left + (delta_deg[i] / 360) * chartWidth;
    const py = padding.top + (1 - (rho[i] - rhoMin) / yRange) * chartHeight;
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  // 绘制实际轮廓曲率半径曲线（蓝色虚线，仅滚子从动件）
  if (r_r > 0 && rho_actual) {
    ctx.strokeStyle = CURVATURE_COLORS.actualRho;
    ctx.lineWidth = Math.round(1.5 * scale);
    ctx.setLineDash([Math.round(4 * scale), Math.round(2 * scale)]);
    ctx.beginPath();
    started = false;
    for (let i = 0; i < rho_actual.length; i++) {
      if (!isFinite(rho_actual[i]) || isNaN(rho_actual[i])) continue;
      const px = padding.left + (delta_deg[i] / 360) * chartWidth;
      const py = padding.top + (1 - (rho_actual[i] - rhoMin) / yRange) * chartHeight;
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 标记理论轮廓最小曲率半径点
  if (min_rho !== null && min_rho_idx >= 0 && min_rho_idx < rho.length) {
    const idx = min_rho_idx;
    if (isFinite(rho[idx])) {
      const px = padding.left + (delta_deg[idx] / 360) * chartWidth;
      const py = padding.top + (1 - (rho[idx] - rhoMin) / yRange) * chartHeight;
      ctx.fillStyle = CURVATURE_COLORS.minRhoPoint;
      ctx.beginPath();
      ctx.arc(px, py, Math.round(4 * scale), 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // 标记实际轮廓最小曲率半径点（仅滚子从动件）
  if (r_r > 0 && min_rho_actual !== null && min_rho_actual_idx >= 0 && min_rho_actual_idx < rho_actual.length) {
    const idx = min_rho_actual_idx;
    if (isFinite(rho_actual[idx])) {
      const px = padding.left + (delta_deg[idx] / 360) * chartWidth;
      const py = padding.top + (1 - (rho_actual[idx] - rhoMin) / yRange) * chartHeight;
      ctx.fillStyle = CURVATURE_COLORS.minRhoActualPoint;
      ctx.beginPath();
      ctx.arc(px, py, Math.round(4 * scale), 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // 绘制坐标轴边框
  ctx.strokeStyle = isDark ? '#555' : '#333';
  ctx.lineWidth = Math.round(1 * scale);
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // X轴标签
  ctx.fillStyle = isDark ? '#CCC' : '#333';
  ctx.font = `${Math.round(10 * scale)}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(tr(lang, 'angleX', translations), padding.left + chartWidth / 2, height - Math.round(10 * scale));

  ctx.textAlign = 'center';
  for (let x = 0; x <= 360; x += 30) {
    const px = padding.left + (x / 360) * chartWidth;
    ctx.fillText(String(x), px, height - padding.bottom + Math.round(15 * scale));
  }

  // 左侧Y轴 - 曲率半径ρ
  ctx.fillStyle = CURVATURE_COLORS.theoryRho;
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(Math.round(16 * scale), padding.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(tr(lang, 'curvatureY', translations), 0, 0);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.font = `${Math.round(9 * scale)}px -apple-system, sans-serif`;
  // ρ轴刻度（5个）
  for (let i = 0; i <= 4; i++) {
    const val = rhoMin + (rhoMax - rhoMin) * (1 - i / 4);
    const py = padding.top + (i / 4) * chartHeight;
    ctx.fillText(val.toFixed(1), padding.left - Math.round(5 * scale), py + Math.round(3 * scale));
  }

  // 图例
  const legendX = padding.left + Math.round(10 * scale);
  let legendY = padding.top + Math.round(12 * scale);
  ctx.font = `${Math.round(9 * scale)}px -apple-system, sans-serif`;

  // 理论轮廓曲率半径
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = Math.round(1.5 * scale);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(legendX, legendY);
  ctx.lineTo(legendX + Math.round(20 * scale), legendY);
  ctx.stroke();
  ctx.fillStyle = isDark ? '#FFF' : '#333';
  ctx.textAlign = 'left';
  ctx.fillText(tr(lang, 'theoryRho', translations), legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));

  // 实际轮廓曲率半径（仅滚子从动件）
  if (r_r > 0) {
    legendY += Math.round(14 * scale);
    ctx.strokeStyle = CURVATURE_COLORS.actualRho;
    ctx.lineWidth = Math.round(1.5 * scale);
    ctx.setLineDash([Math.round(4 * scale), Math.round(2 * scale)]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + Math.round(20 * scale), legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = isDark ? '#FFF' : '#333';
    ctx.fillText(tr(lang, 'actualRho', translations), legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));
  }

  // 显示理论轮廓最小曲率半径值
  if (min_rho !== null) {
    legendY += Math.round(16 * scale);
    ctx.fillStyle = CURVATURE_COLORS.minRhoPoint;
    ctx.beginPath();
    ctx.arc(legendX + Math.round(10 * scale), legendY, Math.round(4 * scale), 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = isDark ? CHART_COLORS.textDark : CHART_COLORS.textLight;
    // ρ_min 中 min 为下标
    const baseFontSize = Math.round(11 * scale);
    const subFontSize = Math.round(8 * scale);
    ctx.font = `${baseFontSize}px sans-serif`;
    ctx.fillText('ρ', legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));
    const rhoWidth = ctx.measureText('ρ').width;
    ctx.font = `${subFontSize}px sans-serif`;
    ctx.fillText('min', legendX + Math.round(25 * scale) + rhoWidth, legendY + Math.round(6 * scale));
    ctx.font = `${baseFontSize}px sans-serif`;
    const minWidth = ctx.measureText('min').width;
    ctx.fillText(` = ${min_rho.toFixed(2)} mm`, legendX + Math.round(25 * scale) + rhoWidth + minWidth, legendY + Math.round(4 * scale));
  }

  // 显示实际轮廓最小曲率半径值（仅滚子从动件）
  if (r_r > 0 && min_rho_actual !== null) {
    legendY += Math.round(16 * scale);
    ctx.fillStyle = CURVATURE_COLORS.minRhoActualPoint;
    ctx.beginPath();
    ctx.arc(legendX + Math.round(10 * scale), legendY, Math.round(4 * scale), 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = isDark ? CHART_COLORS.textDark : CHART_COLORS.textLight;
    const baseFontSize = Math.round(11 * scale);
    const subFontSize = Math.round(8 * scale);
    ctx.font = `${baseFontSize}px sans-serif`;
    ctx.fillText('ρ', legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));
    const rhoWidth = ctx.measureText('ρ').width;
    ctx.font = `${subFontSize}px sans-serif`;
    ctx.fillText('a,min', legendX + Math.round(25 * scale) + rhoWidth, legendY + Math.round(6 * scale));
    ctx.font = `${baseFontSize}px sans-serif`;
    const minWidth = ctx.measureText('a,min').width;
    ctx.fillText(` = ${min_rho_actual.toFixed(2)} mm`, legendX + Math.round(25 * scale) + rhoWidth + minWidth, legendY + Math.round(4 * scale));
  }

  // 滚子半径阈值
  if (r_r > 0) {
    legendY += Math.round(16 * scale);
    ctx.strokeStyle = CURVATURE_COLORS.threshold;
    ctx.setLineDash([Math.round(4 * scale), Math.round(4 * scale)]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + Math.round(20 * scale), legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = isDark ? CHART_COLORS.textDark : CHART_COLORS.textLight;
    ctx.fillText(`${tr(lang, 'threshold', translations)} ${r_r} mm`, legendX + Math.round(25 * scale), legendY + Math.round(4 * scale));
  }
}