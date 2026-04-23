/**
 * 数组工具函数
 *
 * 提供安全的数组操作函数，避免使用展开运算符导致的栈溢出问题。
 */

/**
 * 安全地计算数组最大值
 *
 * 使用 reduce 替代 Math.max(...arr)，避免大数组导致的栈溢出。
 *
 * @param arr - 数值数组
 * @returns 数组中的最大值，空数组返回 -Infinity
 *
 * @example
 * ```ts
 * const max = arrayMax([1, 5, 3, 9, 2]); // 9
 * const emptyMax = arrayMax([]); // -Infinity
 * ```
 */
export function arrayMax(arr: number[]): number {
  return arr.reduce((max, val) => Math.max(max, val), -Infinity);
}

/**
 * 安全地计算数组最小值
 *
 * 使用 reduce 替代 Math.min(...arr)，避免大数组导致的栈溢出。
 *
 * @param arr - 数值数组
 * @returns 数组中的最小值，空数组返回 Infinity
 */
export function arrayMin(arr: number[]): number {
  return arr.reduce((min, val) => Math.min(min, val), Infinity);
}

/**
 * 安全地计算数组元素变换后的最大值
 *
 * @param arr - 源数组
 * @param fn - 变换函数，可选带索引参数
 * @returns 变换后值的最大值
 *
 * @example
 * ```ts
 * const maxAbs = arrayMaxBy([-1, 5, -3], Math.abs); // 5
 * const maxWithIndex = arrayMaxBy([1, 2, 3], (v, i) => v * i); // 6 (3*2)
 * ```
 */
export function arrayMaxBy<T>(arr: T[], fn: (item: T, index: number) => number): number {
  return arr.reduce((max, item, index) => Math.max(max, fn(item, index)), -Infinity);
}

/**
 * 安全地计算数组元素变换后的最小值
 *
 * @param arr - 源数组
 * @param fn - 变换函数，可选带索引参数
 * @returns 变换后值的最小值
 */
export function arrayMinBy<T>(arr: T[], fn: (item: T, index: number) => number): number {
  return arr.reduce((min, item, index) => Math.min(min, fn(item, index)), Infinity);
}

/**
 * 计算数组的绝对值最大值
 *
 * @param arr - 数值数组
 * @returns 绝对值最大的元素
 */
export function arrayMaxAbs(arr: number[]): number {
  return arr.reduce((max, val) => Math.max(max, Math.abs(val)), 0);
}

/**
 * 计算数组的和
 *
 * @param arr - 数值数组
 * @returns 数组元素之和
 */
export function arraySum(arr: number[]): number {
  return arr.reduce((sum, val) => sum + val, 0);
}

/**
 * 计算数组的平均值
 *
 * @param arr - 数值数组
 * @returns 平均值，空数组返回 0
 */
export function arrayMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arraySum(arr) / arr.length;
}

/**
 * 过滤数组中的有限值
 *
 * @param arr - 数值数组
 * @returns 只包含有限值的数组
 */
export function filterFinite(arr: number[]): number[] {
  return arr.filter(isFinite);
}

/**
 * 查找数组中满足条件的元素索引
 *
 * @param arr - 数组
 * @param predicate - 条件函数
 * @returns 第一个满足条件的索引，未找到返回 -1
 */
export function findIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}
