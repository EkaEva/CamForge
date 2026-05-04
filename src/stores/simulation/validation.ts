import type { CamParams } from '../../types';
import { FollowerType } from '../../types';
import { params } from './core';

/**
 * Validate cam parameters and return errors
 * @param p - Cam design parameters to validate
 * @returns Object with valid flag and array of error messages
 */
export function validateParams(p: CamParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 四角之和必须等于 360°
  const sum = p.delta_0 + p.delta_01 + p.delta_ret + p.delta_02;
  if (Math.abs(sum - 360) > 0.01) {
    errors.push(`四角之和必须等于 360°（当前: ${sum}°）`);
  }

  // 基圆半径必须大于偏距
  if (p.r_0 <= Math.abs(p.e)) {
    errors.push('基圆半径必须大于偏距的绝对值');
  }

  // 行程必须为正
  if (p.h <= 0) {
    errors.push('行程必须为正数');
  }

  // 角速度必须为正
  if (p.omega <= 0) {
    errors.push('角速度必须为正数');
  }

  // 离散点数范围验证
  if (p.n_points < 36) {
    errors.push('离散点数不能小于 36');
  }
  if (p.n_points > 720) {
    errors.push('离散点数不能大于 720');
  }

  // 摆动从动件专用参数验证
  const isOscillating = p.follower_type === FollowerType.OscillatingRoller || p.follower_type === FollowerType.OscillatingFlatFaced;
  if (isOscillating) {
    if (p.arm_length <= 0) {
      errors.push('摆动从动件臂长必须为正数');
    }
    if (p.pivot_distance <= 0) {
      errors.push('枢轴距离必须为正数');
    }
    if (p.arm_length + p.h > p.pivot_distance) {
      errors.push('臂长 + 行程必须 ≤ 枢轴距离');
    }
    if (Math.abs(p.e) > Number.EPSILON) {
      errors.push('摆动从动件偏距必须为 0');
    }
  }

  // 尖底和平底从动件不允许设置滚子半径
  const needsRoller = p.follower_type === FollowerType.TranslatingRoller || p.follower_type === FollowerType.OscillatingRoller;
  if (!needsRoller && p.r_r > 0) {
    errors.push(`${p.follower_type === FollowerType.TranslatingKnifeEdge ? '尖底' : '平底'}从动件不需要滚子半径`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get current parameter validation errors (reactive)
 * @returns Array of validation error messages
 */
export function validationErrors(): string[] {
  return validateParams(params()).errors;
}

/**
 * Get the set of parameter keys that have validation errors (reactive, for input highlighting)
 * @returns Set of CamParams keys that are currently invalid
 */
export function invalidParams(): Set<keyof CamParams> {
  const p = params();
  const invalid = new Set<keyof CamParams>();

  const sum = p.delta_0 + p.delta_01 + p.delta_ret + p.delta_02;
  if (Math.abs(sum - 360) > 0.01) {
    invalid.add('delta_0');
    invalid.add('delta_01');
    invalid.add('delta_ret');
    invalid.add('delta_02');
  }

  if (p.r_0 <= Math.abs(p.e)) {
    invalid.add('r_0');
    invalid.add('e');
  }

  if (p.h <= 0) {
    invalid.add('h');
  }

  if (p.omega <= 0) {
    invalid.add('omega');
  }

  if (p.n_points < 36 || p.n_points > 720) {
    invalid.add('n_points');
  }

  const isOscillating = p.follower_type === FollowerType.OscillatingRoller || p.follower_type === FollowerType.OscillatingFlatFaced;
  if (isOscillating) {
    if (p.arm_length <= 0) invalid.add('arm_length');
    if (p.pivot_distance <= 0) invalid.add('pivot_distance');
    if (p.arm_length + p.h > p.pivot_distance) {
      invalid.add('arm_length');
      invalid.add('pivot_distance');
    }
    if (Math.abs(p.e) > Number.EPSILON) invalid.add('e');
  }

  return invalid;
}
