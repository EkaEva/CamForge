// CamForge-Next TypeScript 类型定义

/// 凸轮设计参数
export interface CamParams {
  delta_0: number;        // 推程运动角 (度)
  delta_01: number;       // 远休止角 (度)
  delta_ret: number;      // 回程运动角 (度)
  delta_02: number;       // 近休止角 (度)
  h: number;              // 推杆最大位移 (mm)
  r_0: number;            // 基圆半径 (mm)
  e: number;              // 偏距 (mm)
  omega: number;          // 凸轮角速度 (rad/s)
  r_r: number;            // 滚子半径 (mm)
  n_points: number;       // 离散点数
  alpha_threshold: number;// 压力角阈值 (度)
  tc_law: number;         // 推程运动规律 (1-6)
  hc_law: number;         // 回程运动规律 (1-6)
  sn: number;             // 旋向符号 (+1 顺时针, -1 逆时针)
  pz: number;             // 偏距符号 (+1 正偏距, -1 负偏距)
}

/// 完整模拟数据
export interface SimulationData {
  delta_deg: number[];
  s: number[];
  v: number[];
  a: number[];
  ds_ddelta: number[];
  phase_bounds: number[];
  x: number[];
  y: number[];
  x_actual: number[];
  y_actual: number[];
  rho: number[];           // 理论轮廓曲率半径
  rho_actual: number[];    // 实际轮廓曲率半径（滚子从动件）
  alpha_all: number[];
  s_0: number;
  r_max: number;
  max_alpha: number;
  min_rho: number | null;
  min_rho_idx: number;
  min_rho_actual: number | null;  // 实际轮廓最小曲率半径
  min_rho_actual_idx: number;
  h: number;
}

/// 显示选项
export interface DisplayOptions {
  showTangent: boolean;
  showNormal: boolean;
  showPressureArc: boolean;
  showCenterLine: boolean;
  showBaseCircle: boolean;
  showOffsetCircle: boolean;
  showUpperLimit: boolean;
  showLowerLimit: boolean;
  showNodes: boolean;
  showBoundaries: boolean;
}
