/**
 * Tauri 环境工具函数
 *
 * 提供类型安全的 Tauri API 访问。
 */

/**
 * 检查是否在 Tauri 环境中运行
 *
 * @returns 如果在 Tauri WebView 中运行则返回 true
 */
export function isTauriEnv(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * 类型安全的 Tauri invoke 调用
 *
 * @param cmd - 命令名称
 * @param args - 命令参数
 * @returns 命令执行结果
 * @throws 如果不在 Tauri 环境中或命令执行失败
 *
 * @example
 * ```ts
 * const data = await invokeTauri<SimulationData>('run_simulation', { params });
 * ```
 */
export async function invokeTauri<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauriEnv()) {
    throw new Error('Not in Tauri environment');
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke(cmd, args) as Promise<T>;
}

/**
 * 动态导入 Tauri API
 *
 * 用于需要使用完整 Tauri API 的场景。
 *
 * @returns Tauri API 模块
 * @throws 如果不在 Tauri 环境中
 */
export async function getTauriApi() {
  if (!isTauriEnv()) {
    throw new Error('Not in Tauri environment');
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return { invoke };
}

/**
 * 安全的 Tauri 调用包装器
 *
 * 如果不在 Tauri 环境中，返回 fallback 值而不抛出错误。
 *
 * @param cmd - 命令名称
 * @param args - 命令参数
 * @param fallback - 非 Tauri 环境下的回退值
 * @returns 命令结果或回退值
 */
export async function safeInvokeTauri<T>(
  cmd: string,
  args: Record<string, unknown> | undefined,
  fallback: T
): Promise<T> {
  if (!isTauriEnv()) {
    return fallback;
  }

  try {
    return await invokeTauri<T>(cmd, args);
  } catch (error) {
    console.warn(`Tauri command '${cmd}' failed:`, error);
    return fallback;
  }
}

export default {
  isTauriEnv,
  invokeTauri,
  getTauriApi,
  safeInvokeTauri,
};
