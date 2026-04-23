import type { CamParams } from '../types';

/// 默认凸轮设计参数
export const defaultParams: CamParams = {
  delta_0: 90,
  delta_01: 60,
  delta_ret: 120,
  delta_02: 90,
  h: 10.0,
  r_0: 40.0,
  e: 5.0,
  omega: 1.0,
  r_r: 0.0,
  n_points: 360,
  alpha_threshold: 30.0,
  tc_law: 5,  // 3-4-5 多项式
  hc_law: 6,  // 4-5-6-7 多项式
  sn: 1,
  pz: 1,
};
