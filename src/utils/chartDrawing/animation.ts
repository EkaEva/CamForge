// 绘制动画单帧（用于 GIF 导出）

import type { SimulationData, CamParams } from '../../types';
import { EPSILON } from '../../constants/numeric';
import {
  type AnimationFrameOptions,
  validateChartData,
  validateAnimationFrameOptions,
  tr,
} from './common';

export function drawAnimationFrame(
  ctx: CanvasRenderingContext2D,
  data: SimulationData,
  params: CamParams,
  options: AnimationFrameOptions
): void {
  // 输入验证
  if (!validateChartData(data)) {
    console.warn('Invalid simulation data for animation frame');
    return;
  }
  if (!validateAnimationFrameOptions(options, data.s.length)) {
    console.warn('Invalid animation frame options');
    return;
  }

  const { width, height, frameIndex, displayOptions, zoom } = options;
  const { s, x, y, x_actual, y_actual, s_0, alpha_all, ds_ddelta, r_max, phase_bounds } = data;
  const n = s.length;
  const sn = params.sn;
  const pz = params.pz;
  const e = params.e;
  const r_r = params.r_r;
  const r_0 = params.r_0;
  const h = params.h;

  // 背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 计算中心和缩放
  const margin = r_max * 0.15;
  const size = 2 * (r_max + margin);
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / size * zoom;

  // 当前帧角度
  const angleDeg = (frameIndex * 360) / n;
  const angleRad = -sn * (angleDeg * Math.PI / 180);

  // 旋转凸轮轮廓
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  const rotatePoint = (px: number, py: number): [number, number] => {
    return [px * cosA - py * sinA, px * sinA + py * cosA];
  };

  // 选择轮廓（实际或理论）
  const profileX = r_r > 0 ? x_actual : x;
  const profileY = r_r > 0 ? y_actual : y;

  // 绘制基圆（虚线）
  if (displayOptions.showBaseCircle) {
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 0.5 * scale;
    ctx.setLineDash([2 * scale, 2 * scale]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, s_0 * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 绘制凸轮轮廓
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 0.8 * scale;
  ctx.beginPath();
  for (let i = 0; i < profileX.length; i++) {
    const [rx, ry] = rotatePoint(profileX[i], profileY[i]);
    const px = centerX + rx * scale;
    const py = centerY - ry * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // 推杆位置
  const followerX = centerX - sn * pz * e * scale;
  const contactY = centerY - (s_0 + s[frameIndex]) * scale;

  // 绘制推杆
  if (r_r > 0) {
    // 滚子从动件
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 0.8 * scale;
    ctx.beginPath();
    ctx.arc(followerX, contactY, r_r * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // 滚子中心点
    ctx.fillStyle = '#4B5563';
    ctx.beginPath();
    ctx.arc(followerX, contactY, r_0 * 0.02 * scale, 0, 2 * Math.PI);
    ctx.fill();

    // 推杆杆身
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 0.8 * scale;
    ctx.beginPath();
    ctx.moveTo(followerX, contactY);
    ctx.lineTo(followerX, contactY - r_max * 0.3 * scale);
    ctx.stroke();
  } else {
    // 尖底从动件
    const tipWidth = r_0 * 0.075 * scale;
    const tipHeight = r_0 * 0.1 * scale;
    const outlineOffset = 0.4 * scale;

    ctx.fillStyle = '#4B5563';
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 0.8 * scale;
    ctx.beginPath();
    ctx.moveTo(followerX - tipWidth, contactY - tipHeight);
    ctx.lineTo(followerX, contactY - outlineOffset);
    ctx.lineTo(followerX + tipWidth, contactY - tipHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 推杆杆身
    ctx.beginPath();
    ctx.moveTo(followerX, contactY - tipHeight);
    ctx.lineTo(followerX, contactY - r_max * 0.3 * scale);
    ctx.stroke();
  }

  // 计算切线和法线方向
  const deltaI = (angleDeg * Math.PI) / 180;
  const theta = -sn * deltaI;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosD = Math.cos(deltaI);
  const sinD = Math.sin(deltaI);

  const sp = s_0 + s[frameIndex];
  const dsd = ds_ddelta[frameIndex];

  const dx0 = sp * cosD + dsd * sinD - pz * e * sinD;
  const dy0 = -sp * sinD + dsd * cosD - pz * e * cosD;
  const dx = -sn * dx0;
  const dy = dy0;
  let tx = dx * cosT - dy * sinT;
  let ty = dx * sinT + dy * cosT;
  const lenT = Math.hypot(tx, ty);
  if (lenT > EPSILON) {
    tx /= lenT;
    ty /= lenT;
  } else {
    tx = 1;
    ty = 0;
  }

  const nx1 = -ty, ny1 = tx;
  const nx2 = ty, ny2 = -tx;
  const cfx = -sn * pz * e;
  const cfy = s_0 + s[frameIndex];
  const dot1 = (0 - cfx) * nx1 + (0 - cfy) * ny1;
  let nx: number, ny: number;
  if (dot1 > 0) {
    nx = nx1;
    ny = ny1;
  } else {
    nx = nx2;
    ny = ny2;
  }

  // 绘制切线
  if (displayOptions.showTangent) {
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 0.3 * scale;
    ctx.beginPath();
    ctx.moveTo(followerX - r_0 * tx * scale, contactY + r_0 * ty * scale);
    ctx.lineTo(followerX + r_0 * tx * scale, contactY - r_0 * ty * scale);
    ctx.stroke();
  }

  // 绘制法线
  if (displayOptions.showNormal || displayOptions.showPressureArc) {
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 0.3 * scale;
    ctx.beginPath();
    ctx.moveTo(followerX + r_0 * nx * scale, contactY - r_0 * ny * scale);
    ctx.lineTo(followerX - r_0 * nx * scale, contactY + r_0 * ny * scale);
    ctx.stroke();
  }

  // 绘制压力角弧
  if (displayOptions.showPressureArc) {
    const alphaI = alpha_all[frameIndex];
    if (alphaI > 0.5) {
      const alphaRad = (alphaI * Math.PI) / 180;
      const arcR = r_0 * 0.3 * scale;

      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 0.3 * scale;
      ctx.beginPath();
      ctx.moveTo(followerX, contactY);
      ctx.lineTo(followerX, contactY + r_0 * 0.5 * scale);
      ctx.stroke();

      const thetaStart = Math.PI / 2;
      let thetaN = Math.atan2(-ny, nx);
      let diff = ((thetaN - thetaStart + Math.PI) % (2 * Math.PI)) - Math.PI;

      if (Math.abs(Math.abs(diff) - alphaRad) > 0.1) {
        thetaN = Math.atan2(ny, -nx);
        diff = ((thetaN - thetaStart + Math.PI) % (2 * Math.PI)) - Math.PI;
      }

      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 0.3 * scale;
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const th = thetaStart + diff * t;
        const arcX = followerX + arcR * Math.cos(th);
        const arcY = contactY + arcR * Math.sin(th);
        if (i === 0) ctx.moveTo(arcX, arcY);
        else ctx.lineTo(arcX, arcY);
      }
      ctx.stroke();
    }
  }

  // 绘制行程极限
  if (displayOptions.showLowerLimit) {
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 0.3 * scale;
    ctx.setLineDash([4 * scale, 2 * scale]);
    ctx.beginPath();
    ctx.moveTo(centerX - r_0 * 0.8 * scale, centerY - s_0 * scale);
    ctx.lineTo(centerX + r_0 * 0.8 * scale, centerY - s_0 * scale);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (displayOptions.showUpperLimit) {
    ctx.strokeStyle = '#D946EF';
    ctx.lineWidth = 0.3 * scale;
    ctx.setLineDash([2 * scale, 2 * scale]);
    ctx.beginPath();
    ctx.moveTo(centerX - r_0 * 0.8 * scale, centerY - (s_0 + h) * scale);
    ctx.lineTo(centerX + r_0 * 0.8 * scale, centerY - (s_0 + h) * scale);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 绘制相位边界线
  if (displayOptions.showBoundaries) {
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 0.3 * scale;
    for (const bound of phase_bounds.slice(1)) {
      const boundIdx = Math.floor(bound * n / 360);
      if (boundIdx < n) {
        const [bx, by] = rotatePoint(profileX[boundIdx], profileY[boundIdx]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + bx * scale, centerY - by * scale);
        ctx.stroke();
      }
    }
  }

  // 绘制固定支座
  const sz = r_0 * 0.12 * scale;
  const circleR = sz * 0.2;
  const triTopY = circleR + sz * 0.05;
  const triBotY = sz * 1.35;
  const hw = sz * 1.3;
  const baseY = triBotY;
  const hatchLen = sz * 0.5;
  const nHatch = 5;

  ctx.strokeStyle = '#4B5563';
  ctx.fillStyle = '#4B5563';
  ctx.lineWidth = 0.7 * scale;

  ctx.beginPath();
  ctx.arc(centerX, centerY, circleR, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY + triTopY);
  ctx.lineTo(centerX - sz, centerY + triBotY);
  ctx.lineTo(centerX + sz, centerY + triBotY);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(centerX - hw, centerY + baseY);
  ctx.lineTo(centerX + hw, centerY + baseY);
  ctx.stroke();

  ctx.lineWidth = 0.5 * scale;
  for (let j = 0; j < nHatch; j++) {
    const x0 = centerX - hw + (2 * hw) * (j + 0.5) / nHatch;
    ctx.beginPath();
    ctx.moveTo(x0, centerY + baseY);
    ctx.lineTo(x0 - hatchLen * 0.6, centerY + baseY + hatchLen);
    ctx.stroke();
  }

  // 信息面板
  const panelX = width - 100;
  const panelY = 10;
  const panelW = 90;
  const panelH = 50;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(panelX, panelY, panelW, panelH);

  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = '#6B7280';
  ctx.font = '10px -apple-system, sans-serif';
  ctx.textAlign = 'left';

  const animLang = options.lang || 'zh';
  ctx.fillText(tr(animLang, 'animAngle'), panelX + 5, panelY + 12);
  ctx.fillText(tr(animLang, 'animDisp'), panelX + 5, panelY + 24);
  ctx.fillText(tr(animLang, 'animAlpha'), panelX + 5, panelY + 36);

  ctx.fillStyle = '#111827';
  ctx.textAlign = 'right';
  ctx.fillText(`${angleDeg.toFixed(1)}°`, panelX + panelW - 5, panelY + 12);
  ctx.fillText(`${s[frameIndex].toFixed(3)} mm`, panelX + panelW - 5, panelY + 24);
  ctx.fillText(`${alpha_all[frameIndex].toFixed(2)}°`, panelX + panelW - 5, panelY + 36);
}