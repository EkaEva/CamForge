import type { CamParams } from '../../types';
import { FollowerType } from '../../types';
import { params, setParams, setParamsChanged, setParamsUpdated, runSimulation, simulationData } from './core';

// 随机生成可运行的参数（仅运动参数和几何参数，仿真设置保持不变）
export async function randomizeParams(): Promise<CamParams> {
  const currentParams = params();
  const isOscillating = currentParams.follower_type === FollowerType.OscillatingRoller
    || currentParams.follower_type === FollowerType.OscillatingFlatFaced;
  const isFlatFaced = currentParams.follower_type === FollowerType.TranslatingFlatFaced
    || currentParams.follower_type === FollowerType.OscillatingFlatFaced;

  // 随机生成四角（确保和为360°且每个角至少15°）
  const minAngle = 15;

  let delta_0 = Math.floor(Math.random() * 100) + minAngle; // 15-115
  let delta_01 = Math.floor(Math.random() * 80) + minAngle; // 15-95
  let delta_ret = Math.floor(Math.random() * 100) + minAngle; // 15-115

  let delta_02 = 360 - delta_0 - delta_01 - delta_ret;

  if (delta_02 < minAngle) {
    const excess = minAngle - delta_02;
    delta_0 = Math.max(minAngle, delta_0 - Math.ceil(excess / 3));
    delta_01 = Math.max(minAngle, delta_01 - Math.ceil(excess / 3));
    delta_ret = Math.max(minAngle, delta_ret - Math.ceil(excess / 3));
    delta_02 = 360 - delta_0 - delta_01 - delta_ret;
  }

  // 随机运动规律 (1-6)
  const tc_law = Math.floor(Math.random() * 6) + 1;
  const hc_law = Math.floor(Math.random() * 6) + 1;

  // 随机旋向
  const sn = Math.random() > 0.5 ? 1 : -1;

  let h: number, r_0: number, e: number, r_r: number;
  let arm_length: number, pivot_distance: number, initial_angle: number, gamma: number;

  if (isOscillating) {
    // 摆动从动件：用角量参数
    e = 0;
    r_r = currentParams.follower_type === FollowerType.OscillatingRoller
      ? Math.round((Math.random() * 5 + 3) * 10) / 10  // 3-8
      : 0;

    // 随机摆杆几何
    arm_length = Math.floor(Math.random() * 40) + 60; // 60-100
    const psi_max = Math.floor(Math.random() * 30) + 10; // 10-40°
    h = Math.round(psi_max * arm_length * Math.PI / 180 * 100) / 100; // 换算为 mm
    pivot_distance = arm_length + h + Math.floor(Math.random() * 30) + 10; // 留余量
    initial_angle = Math.floor(Math.random() * 40) + 10; // 10-50°
    gamma = Math.floor(Math.random() * 72) * 5; // 0-360°，步长 5°
    r_0 = Math.floor(Math.random() * 20) + 20; // 20-40
  } else {
    // 直动从动件
    e = Math.round((Math.random() * 16 - 8) * 10) / 10; // -8 到 8
    r_0 = Math.floor(Math.random() * 30) + Math.abs(e) + 25;
    h = Math.round((Math.random() * 15 + 5) * 10) / 10; // 5-20
    r_r = currentParams.follower_type === FollowerType.TranslatingRoller
      ? Math.round((Math.random() * 5 + 3) * 10) / 10  // 3-8
      : 0;
    arm_length = currentParams.arm_length;
    pivot_distance = currentParams.pivot_distance;
    initial_angle = currentParams.initial_angle;
    gamma = currentParams.gamma;
  }

  // 平底从动件：约束 h 使 d²s/dδ²_max < r_0（避免干涉）
  if (isFlatFaced) {
    const delta0Rad = delta_0 * Math.PI / 180;
    const maxH = r_0 * delta0Rad * delta0Rad / 4 * 0.8; // 安全系数 0.8
    h = Math.min(h, Math.max(1, Math.round(maxH * 10) / 10));
    // 摆动平底：重新确保 pivot_distance 约束
    if (isOscillating && arm_length + h > pivot_distance) {
      pivot_distance = arm_length + h + 10;
    }
  }

  const newParams: CamParams = {
    delta_0,
    delta_01,
    delta_ret,
    delta_02,
    h,
    r_0,
    e,
    omega: currentParams.omega, // 保持不变
    r_r,
    n_points: currentParams.n_points, // 保持不变
    alpha_threshold: currentParams.alpha_threshold, // 保持不变
    tc_law,
    hc_law,
    sn,
    pz: isOscillating ? 1 : (Math.random() > 0.5 ? 1 : -1), // 摆动时 e=0，pz 无实际意义
    follower_type: currentParams.follower_type, // 保持不变
    arm_length,
    pivot_distance,
    initial_angle,
    gamma,
    flat_face_offset: 0,
  };

  setParams(newParams);
  setParamsChanged(true);
  setParamsUpdated(true);
  await runSimulation();

  // 平底从动件：确保凸轮轮廓为凸（无凹区域），否则增大 r_0 重试
  if (isFlatFaced) {
    let attempts = 0;
    while (simulationData()?.has_concave_region && attempts < 10) {
      attempts++;
      const adjustedParams = { ...newParams, r_0: newParams.r_0 + 5 * attempts };
      setParams(adjustedParams);
      setParamsChanged(true);
      setParamsUpdated(true);
      await runSimulation();
    }
  }

  return params();
}
