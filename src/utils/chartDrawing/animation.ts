import { ANIMATION_COLORS, CHART_COLORS, LINE_STYLES } from '../../constants/chartColors';
import {
  validateAnimationFrameOptions,
  sanitizeNumber,
} from './common';
import type { FrameData, CamParams } from '../../types';
import { FollowerType } from '../../types';

const C = ANIMATION_COLORS;

/**
 * Draw a full animation frame: cam profile, follower, and reference lines.
 * 绘制完整动画帧：凸轮轮廓、从动件和参考线。
 */
export function drawAnimationFrame(
  ctx: CanvasRenderingContext2D,
  data: FrameData,
  params: CamParams,
  options: {
    width: number;
    height: number;
    zoom?: number;
    panX?: number;
    panY?: number;
  }
): void {
  const opts = validateAnimationFrameOptions(options);
  const { width, height, zoom, panX, panY } = opts;
  const dpr = window.devicePixelRatio || 1;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = CHART_COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Transform: center + pan + zoom
  const cx = width / 2 + panX;
  const cy = height / 2 + panY;
  ctx.translate(cx, cy);
  ctx.scale(zoom, zoom);

  // Draw base circle
  const r0 = sanitizeNumber(params.r_0);
  ctx.beginPath();
  ctx.arc(0, 0, r0, 0, Math.PI * 2);
  ctx.strokeStyle = C.baseCircle;
  ctx.lineWidth = LINE_STYLES.thin;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw cam profile
  if (data.cam_x && data.cam_y) {
    ctx.beginPath();
    ctx.moveTo(sanitizeNumber(data.cam_x[0]), sanitizeNumber(data.cam_y[0]));
    for (let i = 1; i < data.cam_x.length; i++) {
      ctx.lineTo(sanitizeNumber(data.cam_x[i]), sanitizeNumber(data.cam_y[i]));
    }
    ctx.closePath();
    ctx.fillStyle = C.camFill;
    ctx.fill();
    ctx.strokeStyle = C.camStroke;
    ctx.lineWidth = LINE_STYLES.medium;
    ctx.stroke();
  }

  // Draw center point
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = C.centerPoint;
  ctx.fill();

  // Draw follower
  const isOscillating =
    params.follower_type === FollowerType.OscillatingRoller ||
    params.follower_type === FollowerType.OscillatingFlatFaced;

  if (isOscillating && data.pivot_x != null && data.pivot_y != null) {
    drawOscillatingFollower(ctx, data, params);
  } else {
    drawTranslatingFollower(ctx, data, params);
  }

  // Draw pressure angle line
  if (data.pressure_angle != null) {
    drawPressureAngleLine(ctx, data, params);
  }

  ctx.restore();
}

function drawTranslatingFollower(
  ctx: CanvasRenderingContext2D,
  data: FrameData,
  params: CamParams
) {
  const fx = sanitizeNumber(data.follower_x);
  const fy = sanitizeNumber(data.follower_y);

  if (params.follower_type === FollowerType.TranslatingFlatFaced) {
    // Flat-faced follower
    const halfWidth = params.r_r || 20;
    ctx.beginPath();
    ctx.rect(fx - halfWidth, fy - 2, halfWidth * 2, 4);
    ctx.fillStyle = C.followerBody;
    ctx.fill();
    ctx.strokeStyle = C.followerStroke;
    ctx.lineWidth = LINE_STYLES.thin;
    ctx.stroke();

    // Follower stem
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy - params.h);
    ctx.strokeStyle = C.followerStroke;
    ctx.lineWidth = LINE_STYLES.medium;
    ctx.stroke();
  } else if (params.follower_type === FollowerType.TranslatingKnifeEdge) {
    // Knife-edge follower
    ctx.beginPath();
    ctx.arc(fx, fy, 2, 0, Math.PI * 2);
    ctx.fillStyle = C.followerBody;
    ctx.fill();

    // Follower stem
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy - params.h);
    ctx.strokeStyle = C.followerStroke;
    ctx.lineWidth = LINE_STYLES.medium;
    ctx.stroke();
  } else {
    // Roller follower
    const rr = sanitizeNumber(params.r_r);
    ctx.beginPath();
    ctx.arc(fx, fy, rr, 0, Math.PI * 2);
    ctx.fillStyle = C.rollerFill;
    ctx.fill();
    ctx.strokeStyle = C.rollerStroke;
    ctx.lineWidth = LINE_STYLES.thin;
    ctx.stroke();

    // Follower stem
    ctx.beginPath();
    ctx.moveTo(fx, fy - rr);
    ctx.lineTo(fx, fy - params.h);
    ctx.strokeStyle = C.followerStroke;
    ctx.lineWidth = LINE_STYLES.medium;
    ctx.stroke();
  }
}

function drawOscillatingFollower(
  ctx: CanvasRenderingContext2D,
  data: FrameData,
  params: CamParams
) {
  const fx = sanitizeNumber(data.follower_x);
  const fy = sanitizeNumber(data.follower_y);
  const px = sanitizeNumber(data.pivot_x!);
  const py = sanitizeNumber(data.pivot_y!);

  // Draw pivot point
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fillStyle = C.pivotPoint;
  ctx.fill();

  if (params.follower_type === FollowerType.OscillatingFlatFaced) {
    // Flat-faced oscillating follower
    const halfWidth = params.r_r || 20;
    const angle = data.arm_angle || 0;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(fx - halfWidth * cos, fy - halfWidth * sin);
    ctx.lineTo(fx + halfWidth * cos, fy + halfWidth * sin);
    ctx.strokeStyle = C.followerStroke;
    ctx.lineWidth = LINE_STYLES.medium;
    ctx.stroke();

    // Arm from pivot to follower
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(fx, fy);
    ctx.strokeStyle = C.armLine;
    ctx.lineWidth = LINE_STYLES.thin;
    ctx.stroke();
  } else {
    // Roller oscillating follower
    const rr = sanitizeNumber(params.r_r);
    ctx.beginPath();
    ctx.arc(fx, fy, rr, 0, Math.PI * 2);
    ctx.fillStyle = C.rollerFill;
    ctx.fill();
    ctx.strokeStyle = C.rollerStroke;
    ctx.lineWidth = LINE_STYLES.thin;
    ctx.stroke();

    // Arm from pivot to roller center
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(fx, fy);
    ctx.strokeStyle = C.armLine;
    ctx.lineWidth = LINE_STYLES.thin;
    ctx.stroke();
  }
}

function drawPressureAngleLine(
  ctx: CanvasRenderingContext2D,
  data: FrameData,
  params: CamParams
) {
  const fx = sanitizeNumber(data.follower_x);
  const fy = sanitizeNumber(data.follower_y);

  // Draw pressure angle indicator at follower contact point
  const normalLen = 30;

  // Normal direction: from cam center to follower contact point
  const dist = Math.sqrt(fx * fx + fy * fy) || 1;
  const nx = fx / dist;
  const ny = fy / dist;

  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + nx * normalLen, fy + ny * normalLen);
  ctx.strokeStyle = C.normalLine;
  ctx.lineWidth = LINE_STYLES.thin;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tangent line (perpendicular to normal)
  const tx = -ny;
  const ty = nx;
  ctx.beginPath();
  ctx.moveTo(fx - tx * normalLen, fy - ty * normalLen);
  ctx.lineTo(fx + tx * normalLen, fy + ty * normalLen);
  ctx.strokeStyle = C.tangentLine;
  ctx.lineWidth = LINE_STYLES.thin;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
}
