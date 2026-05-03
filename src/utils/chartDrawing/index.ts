// Re-export everything from sub-modules for backward compatibility
// Consumers can still import from 'utils/chartDrawing' as before

// Shared types and utilities
export {
  type ChartDrawOptions,
  type AnimationFrameOptions,
  DEFAULT_DPI,
  MAX_DPI,
  MAX_DIMENSION,
  tr,
  sanitizeNumber,
  validateChartData,
  normalizeChartOptions,
  validateAnimationFrameOptions,
  getScaleFactor,
} from './common';

// Tooltip rendering utilities
export {
  drawTooltipLine,
  drawTooltipPoint,
  drawTooltipBox,
  drawChartBackground,
  type TooltipLineConfig,
  type TooltipPointConfig,
  type TooltipBoxConfig,
} from './tooltip';

// Motion curves chart
export { drawMotionCurves } from './motionCurves';

// Pressure angle chart
export { drawPressureAngleChart } from './pressureAngle';

// Curvature radius chart
export { drawCurvatureChart } from './curvature';

// Cam profile chart
export { drawCamProfileChart } from './camProfile';

// Animation frame
export { drawAnimationFrame } from './animation';
