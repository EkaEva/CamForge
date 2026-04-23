/**
 * 存储抽象层
 *
 * 提供统一的本地存储访问接口，封装 localStorage 操作。
 * 支持隐私模式下的优雅降级。
 */

const STORAGE_PREFIX = 'camforge_';

/**
 * 检查 localStorage 是否可用
 */
function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = isStorageAvailable();

/**
 * 内存存储后备方案
 *
 * 当 localStorage 不可用时（如隐私模式），使用内存存储。
 */
const memoryStorage: Map<string, string> = new Map();

/**
 * 存储接口
 */
export const storage = {
  /**
   * 获取存储值
   *
   * @param key - 存储键名（不含前缀）
   * @param defaultValue - 默认值
   * @returns 存储值或默认值
   */
  get<T>(key: string, defaultValue: T): T {
    const fullKey = STORAGE_PREFIX + key;
    try {
      const item = storageAvailable
        ? localStorage.getItem(fullKey)
        : memoryStorage.get(fullKey) ?? null;

      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },

  /**
   * 设置存储值
   *
   * @param key - 存储键名（不含前缀）
   * @param value - 要存储的值
   * @returns 是否成功
   */
  set<T>(key: string, value: T): boolean {
    const fullKey = STORAGE_PREFIX + key;
    try {
      const serialized = JSON.stringify(value);
      if (storageAvailable) {
        localStorage.setItem(fullKey, serialized);
      } else {
        memoryStorage.set(fullKey, serialized);
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 删除存储值
   *
   * @param key - 存储键名（不含前缀）
   */
  remove(key: string): void {
    const fullKey = STORAGE_PREFIX + key;
    if (storageAvailable) {
      localStorage.removeItem(fullKey);
    } else {
      memoryStorage.delete(fullKey);
    }
  },

  /**
   * 清除所有应用相关的存储
   */
  clear(): void {
    if (storageAvailable) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } else {
      memoryStorage.clear();
    }
  },

  /**
   * 获取所有存储键
   *
   * @returns 所有存储键名（不含前缀）
   */
  keys(): string[] {
    const keys: string[] = [];
    if (storageAvailable) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keys.push(k.slice(STORAGE_PREFIX.length));
        }
      }
    } else {
      memoryStorage.forEach((_, k) => {
        if (k.startsWith(STORAGE_PREFIX)) {
          keys.push(k.slice(STORAGE_PREFIX.length));
        }
      });
    }
    return keys;
  },

  /**
   * 检查存储是否可用
   *
   * @returns localStorage 是否可用
   */
  isAvailable(): boolean {
    return storageAvailable;
  },
};

export default storage;
