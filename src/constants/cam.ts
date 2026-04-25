import type { CamParams } from '../types';

/// 默认凸轮设计参数
export const defaultParams: CamParams = {
  delta_0: 90,        // 推程运动角 (度)
  delta_01: 60,       // 远休止角 (度)
  delta_ret: 120,     // 回程运动角 (度)
  delta_02: 90,       // 近休止角 (度)
  h: 10.0,            // 推杆最大位移 (mm)
  r_0: 40.0,          // 基圆半径 (mm)
  e: 5.0,             // 偏距 (mm)
  omega: 1.0,         // 凸轮角速度 (rad/s)
  r_r: 0.0,           // 滚子半径 (mm), 0 表示尖底从动件
  n_points: 360,      // 离散点数
  alpha_threshold: 30.0, // 压力角阈值 (度)
  tc_law: 5,  // 推程运动规律 (Translating Cam law) - 3-4-5 多项式
  hc_law: 6,  // 回程运动规律 (Returning Cam law) - 4-5-6-7 多项式
  sn: 1,      // 旋向: 1=顺时针, -1=逆时针 (Spin direction)
  pz: 1,      // 偏距方向: 1=正偏距, -1=负偏距 (offset direction)
};
