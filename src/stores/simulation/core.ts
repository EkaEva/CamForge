import { createSignal } from 'solid-js';
import type { CamParams, SimulationData, DisplayOptions } from '../../types';
import { defaultParams, defaultDisplayOptions } from '../../constants';
import { isTauriEnv, invokeTauri } from '../../utils/tauri';
import { createHistory, type HistoryActions } from '../history';
import { computeSimulationLocally } from './compute';
import { getApi } from '../../api';

// 检查是否在 Tauri 环境中
const isTauri = isTauriEnv();

// 参数历史管理（撤销/重做）
const paramsHistory: HistoryActions<CamParams> = createHistory(defaultParams);

// 参数状态
export const [params, setParams] = createSignal<CamParams>(defaultParams);

// 撤销/重做操作
export const canUndo = () => paramsHistory.canUndo();
export const canRedo = () => paramsHistory.canRedo();

export function undoParams(): boolean {
  if (paramsHistory.undo()) {
    setParams(() => paramsHistory.state());
    setParamsChanged(true);
    setParamsUpdated(true);
    runSimulation();
    return true;
  }
  return false;
}

export function redoParams(): boolean {
  if (paramsHistory.redo()) {
    setParams(() => paramsHistory.state());
    setParamsChanged(true);
    setParamsUpdated(true);
    runSimulation();
    return true;
  }
  return false;
}

// 显示选项状态
export const [displayOptions, setDisplayOptions] = createSignal<DisplayOptions>(defaultDisplayOptions);

// 模拟数据状态
export const [simulationData, setSimulationData] = createSignal<SimulationData | null>(null);

// 模拟计算错误状态（NaN/Infinity 等）
export const [simulationError, setSimulationError] = createSignal<string | null>(null);

// 加载状态
export const [isLoading, setIsLoading] = createSignal(false);

// 最后运行时间
export const [lastRunTime, setLastRunTime] = createSignal<Date | null>(null);

// 参数是否已更新（需要重新运行）
export const [paramsChanged, setParamsChanged] = createSignal(false);

// 参数更新提示（用于状态栏显示）
export const [paramsUpdated, setParamsUpdated] = createSignal(false);

// 导出状态
export const [exportStatus, setExportStatus] = createSignal<{
  type: 'idle' | 'exporting' | 'success' | 'error';
  message: string;
  files?: string[];
}>({ type: 'idle', message: '' });

// 共享游标帧索引（图表拖动 ↔ 机构动画同步）
export const [cursorFrame, setCursorFrame] = createSignal(0);

// 曲线可见性（图例点击切换）
export const [curveVisible, setCurveVisible] = createSignal({ s: true, v: true, a: true });

// 保存上次运行的参数哈希
let lastRunParamsHash = '';

// 计算参数哈希
function getParamsHash(p: CamParams): string {
  return JSON.stringify(p);
}

// 运行模拟
export async function runSimulation() {
  const currentParams = params();
  setIsLoading(true);

  try {
    if (isTauri) {
      // Tauri 环境：使用 IPC 调用 Rust 后端
      const data = await invokeTauri<SimulationData>('run_simulation', { params: currentParams });
      setSimulationData(data);
      setSimulationError(data.computationError ?? null);
    } else {
      // Web 环境：尝试使用 HTTP API，失败则使用前端计算
      try {
        const api = await getApi();
        const data = await api.runSimulation(currentParams);
        setSimulationData(data);
        setSimulationError(data.computationError ?? null);
      } catch (apiError) {
        console.warn('HTTP API unavailable, using frontend calculation:', apiError);
        await new Promise(resolve => setTimeout(resolve, 100));
        const data = computeSimulationLocally(currentParams);
        setSimulationData(() => data);
        setSimulationError(data.computationError ?? null);
      }
    }
    // 更新状态
    setLastRunTime(new Date());
    lastRunParamsHash = getParamsHash(currentParams);
    setParamsChanged(false);
  } catch (e) {
    console.error('Simulation error:', e);
    // 错误时使用前端计算作为 fallback
    const data = computeSimulationLocally(params());
    setSimulationData(() => data);
    setSimulationError(data.computationError ?? String(e));
  } finally {
    setIsLoading(false);
  }
}

export function updateParam<K extends keyof CamParams>(key: K, value: CamParams[K]) {
  setParams((prev) => {
    const newParams = { ...prev, [key]: value };
    // 记录到历史
    paramsHistory.push(newParams);
    // 检查参数是否与上次运行不同
    if (lastRunParamsHash && getParamsHash(newParams) !== lastRunParamsHash) {
      setParamsChanged(true);
    }
    return newParams;
  });
}

export function updateDisplayOption<K extends keyof DisplayOptions>(key: K, value: DisplayOptions[K]) {
  setDisplayOptions((o) => ({ ...o, [key]: value }));
}
