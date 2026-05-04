import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@solidjs/testing-library';
import { ExportPanel } from '../ExportPanel';

vi.mock('../../../stores/simulation', () => ({
  simulationData: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  generateDXF: vi.fn(),
  generateCSV: vi.fn(),
  generateSVG: vi.fn(),
  generateHighResPNG: vi.fn(),
  generateRealTIFF: vi.fn(),
  generateGIF: vi.fn(),
  generatePresetJSON: vi.fn(),
  generateExcel: vi.fn(),
  saveFile: vi.fn(),
  getCurrentLang: vi.fn(() => 'en'),
  getExportFilename: vi.fn((id) => `camforge_${id}`),
  setExportStatus: vi.fn(),
}));

vi.mock('../../../i18n', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    t: vi.fn(() => ({
      mainCanvas: { clickToStart: 'Click to start' },
      status: { running: 'Running...' },
      export: {
        quickExport: 'Quick Export', customExport: 'Custom Export',
        chartExport: 'Chart Export', animationExport: 'Animation Export',
        dataExport: 'Data Export', imageFormat: 'Image Format',
        animationFormat: 'Animation Format', animationFrames: 'Frames',
        exportAnimation: 'Export Animation', exportSelected: 'Export Selected',
        items: { motion: 'Motion', curvature: 'Curvature', pressure: 'Pressure', profile: 'Profile', animation: 'Animation', preset: 'Preset' },
        charts: { motion: 'Motion', pressure: 'Pressure', curvature: 'Curvature', profile: 'Profile' },
        downloadTip: 'Download tip', generatingAnimation: 'Generating...',
        exporting: 'Exporting...', exportingFile: 'Exporting',
        exported: 'Exported', exportFailed: 'Export failed',
        title: 'Export',
      },
    })),
  };
});

vi.mock('../../../utils/platform', () => ({
  isMobilePlatform: vi.fn(() => false),
  isTauriEnv: vi.fn(() => false),
}));

vi.mock('../../../stores/settings', () => ({
  getDownloadDir: vi.fn(() => ''),
}));

vi.mock('../../ui/Toast', () => ({
  showToast: vi.fn(),
}));

describe('ExportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows fallback when no simulation data', () => {
    const { getByText } = render(() => (
      <ExportPanel
        exporting={() => null}
        setExporting={() => {}}
        exportProgress={() => 0}
        setExportProgress={() => {}}
      />
    ));
    expect(getByText('Click to start')).toBeTruthy();
  });
});