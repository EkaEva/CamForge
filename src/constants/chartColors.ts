// 图表颜色主题常量 — 所有图表颜色引用的单一来源

// 运动曲线颜色
export const MOTION_COLORS = {
  displacement: '#DC2626',    // 位移 s — 红色
  velocity: '#2563EB',        // 速度 v — 蓝色
  acceleration: '#16A34A',    // 加速度 a — 绿色
} as const;

// 压力角颜色
export const PRESSURE_ANGLE_COLORS = {
  curve: '#DC2626',           // 压力角曲线 — 红色
  threshold: '#F59E0B',       // 阈值线 — 琥珀色
  exceedPoint: '#EF4444',     // 超限点 — 红色
} as const;

// 曲率半径颜色
export const CURVATURE_COLORS = {
  theoryRho: '#DC2626',       // 理论轮廓曲率 — 红色
  actualRho: '#3B82F6',       // 实际轮廓曲率 — 蓝色
  threshold: '#06B6D4',       // 滚子半径阈值 — 青色
  minRhoPoint: '#16A34A',     // 理论最小曲率点 — 绿色
  minRhoActualPoint: '#F97316', // 实际最小曲率点 — 橙色
  undercutZone: '#EF4444',    // 根切区域 — 红色
} as const;

// 凸轮廓形颜色
export const CAM_PROFILE_COLORS = {
  theoryProfile: '#DC2626',   // 理论廓形 — 红色
  actualProfile: '#2563EB',   // 实际廓形 — 蓝色
  baseCircle: '#9CA3AF',      // 基圆 — 灰色
  offsetCircle: '#6B7280',    // 偏距圆 — 深灰
} as const;

// 动画颜色
export const ANIMATION_COLORS = {
  camProfile: '#EF4444',      // 凸轮轮廓 — 红色
  follower: '#4B5563',        // 推杆 — 灰色
  tangent: '#10B981',         // 切线 — 绿色
  normal: '#F59E0B',          // 法线 — 琥珀色
  pressureArc: '#4B5563',     // 压力角弧 — 灰色
  lowerLimit: '#06B6D4',      // 下极限 — 青色
  upperLimit: '#D946EF',      // 上极限 — 紫色
  boundary: '#9CA3AF',        // 相位边界 — 灰色
  center: '#111827',          // 中心点 — 深色
  support: '#4B5563',         // 支座 — 灰色
} as const;

// 通用颜色
export const CHART_COLORS = {
  // 网格线
  gridLight: 'rgba(0,0,0,0.1)',
  gridDark: 'rgba(255,255,255,0.1)',
  // 相位分界线
  phaseBoundLight: '#999',
  phaseBoundDark: '#666',
  // 坐标轴
  axisLight: '#333',
  axisDark: '#555',
  // 文字
  textLight: '#333',
  textDark: '#FFF',
  textSecondaryLight: '#CCC',
  textSecondaryDark: '#CCC',
  // 背景
  bgLight: '#FFFFFF',
  bgDark: '#1C1C1E',
} as const;

// 线型
export const LINE_STYLES = {
  solid: [] as number[],
  dashed: [6, 4] as number[],
  dashdot: [8, 4, 2, 4] as number[],
  dotted: [2, 2] as number[],
} as const;
