/**
 * 防抖与节流工具函数
 */

/**
 * 防抖函数
 *
 * 延迟执行函数，在等待期间如果再次调用则重新计时。
 * 适用于频繁触发但只需要最后一次结果的场景。
 *
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 *
 * @example
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   fetchResults(query);
 * }, 300);
 *
 * // 快速输入时只在最后一次输入后 300ms 执行
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 异步防抖函数
 *
 * 返回 Promise，在延迟后执行并返回结果。
 *
 * @param fn - 要防抖的异步函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数，返回 Promise
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastResolve: ((value: any) => void) | null = null;
  let lastReject: ((reason: any) => void) | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      lastResolve = resolve;
      lastReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          lastResolve?.(result);
        } catch (error) {
          lastReject?.(error);
        }
        timeoutId = null;
      }, delay);
    });
  };
}

/**
 * 节流函数
 *
 * 限制函数在指定时间间隔内只执行一次。
 * 适用于需要持续响应但不能太频繁的场景。
 *
 * @param fn - 要节流的函数
 * @param interval - 时间间隔（毫秒）
 * @returns 节流后的函数
 *
 * @example
 * ```ts
 * const throttledScroll = throttle((pos) => {
 *   updateUI(pos);
 * }, 100);
 *
 * // 滚动时最多每 100ms 执行一次
 * window.addEventListener('scroll', () => throttledScroll(scrollY));
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn(...args);
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}

/**
 * 带立即执行选项的防抖函数
 *
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @param immediate - 是否在首次调用时立即执行
 * @returns 防抖后的函数
 */
export function debounceWithImmediate<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  immediate: boolean
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const callNow = immediate && timeoutId === null;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        fn(...args);
      }
    }, delay);

    if (callNow) {
      fn(...args);
    }
  };
}
