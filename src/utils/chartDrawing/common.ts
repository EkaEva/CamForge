// Shared types, constants, i18n fallbacks, and utility functions for chart drawing

import type { SimulationData, CamParams, DisplayOptions } from '../../types';
import type { Translation } from '../../i18n/translations';

export interface ChartDrawOptions {
  width: number;
  height: number;
  isDark: boolean;
  lang: string;
  dpi?: number;
  translations?: Translation;
}

export interface AnimationFrameOptions {
  width: number;
  height: number;
  frameIndex: number;
  displayOptions: DisplayOptions;
  zoom: number;
  lang?: string;
}

// 默认 DPI（屏幕显示）
export const DEFAULT_DPI = 100;

// DPI 上限保护
export const MAX_DPI = 600;
export const MAX_DIMENSION = 10000;

// i18n fallback strings (used when translations object is not provided)
const zhFallback = {
  motionTitle: '推杆运动线图',
  pressureTitle: '压力角曲线',
  curvatureTitle: '曲率半径曲线',
  angleX: '转角 δ (°)',
  displacementY: '位移 s (mm)',
  velocityY: '速度 v (mm/s)',
  accelerationY: '加速度 a (mm/s²)',
  pressureY: '压力角 α (°)',
  curvatureY: '曲率半径 ρ (mm)',
  displacement: '位移 s',
  velocity: '速度 v',
  acceleration: '加速度 a',
  pressureAngle: '压力角 α',
  theoryRho: '理论轮廓 ρ',
  actualRho: '实际轮廓 ρₐ',
  threshold: '阈值',
  noData: '无有效曲率数据',
  theoryProfile: '理论廓形',
  actualProfile: '实际廓形',
  baseCircle: '基圆',
  camProfile: '凸轮廓形',
  animAngle: '角度:',
  animDisp: '位移:',
  animAlpha: '压力角:',
};

const enFallback = {
  motionTitle: 'Motion Curves',
  pressureTitle: 'Pressure Angle Curve',
  curvatureTitle: 'Curvature Radius Curve',
  angleX: 'Angle δ (°)',
  displacementY: 'Displacement s (mm)',
  velocityY: 'Velocity v (mm/s)',
  accelerationY: 'Acceleration a (mm/s²)',
  pressureY: 'Pressure Angle α (°)',
  curvatureY: 'Curvature Radius ρ (mm)',
  displacement: 'Displacement s',
  velocity: 'Velocity v',
  acceleration: 'Acceleration a',
  pressureAngle: 'Pressure Angle α',
  theoryRho: 'Theory ρ',
  actualRho: 'Actual ρₐ',
  threshold: 'Threshold',
  noData: 'No valid curvature data',
  theoryProfile: 'Theory Profile',
  actualProfile: 'Actual Profile',
  baseCircle: 'Base Circle',
  camProfile: 'Cam Profile',
  animAngle: 'Angle:',
  animDisp: 'Disp.:',
  animAlpha: 'α:',
};

export function tr(lang: string, key: keyof typeof enFallback, translations?: Translation): string {
  if (translations) {
    const chartKeys: Partial<Record<keyof typeof enFallback, string>> = {
      motionTitle: 'motionTitle',
      pressureTitle: 'pressureTitle',
      curvatureTitle: 'curvatureTitle',
      angleX: 'angleX',
      displacementY: 'displacementY',
      velocityY: 'velocityY',
      accelerationY: 'accelerationY',
      pressureY: 'pressureY',
      curvatureY: 'curvatureY',
      displacement: 'displacement',
      velocity: 'velocity',
      acceleration: 'acceleration',
      pressureAngle: 'pressureAngle',
      theoryRho: 'theoryRho',
      actualRho: 'actualRho',
      threshold: 'threshold',
      noData: 'noData',
    };
    const chartKey = chartKeys[key];
    if (chartKey && chartKey in translations.chart) {
      return (translations.chart as Record<string, string>)[chartKey];
    }
    const specialKeys: Partial<Record<keyof typeof enFallback, string>> = {
      theoryProfile: lang === 'zh' ? '理论廓形' : 'Theory Profile',
      actualProfile: lang === 'zh' ? '实际廓形' : 'Actual Profile',
      baseCircle: translations.sidebar?.cb?.baseCircle ?? (lang === 'zh' ? '基圆' : 'Base Circle'),
      camProfile: translations.tabs?.camProfile ?? (lang === 'zh' ? '凸轮廓形' : 'Cam Profile'),
      animAngle: lang === 'zh' ? '角度:' : 'Angle:',
      animDisp: lang === 'zh' ? '位移:' : 'Disp.:',
      animAlpha: lang === 'zh' ? '压力角:' : 'α:',
    };
    if (key in specialKeys) return specialKeys[key]!;
  }
  return (lang === 'zh' ? zhFallback : enFallback)[key];
}

export function sanitizeNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * 验证图表数据有效性
 *
 * @param data - 模拟数据
 * @returns 数据是否有效
 */
export function validateChartData(data: SimulationData | null | undefined): boolean {
  if (!data) return false;
  if (!data.s?.length || !data.v?.length || !data.a?.length) return false;
  if (!data.delta_deg?.length) return false;
  if (data.s.length !== data.v.length || data.s.length !== data.a.length) return false;
  return true;
}

/**
 * 验证并规范化绘图选项
 *
 * @param options - 绘图选项
 * @returns 规范化后的选项
 */
export function normalizeChartOptions(options: ChartDrawOptions): ChartDrawOptions {
  const dpi = Math.min(options.dpi || DEFAULT_DPI, MAX_DPI);
  const width = Math.min(Math.max(options.width, 1), MAX_DIMENSION);
  const height = Math.min(Math.max(options.height, 1), MAX_DIMENSION);
  return { ...options, dpi, width, height };
}

/**
 * 验证动画帧选项
 *
 * @param options - 动画帧选项
 * @param dataLength - 数据数组长度
 * @returns 选项是否有效
 */
export function validateAnimationFrameOptions(
  options: AnimationFrameOptions,
  dataLength: number
): boolean {
  if (options.width <= 0 || options.height <= 0) return false;
  if (options.frameIndex < 0 || options.frameIndex >= dataLength) return false;
  if (options.zoom <= 0) return false;
  return true;
}

// 计算 DPI 缩放因子
export function getScaleFactor(dpi: number): number {
  return dpi / DEFAULT_DPI;
}

// Re-export types needed by consumers
export type { SimulationData, CamParams, DisplayOptions };
