// 共享响应式图表内边距逻辑

import { createMemo, type Accessor } from 'solid-js';

export interface ChartPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface UseChartPaddingOptions {
  /** 容器宽度 */
  width: Accessor<number>;
  /** 容器高度 */
  height: Accessor<number>;
  /** 是否为暗色模式 */
  isDark?: Accessor<boolean>;
  /** 自定义断点覆盖 */
  breakpoints?: {
    compact?: number;
    regular?: number;
    wide?: number;
  };
}

// 默认断点
const DEFAULT_BREAKPOINTS = {
  compact: 480,
  regular: 768,
  wide: 1024,
};

// 各尺寸的内边距配置
const PADDING_PRESETS = {
  compact: { left: 50, right: 40, top: 40, bottom: 40 },
  regular: { left: 65, right: 50, top: 50, bottom: 50 },
  wide: { left: 75, right: 60, top: 55, bottom: 55 },
};

export function useChartPadding(options: UseChartPaddingOptions): Accessor<ChartPadding> {
  const { width, height, breakpoints } = options;
  const bp = { ...DEFAULT_BREAKPOINTS, ...breakpoints };

  return createMemo(() => {
    const w = width();
    const h = height();

    // 根据容器宽度选择内边距预设
    let preset: ChartPadding;
    if (w < bp.compact!) {
      preset = PADDING_PRESETS.compact;
    } else if (w < bp.regular!) {
      preset = PADDING_PRESETS.regular;
    } else {
      preset = PADDING_PRESETS.wide;
    }

    // 高度较小时进一步缩减
    if (h < 300) {
      return {
        left: Math.round(preset.left * 0.8),
        right: Math.round(preset.right * 0.8),
        top: Math.round(preset.top * 0.7),
        bottom: Math.round(preset.bottom * 0.7),
      };
    }

    return { ...preset };
  });
}
