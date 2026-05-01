// Re-export everything from sub-modules for backward compatibility
// Consumers can still import from 'stores/simulation' as before

// Core signals and state
export {
  params,
  setParams,
  displayOptions,
  setDisplayOptions,
  simulationData,
  setSimulationData,
  isLoading,
  setIsLoading,
  lastRunTime,
  setLastRunTime,
  paramsChanged,
  setParamsChanged,
  paramsUpdated,
  setParamsUpdated,
  exportStatus,
  setExportStatus,
  cursorFrame,
  setCursorFrame,
  curveVisible,
  setCurveVisible,
  canUndo,
  canRedo,
  undoParams,
  redoParams,
  runSimulation,
  updateParam,
  updateDisplayOption,
} from './core';

// Computation
export { computeSimulationLocally } from './compute';

// Exports
export {
  generateDXF,
  generateCSV,
  downloadFile,
  saveFile,
  getCurrentLang,
  getExportFilename,
  generateSVG,
  generateHighResPNG,
  generateTIFF,
  generateRealTIFF,
  generateGIF,
  generateExcel,
  terminateGifWorker,
} from './exports';

// Presets
export {
  savePreset,
  loadPreset,
  getSavedPresets,
  deletePreset,
  generatePresetJSON,
  loadPresetFromJSON,
} from './presets';

// Validation
export {
  validateParams,
  validationErrors,
  invalidParams,
} from './validation';

// Randomize
export { randomizeParams } from './randomize';
