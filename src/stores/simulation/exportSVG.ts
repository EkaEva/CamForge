import { language } from '../../i18n';
import { arrayMax, arrayMin, arrayMaxBy, filterFinite } from '../../utils/array';
import { simulationData, params } from './core';

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const SVG_CHART_WIDTH = 500;
const SVG_CHART_HEIGHT = 350;
const SVG_GAP = 20;
const SVG_PADDING = { top: 50, right: 70, bottom: 50, left: 60 };
const SVG_TOTAL_WIDTH = SVG_CHART_WIDTH * 2 + SVG_GAP * 3;
const SVG_TOTAL_HEIGHT = SVG_CHART_HEIGHT * 2 + SVG_GAP * 3;

export function generateSVG(): string {
  const data = simulationData();
  const p = params();
  if (!data) return '';

  const lang = language();

  const chartWidth = SVG_CHART_WIDTH;
  const chartHeight = SVG_CHART_HEIGHT;
  const gap = SVG_GAP;
  const totalWidth = SVG_TOTAL_WIDTH;
  const totalHeight = SVG_TOTAL_HEIGHT;
  const padding = SVG_PADDING;

  const labels = {
    delta: xmlEscape(lang === 'zh' ? '转角 δ (°)' : 'Angle δ (°)'),
    s: xmlEscape(lang === 'zh' ? '位移 s (mm)' : 'Displacement s (mm)'),
    v: xmlEscape(lang === 'zh' ? '速度 v (mm/s)' : 'Velocity v (mm/s)'),
    a: xmlEscape(lang === 'zh' ? '加速度 a (mm/s²)' : 'Acceleration a (mm/s²)'),
    alpha: xmlEscape(lang === 'zh' ? '压力角 α (°)' : 'Pressure Angle α (°)'),
    rho: xmlEscape(lang === 'zh' ? '曲率半径 ρ (mm)' : 'Curvature ρ (mm)'),
    motion: xmlEscape(lang === 'zh' ? '推杆运动线图' : 'Follower Motion Curves'),
    pressure: xmlEscape(lang === 'zh' ? '压力角曲线' : 'Pressure Angle Curve'),
    curvature: xmlEscape(lang === 'zh' ? '曲率半径曲线' : 'Curvature Radius Curve'),
    profile: xmlEscape(lang === 'zh' ? '凸轮廓形' : 'Cam Profile'),
    theory: xmlEscape(lang === 'zh' ? '理论廓形' : 'Theory Profile'),
    actual: xmlEscape(lang === 'zh' ? '实际廓形' : 'Actual Profile'),
    baseCircle: xmlEscape(lang === 'zh' ? '基圆' : 'Base Circle'),
    threshold: xmlEscape(lang === 'zh' ? '阈值' : 'Threshold'),
  };

  const sMax = data.h * 1.15;
  const vMax = arrayMaxBy(data.v, Math.abs) * 1.15 || 1;
  const aMax = arrayMaxBy(data.a, Math.abs) * 1.15 || 1;
  const alphaMax = Math.max(arrayMaxBy(data.alpha_all, Math.abs), p.alpha_threshold) * 1.15;
  const rhoFinite = filterFinite(data.rho);
  const rhoActualFinite = data.rho_actual ? filterFinite(data.rho_actual) : [];
  const allRhoFinite = [...rhoFinite, ...rhoActualFinite];

  let rhoMin: number, rhoMax: number;
  if (allRhoFinite.length > 0) {
    const rhoSorted = [...allRhoFinite].sort((a, b) => a - b);
    const p5Idx = Math.floor(rhoSorted.length * 0.05);
    const p95Idx = Math.floor(rhoSorted.length * 0.95);
    const p5 = rhoSorted[p5Idx];
    const p95 = rhoSorted[p95Idx];
    const range = p95 - p5;

    const p10 = rhoSorted[Math.floor(rhoSorted.length * 0.1)];
    const p90 = rhoSorted[Math.floor(rhoSorted.length * 0.9)];
    if (range > 10 * (p90 - p10 + 1)) {
      rhoMin = p5 - range * 0.1;
      rhoMax = p95 + range * 0.1;
    } else {
      rhoMin = arrayMin(allRhoFinite) * 0.9;
      rhoMax = arrayMax(allRhoFinite) * 1.1;
      if (rhoMin > 0) rhoMin = arrayMin(allRhoFinite) * 0.9;
      else rhoMin = arrayMin(allRhoFinite) - 1;
      if (rhoMax < 0) rhoMax = arrayMax(allRhoFinite) + 1;
    }
  } else {
    rhoMin = 0;
    rhoMax = 100;
  }

  const generatePath = (
    yData: number[],
    yMin: number,
    yMax: number,
    offsetX: number,
    offsetY: number,
    plotWidth: number,
    plotHeight: number
  ): string => {
    const points: string[] = [];
    for (let i = 0; i < yData.length; i++) {
      const x = offsetX + padding.left + (data.delta_deg[i] / 360) * plotWidth;
      const y = offsetY + padding.top + (1 - (yData[i] - yMin) / (yMax - yMin)) * plotHeight;
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return `M ${points.join(' L ')}`;
  };

  const generateRhoPathFromData = (
    rhoData: number[],
    offsetX: number,
    offsetY: number,
    plotWidth: number,
    plotHeight: number
  ): string => {
    if (!rhoData || rhoData.length === 0) return '';

    const parts: string[] = [];
    let currentPath: string[] = [];

    for (let i = 0; i < rhoData.length; i++) {
      if (!isFinite(rhoData[i])) {
        if (currentPath.length > 0) {
          parts.push(`M ${currentPath.join(' L ')}`);
          currentPath = [];
        }
        continue;
      }
      const x = offsetX + padding.left + (data.delta_deg[i] / 360) * plotWidth;
      const y = offsetY + padding.top + (1 - (rhoData[i] - rhoMin) / (rhoMax - rhoMin)) * plotHeight;
      currentPath.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    if (currentPath.length > 0) {
      parts.push(`M ${currentPath.join(' L ')}`);
    }

    return parts.join(' ');
  };

  const generateCamPath = (
    xData: number[],
    yData: number[],
    centerX: number,
    centerY: number,
    scale: number
  ): string => {
    const points: string[] = [];
    for (let i = 0; i < xData.length; i++) {
      const px = centerX + xData[i] * scale;
      const py = centerY - yData[i] * scale;
      points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
    }
    return `M ${points.join(' L ')} Z`;
  };

  const positions = [
    { x: gap, y: gap },
    { x: chartWidth + gap * 2, y: gap },
    { x: gap, y: chartHeight + gap * 2 },
    { x: chartWidth + gap * 2, y: chartHeight + gap * 2 },
  ];

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const profileCenterX = positions[3].x + chartWidth / 2;
  const profileCenterY = positions[3].y + chartHeight / 2;
  const profileScale = Math.min(chartWidth, chartHeight) / (2 * data.r_max * 1.3);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  <style>
    .bg { fill: white; }
    .axis { stroke: #333; stroke-width: 1; fill: none; }
    .grid { stroke: #ddd; stroke-width: 0.5; stroke-dasharray: 2,2; }
    .phase-line { stroke: #999; stroke-width: 0.8; stroke-dasharray: 4,4; }
    .curve-s { stroke: #DC2626; stroke-width: 1.5; fill: none; }
    .curve-v { stroke: #2563EB; stroke-width: 1.5; fill: none; stroke-dasharray: 6,4; }
    .curve-a { stroke: #16A34A; stroke-width: 1.5; fill: none; stroke-dasharray: 8,4,2,4; }
    .curve-alpha { stroke: #DC2626; stroke-width: 1.5; fill: none; }
    .curve-rho { stroke: #DC2626; stroke-width: 1.5; fill: none; }
    .threshold-line { stroke: #F59E0B; stroke-width: 1; stroke-dasharray: 4,4; }
    .theory-profile { stroke: #DC2626; stroke-width: 2; fill: none; }
    .actual-profile { stroke: #2563EB; stroke-width: 2; fill: none; }
    .base-circle { stroke: #999; stroke-width: 1; fill: none; stroke-dasharray: 5,5; }
    .label { font-family: -apple-system, sans-serif; font-size: 10px; fill: #333; }
    .title { font-family: -apple-system, sans-serif; font-size: 14px; fill: #333; font-weight: bold; }
    .axis-label { font-family: -apple-system, sans-serif; font-size: 10px; fill: #333; }
    .tick { font-family: -apple-system, sans-serif; font-size: 9px; fill: #333; }
    .legend { font-family: -apple-system, sans-serif; font-size: 9px; fill: #333; }
  </style>

  <!-- 背景 -->
  <rect width="${totalWidth}" height="${totalHeight}" class="bg"/>

  <!-- ========== 运动曲线（左上）========== -->
  <g transform="translate(0, 0)">
    <text x="${positions[0].x + chartWidth/2}" y="${positions[0].y + 20}" text-anchor="middle" class="title">${labels.motion}</text>

    <!-- 网格 -->
    ${Array.from({length: 13}, (_, i) => {
      const x = positions[0].x + padding.left + (i / 12) * plotWidth;
      return `<line x1="${x}" y1="${positions[0].y + padding.top}" x2="${x}" y2="${positions[0].y + chartHeight - padding.bottom}" class="grid"/>`;
    }).join('\n    ')}
    ${Array.from({length: 11}, (_, i) => {
      const y = positions[0].y + padding.top + (i / 10) * plotHeight;
      return `<line x1="${positions[0].x + padding.left}" y1="${y}" x2="${positions[0].x + chartWidth - padding.right}" y2="${y}" class="grid"/>`;
    }).join('\n    ')}

    <!-- 相位分界线 -->
    ${data.phase_bounds.slice(1, -1).map(bound => {
      const x = positions[0].x + padding.left + (bound / 360) * plotWidth;
      return `<line x1="${x}" y1="${positions[0].y + padding.top}" x2="${x}" y2="${positions[0].y + chartHeight - padding.bottom}" class="phase-line"/>`;
    }).join('\n    ')}

    <!-- 曲线 -->
    <path d="${generatePath(data.s, 0, sMax, positions[0].x, positions[0].y, plotWidth, plotHeight)}" class="curve-s"/>
    <path d="${generatePath(data.v, -vMax, vMax, positions[0].x, positions[0].y, plotWidth, plotHeight)}" class="curve-v"/>
    <path d="${generatePath(data.a, -aMax, aMax, positions[0].x, positions[0].y, plotWidth, plotHeight)}" class="curve-a"/>

    <!-- 坐标轴 -->
    <rect x="${positions[0].x + padding.left}" y="${positions[0].y + padding.top}" width="${plotWidth}" height="${plotHeight}" class="axis"/>

    <!-- X轴标签 -->
    <text x="${positions[0].x + chartWidth/2}" y="${positions[0].y + chartHeight - 10}" text-anchor="middle" class="axis-label">${labels.delta}</text>
    ${[0, 90, 180, 270, 360].map(val => {
      const x = positions[0].x + padding.left + (val / 360) * plotWidth;
      return `<text x="${x}" y="${positions[0].y + chartHeight - padding.bottom + 15}" text-anchor="middle" class="tick">${val}</text>`;
    }).join('\n    ')}

    <!-- Y轴标签 -->
    <text x="${positions[0].x + 16}" y="${positions[0].y + padding.top + plotHeight/2}" text-anchor="middle" class="axis-label" transform="rotate(-90, ${positions[0].x + 16}, ${positions[0].y + padding.top + plotHeight/2})">${labels.s}</text>

    <!-- 图例 -->
    <g transform="translate(${positions[0].x + chartWidth - 100}, ${positions[0].y + padding.top + 10})">
      <line x1="0" y1="0" x2="20" y2="0" class="curve-s"/>
      <text x="25" y="4" class="legend">${lang === 'zh' ? '位移 s' : 's'}</text>
      <line x1="0" y1="16" x2="20" y2="16" class="curve-v"/>
      <text x="25" y="20" class="legend">${lang === 'zh' ? '速度 v' : 'v'}</text>
      <line x1="0" y1="32" x2="20" y2="32" class="curve-a"/>
      <text x="25" y="36" class="legend">${lang === 'zh' ? '加速度 a' : 'a'}</text>
    </g>
  </g>

  <!-- ========== 压力角（右上）========== -->
  <g transform="translate(0, 0)">
    <text x="${positions[1].x + chartWidth/2}" y="${positions[1].y + 20}" text-anchor="middle" class="title">${labels.pressure}</text>

    <!-- 网格 -->
    ${Array.from({length: 13}, (_, i) => {
      const x = positions[1].x + padding.left + (i / 12) * plotWidth;
      return `<line x1="${x}" y1="${positions[1].y + padding.top}" x2="${x}" y2="${positions[1].y + chartHeight - padding.bottom}" class="grid"/>`;
    }).join('\n    ')}
    ${Array.from({length: 11}, (_, i) => {
      const y = positions[1].y + padding.top + (i / 10) * plotHeight;
      return `<line x1="${positions[1].x + padding.left}" y1="${y}" x2="${positions[1].x + chartWidth - padding.right}" y2="${y}" class="grid"/>`;
    }).join('\n    ')}

    <!-- 相位分界线 -->
    ${data.phase_bounds.slice(1, -1).map(bound => {
      const x = positions[1].x + padding.left + (bound / 360) * plotWidth;
      return `<line x1="${x}" y1="${positions[1].y + padding.top}" x2="${x}" y2="${positions[1].y + chartHeight - padding.bottom}" class="phase-line"/>`;
    }).join('\n    ')}

    <!-- 阈值线 -->
    <line x1="${positions[1].x + padding.left}" y1="${positions[1].y + padding.top + (1 - p.alpha_threshold / alphaMax) * plotHeight}" x2="${positions[1].x + chartWidth - padding.right}" y2="${positions[1].y + padding.top + (1 - p.alpha_threshold / alphaMax) * plotHeight}" class="threshold-line"/>

    <!-- 曲线 -->
    <path d="${generatePath(data.alpha_all, 0, alphaMax, positions[1].x, positions[1].y, plotWidth, plotHeight)}" class="curve-alpha"/>

    <!-- 坐标轴 -->
    <rect x="${positions[1].x + padding.left}" y="${positions[1].y + padding.top}" width="${plotWidth}" height="${plotHeight}" class="axis"/>

    <!-- X轴标签 -->
    <text x="${positions[1].x + chartWidth/2}" y="${positions[1].y + chartHeight - 10}" text-anchor="middle" class="axis-label">${labels.delta}</text>
    ${[0, 90, 180, 270, 360].map(val => {
      const x = positions[1].x + padding.left + (val / 360) * plotWidth;
      return `<text x="${x}" y="${positions[1].y + chartHeight - padding.bottom + 15}" text-anchor="middle" class="tick">${val}</text>`;
    }).join('\n    ')}

    <!-- Y轴标签 -->
    <text x="${positions[1].x + 16}" y="${positions[1].y + padding.top + plotHeight/2}" text-anchor="middle" class="axis-label" transform="rotate(-90, ${positions[1].x + 16}, ${positions[1].y + padding.top + plotHeight/2})">${labels.alpha}</text>

    <!-- 图例 -->
    <g transform="translate(${positions[1].x + padding.left + 10}, ${positions[1].y + padding.top + 10})">
      <line x1="0" y1="0" x2="20" y2="0" class="curve-alpha"/>
      <text x="25" y="4" class="legend">${lang === 'zh' ? '压力角 α' : 'α'}</text>
      <line x1="0" y1="16" x2="20" y2="16" class="threshold-line"/>
      <text x="25" y="20" class="legend">${labels.threshold} ${p.alpha_threshold}°</text>
    </g>
  </g>

  <!-- ========== 曲率半径（左下）========== -->
  <g transform="translate(0, 0)">
    <text x="${positions[2].x + chartWidth/2}" y="${positions[2].y + 20}" text-anchor="middle" class="title">${labels.curvature}</text>

    <!-- 网格 -->
    ${Array.from({length: 13}, (_, i) => {
      const x = positions[2].x + padding.left + (i / 12) * plotWidth;
      return `<line x1="${x}" y1="${positions[2].y + padding.top}" x2="${x}" y2="${positions[2].y + chartHeight - padding.bottom}" class="grid"/>`;
    }).join('\n    ')}
    ${Array.from({length: 11}, (_, i) => {
      const y = positions[2].y + padding.top + (i / 10) * plotHeight;
      return `<line x1="${positions[2].x + padding.left}" y1="${y}" x2="${positions[2].x + chartWidth - padding.right}" y2="${y}" class="grid"/>`;
    }).join('\n    ')}

    <!-- 相位分界线 -->
    ${data.phase_bounds.slice(1, -1).map(bound => {
      const x = positions[2].x + padding.left + (bound / 360) * plotWidth;
      return `<line x1="${x}" y1="${positions[2].y + padding.top}" x2="${x}" y2="${positions[2].y + chartHeight - padding.bottom}" class="phase-line"/>`;
    }).join('\n    ')}

    <!-- 曲线 -->
    <path d="${generateRhoPathFromData(data.rho, positions[2].x, positions[2].y, plotWidth, plotHeight)}" class="curve-rho"/>
    ${p.r_r > 0 ? `<path d="${generateRhoPathFromData(data.rho_actual, positions[2].x, positions[2].y, plotWidth, plotHeight)}" stroke="#3B82F6" stroke-width="1.5" fill="none" stroke-dasharray="4,2"/>` : ''}

    <!-- 滚子半径阈值线 -->
    ${p.r_r > 0 ? (() => {
      const thresholdY = positions[2].y + padding.top + (1 - (p.r_r - rhoMin) / (rhoMax - rhoMin)) * plotHeight;
      if (thresholdY >= positions[2].y + padding.top && thresholdY <= positions[2].y + chartHeight - padding.bottom) {
        return `<line x1="${positions[2].x + padding.left}" y1="${thresholdY}" x2="${positions[2].x + chartWidth - padding.right}" y2="${thresholdY}" stroke="#06B6D4" stroke-width="1" stroke-dasharray="4,4"/>`;
      }
      return '';
    })() : ''}

    <!-- 坐标轴 -->
    <rect x="${positions[2].x + padding.left}" y="${positions[2].y + padding.top}" width="${plotWidth}" height="${plotHeight}" class="axis"/>

    <!-- X轴标签 -->
    <text x="${positions[2].x + chartWidth/2}" y="${positions[2].y + chartHeight - 10}" text-anchor="middle" class="axis-label">${labels.delta}</text>
    ${[0, 90, 180, 270, 360].map(val => {
      const x = positions[2].x + padding.left + (val / 360) * plotWidth;
      return `<text x="${x}" y="${positions[2].y + chartHeight - padding.bottom + 15}" text-anchor="middle" class="tick">${val}</text>`;
    }).join('\n    ')}

    <!-- Y轴标签 -->
    <text x="${positions[2].x + 16}" y="${positions[2].y + padding.top + plotHeight/2}" text-anchor="middle" class="axis-label" transform="rotate(-90, ${positions[2].x + 16}, ${positions[2].y + padding.top + plotHeight/2})">${labels.rho}</text>

    <!-- 图例 -->
    <g transform="translate(${positions[2].x + padding.left + 10}, ${positions[2].y + padding.top + 10})">
      <line x1="0" y1="0" x2="20" y2="0" class="curve-rho"/>
      <text x="25" y="4" class="legend">${lang === 'zh' ? '理论轮廓 ρ' : 'Theory ρ'}</text>
      ${p.r_r > 0 ? `<line x1="0" y1="14" x2="20" y2="14" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="4,2"/><text x="25" y="18" class="legend">${lang === 'zh' ? '实际轮廓 ρₐ' : 'Actual ρₐ'}</text>` : ''}
      ${data.min_rho !== null ? `<circle cx="10" cy="${p.r_r > 0 ? 30 : 16}" r="4" fill="#16A34A"/><text x="25" y="${p.r_r > 0 ? 34 : 20}" class="legend">ρ<tspan baseline-shift="sub" font-size="8">min</tspan> = ${data.min_rho.toFixed(2)} mm</text>` : ''}
      ${p.r_r > 0 && data.min_rho_actual !== null ? `<circle cx="10" cy="${data.min_rho !== null ? 46 : 30}" r="4" fill="#F97316"/><text x="25" y="${data.min_rho !== null ? 50 : 34}" class="legend">ρ<tspan baseline-shift="sub" font-size="8">a,min</tspan> = ${data.min_rho_actual.toFixed(2)} mm</text>` : ''}
      ${p.r_r > 0 ? `<line x1="0" y1="${data.min_rho !== null ? (data.min_rho_actual !== null ? 62 : 46) : (data.min_rho_actual !== null ? 46 : 30)}" x2="20" y2="${data.min_rho !== null ? (data.min_rho_actual !== null ? 62 : 46) : (data.min_rho_actual !== null ? 46 : 30)}" stroke="#06B6D4" stroke-width="1" stroke-dasharray="4,4"/><text x="25" y="${data.min_rho !== null ? (data.min_rho_actual !== null ? 66 : 50) : (data.min_rho_actual !== null ? 50 : 34)}" class="legend">${lang === 'zh' ? '阈值' : 'Threshold'} ${p.r_r} mm</text>` : ''}
    </g>
  </g>

  <!-- ========== 凸轮轮廓（右下）========== -->
  <g transform="translate(0, 0)">
    <text x="${positions[3].x + chartWidth/2}" y="${positions[3].y + 20}" text-anchor="middle" class="title">${labels.profile}</text>

    <!-- 基圆 -->
    <circle cx="${profileCenterX}" cy="${profileCenterY}" r="${p.r_0 * profileScale}" class="base-circle"/>

    <!-- 偏距圆 -->
    ${Math.abs(p.e) > 0.01 ? `<circle cx="${profileCenterX}" cy="${profileCenterY}" r="${Math.abs(p.e) * profileScale}" stroke="#BBB" stroke-width="1" fill="none" stroke-dasharray="3,3"/>` : ''}

    <!-- 理论廓形 -->
    <path d="${generateCamPath(data.x, data.y, profileCenterX, profileCenterY, profileScale)}" class="theory-profile"/>

    <!-- 实际廓形 -->
    ${p.r_r > 0 && data.x_actual.length > 0 ? `<path d="${generateCamPath(data.x_actual, data.y_actual, profileCenterX, profileCenterY, profileScale)}" class="actual-profile"/>` : ''}

    <!-- 图例 -->
    <g transform="translate(${positions[3].x + 20}, ${positions[3].y + 30})">
      <line x1="0" y1="0" x2="30" y2="0" class="theory-profile"/>
      <text x="40" y="4" class="legend">${labels.theory}</text>
      ${p.r_r > 0 ? `<line x1="0" y1="16" x2="30" y2="16" class="actual-profile"/><text x="40" y="20" class="legend">${labels.actual}</text>` : ''}
      <line x1="0" y1="${p.r_r > 0 ? 32 : 16}" x2="30" y2="${p.r_r > 0 ? 32 : 16}" class="base-circle"/>
      <text x="40" y="${p.r_r > 0 ? 36 : 20}" class="legend">${labels.baseCircle}</text>
    </g>
  </g>
</svg>`;
}
