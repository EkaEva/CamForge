import { createSignal, Show, Switch, Match, createEffect, onCleanup, createMemo } from 'solid-js';
import { simulationData, isLoading, lastRunTime, validationErrors, params, exportStatus, setExportStatus, paramsUpdated, setParamsUpdated, curveVisible, setCurveVisible, cursorFrame } from '../../stores/simulation';
import { FollowerType } from '../../types';
import { t } from '../../i18n';
import { CamAnimation } from '../animation';
import { MotionCurves, PressureAngleChart, CurvatureChart } from '../charts';
import { Icon } from '../ui/Icon';
import { ExportPanel } from './ExportPanel';
type Tab = 'simulation' | 'export';
type AnalysisView = 'kinematics' | 'curvature' | 'pressure';

interface MainCanvasProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function MainCanvas(props: MainCanvasProps) {
  const [exporting, setExporting] = createSignal<string | null>(null);
  const [exportProgress, setExportProgress] = createSignal(0);
  const [analysisView, setAnalysisView] = createSignal<AnalysisView>('kinematics');
  const [zoomPercent, setZoomPercent] = createSignal(100);
  const animFrameData = createMemo(() => {
    const data = simulationData();
    const frameIdx = cursorFrame();
    if (!data || frameIdx < 0 || frameIdx >= data.s.length) return { sI: 0, alphaI: 0 };
    return { sI: data.s[frameIdx], alphaI: data.alpha_all[frameIdx] };
  });

  // 自动清除导出状态
  createEffect(() => {
    const status = exportStatus();
    if (status.type === 'success' || status.type === 'error') {
      const timer = setTimeout(() => {
        setExportStatus({ type: 'idle', message: '' });
      }, 5000);
      onCleanup(() => clearTimeout(timer));
    }
  });

  // 自动清除参数更新提示
  createEffect(() => {
    if (paramsUpdated()) {
      const timer = setTimeout(() => {
        setParamsUpdated(false);
      }, 2000);
      onCleanup(() => clearTimeout(timer));
    }
  });

  const tabs: { id: Tab; labelKey: string }[] = [
    { id: 'simulation', labelKey: 'simulation' },
    { id: 'export', labelKey: 'export' },
  ];

  const getTabLabel = (labelKey: string): string => {
    const currentT = t();
    switch (labelKey) {
      case 'simulation': return currentT.tabs.simulation;
      case 'export': return currentT.export.title;
      default: return labelKey;
    }
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // 检查压力角是否超限
  const isPressureAngleExceeded = () => {
    const data = simulationData();
    const p = params();
    if (!data) return false;
    return data.max_alpha > p.alpha_threshold;
  };

  const isFlatFacedInterference = createMemo(() => {
    const data = simulationData();
    const p = params();
    if (!data) return false;
    const isFlatFaced = p.follower_type === FollowerType.TranslatingFlatFaced
      || p.follower_type === FollowerType.OscillatingFlatFaced;
    if (!isFlatFaced) return false;
    const { s } = data;
    const n = s.length;
    const dDeltaSq = (2 * Math.PI / n) ** 2;
    for (let i = 0; i < n; i++) {
      const iPrev = i === 0 ? n - 1 : i - 1;
      const iNext = i === n - 1 ? 0 : i + 1;
      const d2s = (s[iNext] - 2 * s[i] + s[iPrev]) / dDeltaSq;
      if (p.r_0 + s[i] + d2s < 0) return true;
    }
    return false;
  });

  // 状态文字
  const getStatus = () => {
    const currentT = t();
    if (isLoading()) return currentT.status.running;
    if (validationErrors().length > 0) return validationErrors()[0];
    return currentT.status.ready;
  };

  // 状态颜色：红色=参数错误，绿色=正常/计算中，黄色=压力角超限/干涉
  const getStatusColor = () => {
    if (validationErrors().length > 0) return 'text-error';
    if (isPressureAngleExceeded() || isFlatFacedInterference()) return 'text-warning';
    return 'text-success';
  };

  // 图例线段 SVG — 与 canvas 图表颜色和线型一致
  const LegendLine = (lp: { color: string; dash?: string }) => (
    <svg width="16" height="4" viewBox="0 0 16 4" class="inline-block flex-shrink-0">
      <line x1="0" y1="2" x2="16" y2="2" stroke={lp.color} stroke-width="2" stroke-dasharray={lp.dash ?? 'none'} />
    </svg>
  );

  // 图例渲染 — 颜色与 canvas 图表一致
  const renderKinematicsLegend = () => {
    const vis = curveVisible();
    return (
      <div class="flex items-center gap-4 font-display text-[11px] text-on-surface-variant">
        <button
          type="button"
          onClick={() => setCurveVisible(p => ({ ...p, s: !p.s }))}
          classList={{
            'flex items-center gap-1.5 cursor-pointer transition-opacity': true,
            'opacity-40 line-through': !vis.s,
            'opacity-100': vis.s,
          }}
        >
          <LegendLine color="#E07A5F" />
          {t().chart.displacement}
        </button>
        <button
          type="button"
          onClick={() => setCurveVisible(p => ({ ...p, v: !p.v }))}
          classList={{
            'flex items-center gap-1.5 cursor-pointer transition-opacity': true,
            'opacity-40 line-through': !vis.v,
            'opacity-100': vis.v,
          }}
        >
          <LegendLine color="#3D5A80" dash="6,4" />
          {t().chart.velocity}
        </button>
        <button
          type="button"
          onClick={() => setCurveVisible(p => ({ ...p, a: !p.a }))}
          classList={{
            'flex items-center gap-1.5 cursor-pointer transition-opacity': true,
            'opacity-40 line-through': !vis.a,
            'opacity-100': vis.a,
          }}
        >
          <LegendLine color="#5B8C5A" dash="2,3" />
          {t().chart.acceleration}
        </button>
      </div>
    );
  };

  const renderCurvatureLegend = () => {
    const p = params();
    const hasRoller = p.r_r > 0;
    return (
      <div class="flex items-center gap-4 font-display text-[11px] text-on-surface-variant">
        <span class="flex items-center gap-1.5">
          <LegendLine color="#E07A5F" />
          {t().chart.theoryRho}
        </span>
        <Show when={hasRoller}>
          <span class="flex items-center gap-1.5">
            <LegendLine color="#3D5A80" dash="4,2" />
            {t().chart.actualRho}
          </span>
          <span class="flex items-center gap-1.5">
            <LegendLine color="#6D9DC5" dash="4,4" />
            {t().chart.threshold}
          </span>
        </Show>
      </div>
    );
  };

  const renderPressureLegend = () => (
    <div class="flex items-center gap-4 font-display text-[11px] text-on-surface-variant">
      <span class="flex items-center gap-1.5">
        <LegendLine color="#E07A5F" />
        {t().chart.pressureAngle}
      </span>
      <span class="flex items-center gap-1.5">
        <LegendLine color="#C4A35A" dash="4,4" />
        {t().chart.threshold}
      </span>
    </div>
  );

  return (
    <main class="flex-1 flex flex-col bg-surface-container-low overflow-hidden">
      {/* Tab Bar */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2 border-b border-outline-variant bg-surface-container-lowest">
        {/* Tab 栏 */}
        <div role="tablist" class="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
          {tabs.map((tab) => (
            <button
              type="button"
              role="tab"
              aria-selected={props.activeTab === tab.id}
              onClick={() => props.onTabChange(tab.id)}
              classList={{
                'tab-btn px-4 py-1.5 text-sm rounded-md transition-all duration-200 min-h-[36px] min-w-[44px] whitespace-nowrap flex-shrink-0 font-medium': true,
                'tab-btn-active': props.activeTab === tab.id,
                'tab-btn-inactive': props.activeTab !== tab.id,
              }}
            >
              {getTabLabel(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* 状态信息 - 桌面端 */}
        <div class="hidden sm:flex items-center gap-3 text-xs font-display min-w-0 flex-1 justify-end">
          <Show when={isLoading()}>
            <div classList={{ 'w-3 h-3 border-2 border-t-transparent rounded-full animate-spin': true, [getStatusColor()]: true }} style={{ 'border-color': 'currentColor', 'border-top-color': 'transparent' }} />
          </Show>
          <span class={`${getStatusColor()}`}>{getStatus()}</span>
          <Show when={validationErrors().length > 0}>
            <span class="flex items-center gap-1.5 text-error truncate max-w-[200px]" title={validationErrors()[0]}>
              <Icon name="warning" size={14} class="text-error flex-shrink-0" />
              <span class="truncate">{validationErrors()[0]}</span>
            </span>
          </Show>
          <Show when={isPressureAngleExceeded()}>
            <span class="flex items-center gap-1.5 text-warning flex-shrink-0">
              <Icon name="warning" size={14} class="text-warning" />
              {t().status.pressureAngleExceeded}
            </span>
          </Show>
          <Show when={isFlatFacedInterference()}>
            <span class="flex items-center gap-1.5 text-warning flex-shrink-0">
              <Icon name="warning" size={14} class="text-warning" />
              {t().status.flatFacedInterference}
            </span>
          </Show>
          <Show when={exportStatus().type !== 'idle'}>
            <span
              class="truncate max-w-[500px]"
              title={exportStatus().message}
              classList={{
                'text-success': exportStatus().type === 'success',
                'text-error': exportStatus().type === 'error',
                'text-on-surface-variant': exportStatus().type === 'exporting',
              }}
            >
              {exportStatus().message}
            </span>
          </Show>
          <Show when={lastRunTime() && validationErrors().length === 0}>
            <span class="flex-shrink-0">{formatTime(lastRunTime())}</span>
          </Show>
        </div>
      </div>

      {/* 移动端状态提示 */}
      <div class="sm:hidden px-4 py-1.5 bg-surface-container-low border-b border-outline-variant text-xs" style={{ 'padding-bottom': 'calc(0.375rem + env(safe-area-inset-bottom))' }}>
        <div class="flex items-start gap-2 overflow-x-auto scrollbar-hide">
          <Show when={isLoading()}>
            <div classList={{ 'w-3 h-3 border-2 border-t-transparent rounded-full animate-spin': true, [getStatusColor()]: true }} style={{ 'border-color': 'currentColor', 'border-top-color': 'transparent' }} />
          </Show>
          <span class={`${getStatusColor()} whitespace-nowrap truncate max-w-[150px]`}>{getStatus()}</span>
          <Show when={validationErrors().length > 0}>
            <span class="flex items-center gap-1 text-error whitespace-nowrap">
              <Icon name="warning" size={12} class="text-error" />
              <span class="truncate max-w-[150px]">{validationErrors()[0]}</span>
            </span>
          </Show>
          <Show when={isPressureAngleExceeded()}>
            <span class="flex items-center gap-1 text-warning whitespace-nowrap">
              <Icon name="warning" size={12} class="text-warning" />
              {t().status.pressureAngleExceeded}
            </span>
          </Show>
          <Show when={isFlatFacedInterference()}>
            <span class="flex items-center gap-1 text-warning whitespace-nowrap">
              <Icon name="warning" size={12} class="text-warning" />
              {t().status.flatFacedInterference}
            </span>
          </Show>
          <Show when={exportStatus().type !== 'idle'}>
            <span
              class="truncate max-w-[60%]"
              classList={{
                'text-success': exportStatus().type === 'success',
                'text-error': exportStatus().type === 'error',
                'text-on-surface-variant': exportStatus().type === 'exporting',
              }}
            >
              {exportStatus().message}
            </span>
          </Show>
          <Show when={lastRunTime() && validationErrors().length === 0}>
            <span class="text-on-surface-variant whitespace-nowrap">{formatTime(lastRunTime())}</span>
          </Show>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-hidden">
        {/* 仿真页面 - 双卡片布局 */}
        <Show when={props.activeTab === 'simulation'}>
          <Show
            when={simulationData()}
            fallback={
              <div class="w-full h-full flex items-center justify-center bg-surface-container-low">
                <Show when={isLoading()} fallback={
                  <div class="text-center">
                    <svg class="w-24 h-24 mx-auto text-outline-variant" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="1"/>
                      <path d="M50 10 A40 40 0 0 1 90 50" fill="none" stroke="currentColor" stroke-width="2" class="text-on-surface-variant"/>
                    </svg>
                    <p class="mt-4 text-sm text-on-surface-variant">
                      {t().mainCanvas.clickToStart}
                    </p>
                  </div>
                }>
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
                    <p class="text-sm text-on-surface-variant">{t().status.running}</p>
                  </div>
                </Show>
              </div>
            }
          >
            <div class="w-full h-full overflow-auto bg-surface-container-low p-2 camforge-scrollbar">
              {/* 上方卡片：机构模型 */}
              <section class="flex flex-col border border-outline-variant bg-surface-container-low rounded overflow-hidden h-[320px] sm:h-[480px] relative">
                <div class="h-10 border-b border-outline-variant flex items-center justify-between px-4 bg-surface flex-shrink-0 overflow-hidden">
                  <span class="font-display text-xs uppercase tracking-wider text-on-surface-variant truncate min-w-0">
                    {t().tabs.mechanismModel}
                  </span>
                  <div class="flex items-center gap-1 sm:gap-2 font-display text-xs text-on-surface-variant min-w-0 flex-shrink-0 pl-1 sm:pl-0">
                    <Show when={simulationData()}>
                      <span class="whitespace-nowrap">{t().info.displacement}: <span class="tabular-nums inline-block w-[3rem] sm:w-[3.5rem] text-right">{animFrameData().sI.toFixed(3)}</span>mm</span>
                      <span class="whitespace-nowrap">{t().info.pressureAngle}: <span class="tabular-nums inline-block w-[2.5rem] sm:w-[2.5rem] text-right">{animFrameData().alphaI.toFixed(2)}</span>°</span>
                    </Show>
                    <span class="whitespace-nowrap">{t().info.zoom}: <span class="tabular-nums inline-block w-[1.5rem] text-right">{zoomPercent()}</span>%</span>
                  </div>
                </div>
                <div class="flex-1 relative overflow-hidden">
                  <CamAnimation
                    isActive={true}
                    onZoomChange={(z: number) => setZoomPercent(Math.round(z * 100))}
                  />
                </div>
              </section>

              {/* 下方卡片：分析 */}
              <section class="flex flex-col border border-outline-variant bg-surface-container-low rounded overflow-hidden min-h-[280px] sm:min-h-[480px] mt-2 relative">
                <div class="h-10 border-b border-outline-variant flex items-center justify-between px-4 bg-surface flex-shrink-0">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const views: AnalysisView[] = ['kinematics', 'curvature', 'pressure'];
                        const idx = views.indexOf(analysisView());
                        setAnalysisView(views[(idx + 1) % views.length]);
                      }}
                      class="analysis-cycle-btn flex items-center gap-1.5"
                    >
                      <span class="cycle-label">
                        {analysisView() === 'kinematics' ? t().chart.kinematicsLabel :
                         analysisView() === 'curvature' ? t().tabs.curvatureRadius :
                         t().tabs.pressureAngle}
                      </span>
                    </button>
                  </div>
                  {/* 横向图例 */}
                  <Switch>
                    <Match when={analysisView() === 'kinematics'}>{renderKinematicsLegend()}</Match>
                    <Match when={analysisView() === 'curvature'}>{renderCurvatureLegend()}</Match>
                    <Match when={analysisView() === 'pressure'}>{renderPressureLegend()}</Match>
                  </Switch>
                </div>
                <div class="flex-1 relative overflow-hidden">
                  <Switch>
                    <Match when={analysisView() === 'kinematics'}>
                      <div role="tabpanel" class="w-full h-full"><MotionCurves /></div>
                    </Match>
                    <Match when={analysisView() === 'curvature'}>
                      <div role="tabpanel" class="w-full h-full"><CurvatureChart /></div>
                    </Match>
                    <Match when={analysisView() === 'pressure'}>
                      <div role="tabpanel" class="w-full h-full"><PressureAngleChart /></div>
                    </Match>
                  </Switch>
                </div>
              </section>
            </div>
          </Show>
        </Show>

        {/* 导出页面 */}
        <Show when={props.activeTab === 'export'}>
          <ExportPanel
            exporting={exporting}
            setExporting={setExporting}
            exportProgress={exportProgress}
            setExportProgress={setExportProgress}
          />
        </Show>
      </div>
    </main>
  );
}