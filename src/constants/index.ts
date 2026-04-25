// Re-export all constant modules

// Abbreviation reference:
//   tc_law = Translating Cam law (推程运动规律) - motion law for the rise phase
//   hc_law = Returning Cam law (回程运动规律) - motion law for the return phase
//   sn = Spin direction (旋向: 1=顺时针/clockwise, -1=逆时针/counterclockwise)
//   pz = offset direction (偏距方向: 1=正偏距/positive offset, -1=负偏距/negative offset)

export { defaultParams } from './cam';
export { defaultDisplayOptions } from './display';
export { motionLawOptions } from './motion-laws';
export { DATA_RANGE_MARGIN, PERCENTILE_CLIP_LOW, PERCENTILE_CLIP_HIGH, PERCENTILE_CLIP_MID_LOW, PERCENTILE_CLIP_MID_HIGH, EPSILON, TARGET_FPS, MAX_UNDO_STEPS } from './numeric';
