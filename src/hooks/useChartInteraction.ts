// 共享图表交互逻辑：鼠标悬停、光标定位、帧索引计算

import { createSignal, type Accessor } from 'solid-js';
import { simulationData, setCursorFrame } from '../stores/simulation';

export interface ChartPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface UseChartInteractionOptions {
  /** 获取 canvas 元素的 ref */
  canvasRef: Accessor<HTMLCanvasElement | undefined>;
  /** 图表内边距 */
  padding: Accessor<ChartPadding>;
  /** X 轴数据范围（如 0-360） */
  xRange: Accessor<[number, number]>;
  /** 是否启用交互 */
  enabled?: Accessor<boolean>;
}

export interface ChartInteractionResult {
  /** 鼠标悬停时的 X 坐标（相对于 canvas），-1 表示未悬停 */
  hoverX: Accessor<number>;
  /** 鼠标悬停时的 Y 坐标（相对于 canvas），-1 表示未悬停 */
  hoverY: Accessor<number>;
  /** 是否正在悬停 */
  isHovering: Accessor<boolean>;
  /** 根据鼠标 X 位置计算对应的帧索引 */
  getFrameFromX: (clientX: number) => number;
  /** 鼠标移动处理器，绑定到 canvas 的 onmousemove */
  handleMouseMove: (e: MouseEvent) => void;
  /** 鼠标离开处理器，绑定到 canvas 的 onmouseleave */
  handleMouseLeave: () => void;
  /** 触摸移动处理器 */
  handleTouchMove: (e: TouchEvent) => void;
  /** 触摸结束处理器 */
  handleTouchEnd: () => void;
}

export function useChartInteraction(options: UseChartInteractionOptions): ChartInteractionResult {
  const { canvasRef, padding, xRange, enabled } = options;

  const [hoverX, setHoverX] = createSignal(-1);
  const [hoverY, setHoverY] = createSignal(-1);
  const [isHovering, setIsHovering] = createSignal(false);

  const getFrameFromX = (clientX: number): number => {
    const canvas = canvasRef();
    if (!canvas) return -1;

    const data = simulationData();
    if (!data?.s?.length) return -1;

    const rect = canvas.getBoundingClientRect();
    const p = padding();
    const chartWidth = canvas.width - p.left - p.right;
    const mouseX = clientX - rect.left;
    const [xMin, xMax] = xRange();

    // 将鼠标 X 位置映射到数据范围
    const dataX = xMin + ((mouseX - p.left) / chartWidth) * (xMax - xMin);
    if (dataX < xMin || dataX > xMax) return -1;

    // 找到最近的帧索引
    const n = data.s.length;
    const frameIndex = Math.round(((dataX - xMin) / (xMax - xMin)) * (n - 1));
    return Math.max(0, Math.min(n - 1, frameIndex));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (enabled && !enabled()) return;

    const canvas = canvasRef();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const p = padding();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 检查是否在图表区域内
    if (mouseX >= p.left && mouseX <= canvas.width - p.right &&
        mouseY >= p.top && mouseY <= canvas.height - p.bottom) {
      setHoverX(mouseX);
      setHoverY(mouseY);
      setIsHovering(true);

      const frame = getFrameFromX(e.clientX);
      if (frame >= 0) {
        setCursorFrame(frame);
      }
    } else {
      setHoverX(-1);
      setHoverY(-1);
      setIsHovering(false);
    }
  };

  const handleMouseLeave = () => {
    setHoverX(-1);
    setHoverY(-1);
    setIsHovering(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const canvas = canvasRef();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const p = padding();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    if (mouseX >= p.left && mouseX <= canvas.width - p.right &&
        mouseY >= p.top && mouseY <= canvas.height - p.bottom) {
      setHoverX(mouseX);
      setHoverY(mouseY);
      setIsHovering(true);

      const frame = getFrameFromX(touch.clientX);
      if (frame >= 0) {
        setCursorFrame(frame);
      }
    }
  };

  const handleTouchEnd = () => {
    setHoverX(-1);
    setHoverY(-1);
    setIsHovering(false);
  };

  return {
    hoverX,
    hoverY,
    isHovering,
    getFrameFromX,
    handleMouseMove,
    handleMouseLeave,
    handleTouchMove,
    handleTouchEnd,
  };
}
