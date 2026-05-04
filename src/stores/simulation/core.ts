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

/** Reactive cam parameter signal */
export const [params, setParams] = createSignal<CamParams>(defaultParams);

/** Whether undo is available */
export const canUndo = () => paramsHistory.canUndo();
/** Whether redo is available */
export const canRedo = () => paramsHistory.canRedo();

/**
 * Undo the last parameter change and re-run simulation
 * @returns true if undo was performed
 */
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

/**
 * Redo the next parameter change and re-run simulation
 * @returns true if redo was performed
 */
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

/** Reactive display options signal */
export const [displayOptions, setDisplayOptions] = createSignal<DisplayOptions>(defaultDisplayOptions);

/** Reactive simulation data signal */
export const [simulationData, setSimulationData] = createSignal<SimulationData | null>(null);

/** Reactive simulation error signal (NaN/Infinity etc.) */
export const [simulationError, setSimulationError] = createSignal<string | null>(null);

/** Reactive loading state signal */
export const [isLoading, setIsLoading] = createSignal(false);

/** Reactive last simulation run time */
export const [lastRunTime, setLastRunTime] = createSignal<Date | null>(null);

/** Whether parameters have changed since the last run */
export const [paramsChanged, setParamsChanged] = createSignal(false);

/** Whether parameters were updated (for status bar notification) */
export const [paramsUpdated, setParamsUpdated] = createSignal(false);

/** Reactive export status signal */
export const [exportStatus, setExportStatus] = createSignal<{
  type: 'idle' | 'exporting' | 'success' | 'error';
  message: string;
  files?: string[];
}>({ type: 'idle', message: '' });

/** Shared cursor frame index (syncs chart drag with mechanism animation) */
export const [cursorFrame, setCursorFrame] = createSignal(0);

/** Curve visibility toggles (legend click) */
export const [curveVisible, setCurveVisible] = createSignal({ s: true, v: true, a: true });

// 保存上次运行的参数哈希
let lastRunParamsHash = '';

// 计算参数哈希
function getParamsHash(p: CamParams): string {
  return JSON.stringify(p);
}

/**
 * Run the cam simulation with current parameters
 * @throws Handled internally - falls back to local computation on error
 */
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

/**
 * Update a single cam parameter and record to history
 * @param key - Parameter key to update
 * @param value - New value for the parameter
 */
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

/**
 * Update a single display option
 * @param key - Display option key to update
 * @param value - New value for the option
 */
export function updateDisplayOption<K extends keyof DisplayOptions>(key: K, value: DisplayOptions[K]) {
  setDisplayOptions((o) => ({ ...o, [key]: value }));
}
