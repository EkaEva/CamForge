import { ANIMATION_COLORS, CAM_PROFILE_COLORS, CHART_COLORS } from '../../constants/chartColors';
import {
  validateAnimationFrameOptions,
  sanitizeNumber,
} from './common';
import type { AnimationFrameOptions, CamParams, SimulationData } from './common';
import { FollowerType } from '../../types';

type FrameData = SimulationData;

const C = ANIMATION_COLORS;
const LINE_WIDTH = {
  thin: 1,
  medium: 2,
} as const;

/**
 * Draw a full animation frame: cam profile, follower, and reference lines.
 * 绘制完整动画帧：凸轮轮廓、从动件和参考线。
 */
export function drawAnimationFrame(
  ctx: CanvasRenderingContext2D,
  data: FrameData,
  params: CamParams,
  options: AnimationFrameOptions
): void {
  if (!validateAnimationFrameOptions(options, data.s.length)) return;
  const { width, height, zoom } = options;
  const panX = 0;
  const panY = 0;
  const frameIndex = options.frameIndex;
  const camX = data.x;
  const camY = data.y;
  const followerX = data.x_actual[frameIndex] ?? data.x[frameIndex] ?? 0;
  const followerY = data.y_actual[frameIndex] ?? data.y[frameIndex] ?? 0;
  const frame = { followerX, followerY, pressureAngle: data.alpha_all[frameIndex] };
  const dpr = window.devicePixelRatio || 1;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = CHART_COLORS.bgLight;
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
  ctx.strokeStyle = CAM_PROFILE_COLORS.baseCircle;
  ctx.lineWidth = LINE_WIDTH.thin;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw cam profile
  if (camX.length && camY.length) {
    ctx.beginPath();
    ctx.moveTo(sanitizeNumber(camX[0]), sanitizeNumber(camY[0]));
    for (let i = 1; i < camX.length; i++) {
      ctx.lineTo(sanitizeNumber(camX[i]), sanitizeNumber(camY[i]));
    }
    ctx.closePath();
    ctx.fillStyle = C.camProfile;
    ctx.fill();
    ctx.strokeStyle = C.camProfile;
    ctx.lineWidth = LINE_WIDTH.medium;
    ctx.stroke();
  }

  // Draw center point
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = C.center;
  ctx.fill();

  // Draw follower
  const isOscillating =
    params.follower_type === FollowerType.OscillatingRoller ||
    params.follower_type === FollowerType.OscillatingFlatFaced;

  if (isOscillating) {
    drawOscillatingFollower(ctx, frame, params);
  } else {
    drawTranslatingFollower(ctx, frame, params);
  }

  // Draw pressure angle line
  if (Number.isFinite(frame.pressureAngle)) {
    drawPressureAngleLine(ctx, frame);
  }

  ctx.restore();
}

type FramePoint = {
  followerX: number;
  followerY: number;
  pressureAngle: number;
};

function drawTranslatingFollower(
  ctx: CanvasRenderingContext2D,
  frame: FramePoint,
  params: CamParams
) {
  const fx = sanitizeNumber(frame.followerX);
  const fy = sanitizeNumber(frame.followerY);

  if (params.follower_type === FollowerType.TranslatingFlatFaced) {
    // Flat-faced follower
    const halfWidth = params.r_r || 20;
    ctx.beginPath();
    ctx.rect(fx - halfWidth, fy - 2, halfWidth * 2, 4);
    ctx.fillStyle = C.follower;
    ctx.fill();
    ctx.strokeStyle = C.follower;
    ctx.lineWidth = LINE_WIDTH.thin;
    ctx.stroke();

    // Follower stem
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy - params.h);
    ctx.strokeStyle = C.follower;
    ctx.lineWidth = LINE_WIDTH.medium;
    ctx.stroke();
  } else if (params.follower_type === FollowerType.TranslatingKnifeEdge) {
    // Knife-edge follower
    ctx.beginPath();
    ctx.arc(fx, fy, 2, 0, Math.PI * 2);
    ctx.fillStyle = C.follower;
    ctx.fill();

    // Follower stem
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy - params.h);
    ctx.strokeStyle = C.follower;
    ctx.lineWidth = LINE_WIDTH.medium;
    ctx.stroke();
  } else {
    // Roller follower
    const rr = sanitizeNumber(params.r_r);
    ctx.beginPath();
    ctx.arc(fx, fy, rr, 0, Math.PI * 2);
    ctx.fillStyle = C.follower;
    ctx.fill();
    ctx.strokeStyle = C.follower;
    ctx.lineWidth = LINE_WIDTH.thin;
    ctx.stroke();

    // Follower stem
    ctx.beginPath();
    ctx.moveTo(fx, fy - rr);
    ctx.lineTo(fx, fy - params.h);
    ctx.strokeStyle = C.follower;
    ctx.lineWidth = LINE_WIDTH.medium;
    ctx.stroke();
  }
}

function drawOscillatingFollower(
  ctx: CanvasRenderingContext2D,
  frame: FramePoint,
  params: CamParams
) {
  const fx = sanitizeNumber(frame.followerX);
  const fy = sanitizeNumber(frame.followerY);
  const px = -sanitizeNumber(params.pivot_distance);
  const py = 0;

  // Draw pivot point
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fillStyle = C.support;
  ctx.fill();

  if (params.follower_type === FollowerType.OscillatingFlatFaced) {
    // Flat-faced oscillating follower
    const halfWidth = params.r_r || 20;
    const angle = Math.atan2(fy - py, fx - px);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(fx - halfWidth * cos, fy - halfWidth * sin);
    ctx.lineTo(fx + halfWidth * cos, fy + halfWidth * sin);
    ctx.strokeStyle = C.follower;
    ctx.lineWidth = LINE_WIDTH.medium;
    ctx.stroke();

    // Arm from pivot to follower
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(fx, fy);
    ctx.strokeStyle = C.support;
    ctx.lineWidth = LINE_WIDTH.thin;
    ctx.stroke();
  } else {
    // Roller oscillating follower
    const rr = sanitizeNumber(params.r_r);
    ctx.beginPath();
    ctx.arc(fx, fy, rr, 0, Math.PI * 2);
    ctx.fillStyle = C.follower;
    ctx.fill();
    ctx.strokeStyle = C.follower;
    ctx.lineWidth = LINE_WIDTH.thin;
    ctx.stroke();

    // Arm from pivot to roller center
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(fx, fy);
    ctx.strokeStyle = C.support;
    ctx.lineWidth = LINE_WIDTH.thin;
    ctx.stroke();
  }
}

function drawPressureAngleLine(
  ctx: CanvasRenderingContext2D,
  frame: FramePoint
) {
  const fx = sanitizeNumber(frame.followerX);
  const fy = sanitizeNumber(frame.followerY);

  // Draw pressure angle indicator at follower contact point
  const normalLen = 30;

  // Normal direction: from cam center to follower contact point
  const dist = Math.sqrt(fx * fx + fy * fy) || 1;
  const nx = fx / dist;
  const ny = fy / dist;

  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + nx * normalLen, fy + ny * normalLen);
  ctx.strokeStyle = C.normal;
  ctx.lineWidth = LINE_WIDTH.thin;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tangent line (perpendicular to normal)
  const tx = -ny;
  const ty = nx;
  ctx.beginPath();
  ctx.moveTo(fx - tx * normalLen, fy - ty * normalLen);
  ctx.lineTo(fx + tx * normalLen, fy + ty * normalLen);
  ctx.strokeStyle = C.tangent;
  ctx.lineWidth = LINE_WIDTH.thin;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
}
