import { Show, createSignal, onMount } from 'solid-js';
import { NumberInput, Toggle } from '../controls';
import { params, displayOptions, updateParam, updateDisplayOption, savePreset, loadPreset, getSavedPresets, deletePreset, validateParams, setParams, setParamsChanged, randomizeParams, loadPresetFromJSON, setDisplayOptions, setParamsUpdated, runSimulation } from '../../stores/simulation';
import { t } from '../../i18n';
import { defaultParams, defaultDisplayOptions } from '../../constants';
import { version } from '../../../package.json';
import { Icon } from '../ui/Icon';
import { MotionParamsPanel } from './MotionParamsPanel';
import { FollowerParamsPanel } from './FollowerParamsPanel';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar(props: SidebarProps) {
  const [presets, setPresets] = createSignal<string[]>([]);
  const [presetName, setPresetName] = createSignal('');
  const [loadError, setLoadError] = createSignal<string | null>(null);
  // eslint-disable-next-line no-unassigned-vars
  let fileInputRef: HTMLInputElement | undefined;

  const [expanded, setExpanded] = createSignal<Record<string, boolean>>({
    motion: true,
    geometry: true,
    simulation: false,
    display: false,
    preset: false,
  });
  const togglePanel = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  onMount(() => {
    setPresets(getSavedPresets());
  });

  const validateAndRun = (): boolean => {
    const errors = validateParams(params()).errors;
    if (errors.length === 0) {
      setParamsUpdated(true);
      runSimulation();
      return true;
    }
    return false;
  };

  const handleReset = () => {
    setParams(defaultParams);
    setDisplayOptions(defaultDisplayOptions);
    setParamsChanged(false);
    runSimulation();
  };

  const handleRandomize = () => {
    void randomizeParams();
  };

  const handleSavePreset = () => {
    const name = presetName().trim();
    if (name) {
      savePreset(name);
      setPresets(getSavedPresets());
      setPresetName('');
    }
  };

  const handleLoadPreset = (name: string) => {
    loadPreset(name);
  };

  const handleDeletePreset = (name: string) => {
    deletePreset(name);
    setPresets(getSavedPresets());
  };

  const handleLoadFromFile = () => {
    setLoadError(null);
    fileInputRef?.click();
  };

  const handleFileInputChange = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = loadPresetFromJSON(content);
      if (result.success) {
        setLoadError(null);
      } else {
        setLoadError(result.error || '加载失败');
        setTimeout(() => setLoadError(null), 3000);
      }
    };
    reader.onerror = () => {
      setLoadError('文件读取失败');
      setTimeout(() => setLoadError(null), 3000);
    };
    reader.readAsText(file);
    target.value = '';
  };

  const sidebarClass = () => {
    if (props.isMobile) {
      return `w-72 h-full border-r border-outline-variant flex flex-col shadow-xl
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${props.isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    }
    return 'w-80 h-full bg-chrome-surface border-r border-chrome-border flex flex-col';
  };

  const sidebarStyle = () => {
    if (props.isMobile) {
      return {
        'padding-top': 'env(safe-area-inset-top)',
        'background-color': 'var(--surface-container-lowest)',
      };
    }
    return undefined;
  };

  return (
    <aside class={sidebarClass()} style={sidebarStyle()}>
      {/* Logo */}
      <div class="px-5 py-4 border-b border-chrome-border flex-shrink-0 flex items-center gap-3">
        <a
          href="https://github.com/EkaEva/CamForge"
          target="_blank"
          rel="noopener noreferrer"
          class="block cursor-pointer"
        >
          <img
            src="/logo.png"
            alt="CamForge"
            width="40"
            height="40"
            decoding="async"
            class="h-10 w-auto transition-transform duration-200 hover:scale-110 hover:rotate-6 active:scale-95 active:rotate-0"
          />
        </a>
        <div>
          <h1 class="text-lg font-bold text-chrome-text-active tracking-wide font-display">
            CamForge <span class="text-[10px] font-normal text-chrome-text ml-0.5">v{version}</span>
          </h1>
          <p class="text-xs text-chrome-text">
            {t().app.tagline}
          </p>
        </div>
      </div>

      {/* Scrollable content */}
      <div class="flex-1 overflow-y-auto px-5 py-4 camforge-scrollbar" style={{ 'scrollbar-gutter': 'stable' }}>
        <div class="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden divide-y divide-outline-variant">
        {/* Motion params - primary module */}
        <MotionParamsPanel
          expanded={expanded().motion}
          onToggle={() => togglePanel('motion')}
          onValidate={validateAndRun}
        />

        {/* Geometry params - primary module */}
        <FollowerParamsPanel
          expanded={expanded().geometry}
          onToggle={() => togglePanel('geometry')}
          onValidate={validateAndRun}
        />

        {/* Simulation settings - secondary module */}
        <div class="overflow-hidden">
          <button type="button" onClick={() => togglePanel('simulation')} class="panel-header w-full flex items-center justify-between">
            <span class="text-sm font-medium text-on-surface-variant">{t().sidebar.group.simulation}</span>
            <Icon name="expand_more" size={18} classList={{ 'rotate-180 transition-transform duration-200': expanded().simulation, 'transition-transform duration-200': !expanded().simulation }} />
          </button>
          <div classList={{ 'accordion-content': true, 'collapsed': !expanded().simulation }}>
            <div class="accordion-inner">
              <div class="px-3 pt-2 pb-3">
                <div class="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  <NumberInput
                    label={t().sidebar.label.omega}
                    value={params().omega}
                    min={0.1} step={0.1}
                    unit={t().sidebar.unit.rad_s}
                    onChange={(v) => updateParam('omega', v)}
                    onValidate={validateAndRun}
                  />
                  <NumberInput
                    label={t().sidebar.label.alpha_threshold}
                    value={params().alpha_threshold}
                    min={10} max={45} step={1}
                    unit={t().sidebar.unit.deg}
                    onChange={(v) => updateParam('alpha_threshold', v)}
                    onValidate={validateAndRun}
                  />
                  <div class="col-span-2">
                    <NumberInput
                      label={t().sidebar.label.n_points}
                      value={params().n_points}
                      min={36} max={720} integer
                      onChange={(v) => updateParam('n_points', v)}
                      onValidate={validateAndRun}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Display options - secondary module */}
        <div class="overflow-hidden">
          <button type="button" onClick={() => togglePanel('display')} class="panel-header w-full flex items-center justify-between">
            <span class="text-sm font-medium text-on-surface-variant">{t().sidebar.group.display}</span>
            <Icon name="expand_more" size={18} classList={{ 'rotate-180 transition-transform duration-200': expanded().display, 'transition-transform duration-200': !expanded().display }} />
          </button>
          <div classList={{ 'accordion-content': true, 'collapsed': !expanded().display }}>
            <div class="accordion-inner">
              <div class="px-3 pt-2 pb-3">
                <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                  <Toggle
                    label={t().sidebar.cb.tangent}
                    checked={() => displayOptions().showTangent}
                    onChange={(v) => updateDisplayOption('showTangent', v)}
                  />
                  <Toggle
                    label={t().sidebar.cb.normal}
                    checked={() => displayOptions().showNormal}
                    onChange={(v) => updateDisplayOption('showNormal', v)}
                  />
                  <Toggle
                    label={t().sidebar.cb.baseCircle}
                    checked={() => displayOptions().showBaseCircle}
                    onChange={(v) => updateDisplayOption('showBaseCircle', v)}
                  />
                  <Toggle
                    label={t().sidebar.cb.nodes}
                    checked={() => displayOptions().showNodes}
                    onChange={(v) => updateDisplayOption('showNodes', v)}
                  />
                  <Toggle
                    label={t().sidebar.cb.offsetCircle}
                    checked={() => displayOptions().showOffsetCircle}
                    onChange={(v) => updateDisplayOption('showOffsetCircle', v)}
                  />
                  <Toggle
                    label={t().sidebar.cb.centerLine}
                    checked={() => displayOptions().showCenterLine}
                    onChange={(v) => updateDisplayOption('showCenterLine', v)}
                  />
                  <Toggle
                    label={t().sidebar.cb.upperLimit}
                    checked={() => displayOptions().showUpperLimit}
                    onChange={(v) => updateDisplayOption('showUpperLimit', v)}
                  />
                  <Toggle
                    label={t().sidebar.cb.lowerLimit}
                    checked={() => displayOptions().showLowerLimit}
                    onChange={(v) => updateDisplayOption('showLowerLimit', v)}
                  />
                  <Toggle
                    label={t().sidebar.cb.pressureArc}
                    checked={() => displayOptions().showPressureArc}
                    onChange={(v) => updateDisplayOption('showPressureArc', v)}
                  />
                  <Toggle
                    label={t().sidebar.cb.boundaries}
                    checked={() => displayOptions().showBoundaries}
                    onChange={(v) => updateDisplayOption('showBoundaries', v)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preset management - secondary module */}
        <div class="overflow-hidden">
          <button type="button" onClick={() => togglePanel('preset')} class="panel-header w-full flex items-center justify-between">
            <span class="text-sm font-medium text-on-surface-variant">{t().sidebar.group.preset}</span>
            <Icon name="expand_more" size={18} classList={{ 'rotate-180 transition-transform duration-200': expanded().preset, 'transition-transform duration-200': !expanded().preset }} />
          </button>
          <div classList={{ 'accordion-content': true, 'collapsed': !expanded().preset }}>
            <div class="accordion-inner">
              <div class="px-3 pt-2 pb-3">
                <div class="space-y-2">
                  <div class="flex gap-2">
                    <input
                      type="text"
                      placeholder={t().sidebar.preset.name}
                      value={presetName()}
                      onInput={(e) => setPresetName(e.currentTarget.value)}
                      class="flex-1 min-w-0 px-2 py-1.5 text-sm bg-surface-container border border-outline-variant rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-outline"
                    />
                    <button
                      type="button"
                      onClick={handleSavePreset}
                      disabled={!presetName().trim()}
                      class="px-2.5 py-1.5 text-sm border-2 rounded-md transition-all duration-200 active:scale-95 hover:shadow-md disabled:opacity-40 disabled:active:scale-100 disabled:hover:shadow-none whitespace-nowrap"
                      style={{
                        'border-color': 'var(--primary)',
                        'color': 'var(--primary)',
                        'background-color': 'transparent',
                      }}
                    >
                      {t().sidebar.btn.save}
                    </button>
                  </div>
                  <div class="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileInputChange}
                      class="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleLoadFromFile}
                      class="flex-1 px-3 py-1.5 text-sm bg-chrome-surface-hover hover:opacity-90 text-chrome-text rounded-md border border-chrome-border transition-colors flex items-center justify-center gap-2 font-display"
                    >
                      <Icon name="upload_file" size={16} />
                      {t().sidebar.btn.loadFromFile}
                    </button>
                  </div>
                  <Show when={loadError()}>
                    <div class="text-xs text-error">
                      {loadError()}
                    </div>
                  </Show>
                  <Show when={presets().length > 0}>
                    <div class="space-y-1">
                      {presets().map((name) => (
                        <div class="flex items-center justify-between py-1 px-2 bg-surface-container rounded-md">
                          <span class="text-sm text-on-surface font-display">{name}</span>
                          <div class="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadPreset(name)}
                              class="text-xs text-on-surface-variant hover:text-on-surface"
                            >
                              {t().sidebar.btn.load}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePreset(name)}
                              class="text-xs text-error hover:opacity-80"
                            >
                              {t().sidebar.btn.delete}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div class="bg-chrome-surface border-t border-chrome-border px-5 py-4 flex-shrink-0" style={{ 'padding-bottom': 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div class="flex gap-3">
          <button
            type="button"
            onClick={handleRandomize}
            class="flex-1 px-4 py-2 text-sm font-medium bg-chrome-surface-hover text-chrome-text rounded-lg border border-chrome-border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-none font-display"
          >
            {t().sidebar.btn.random}
          </button>
          <button
            type="button"
            onClick={handleReset}
            class="flex-1 px-4 py-2 text-sm font-medium bg-chrome-surface-hover text-chrome-text rounded-lg border border-chrome-border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-none font-display"
          >
            {t().sidebar.btn.reset}
          </button>
        </div>
      </div>
    </aside>
  );
}
