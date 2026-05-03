import { Show, createMemo } from 'solid-js';
import { NumberInput, Select } from '../controls';
import { params, updateParam, invalidParams, simulationData } from '../../stores/simulation';
import { t } from '../../i18n';
import { FollowerType } from '../../types';
import { Icon } from '../ui/Icon';

export interface FollowerParamsPanelProps {
  expanded: boolean;
  onToggle: () => void;
  onValidate: () => boolean;
}

export function FollowerParamsPanel(props: FollowerParamsPanelProps) {
  const followerTypeOptions = () => [
    { value: FollowerType.TranslatingKnifeEdge, label: t().sidebar.option.translatingKnifeEdge },
    { value: FollowerType.TranslatingRoller, label: t().sidebar.option.translatingRoller },
  ];

  const isOscillating = createMemo(() => {
    const ft = params().follower_type;
    return ft === FollowerType.OscillatingRoller || ft === FollowerType.OscillatingFlatFaced;
  });

  const isTranslating = createMemo(() => {
    const ft = params().follower_type;
    return ft === FollowerType.TranslatingKnifeEdge || ft === FollowerType.TranslatingRoller || ft === FollowerType.TranslatingFlatFaced;
  });

  const needsRoller = createMemo(() => {
    const ft = params().follower_type;
    return ft === FollowerType.TranslatingRoller || ft === FollowerType.OscillatingRoller;
  });

  const isFlatFaced = createMemo(() => {
    const ft = params().follower_type;
    return ft === FollowerType.TranslatingFlatFaced || ft === FollowerType.OscillatingFlatFaced;
  });

  const validateNum = (_v: number): boolean => props.onValidate();
  const validateSelect = (_v: number | string): boolean => props.onValidate();

  const handleFollowerTypeChange = (v: number | string) => {
    const ft = v as FollowerType;
    updateParam('follower_type', ft);
    // 切换从动件类型时调整关联参数
    if (ft === FollowerType.TranslatingKnifeEdge || ft === FollowerType.TranslatingFlatFaced || ft === FollowerType.OscillatingFlatFaced) {
      updateParam('r_r', 0);
    } else if (ft === FollowerType.TranslatingRoller && params().r_r === 0) {
      updateParam('r_r', 5);
    } else if ((ft === FollowerType.OscillatingRoller) && params().r_r === 0) {
      updateParam('r_r', 5);
    }
    // 摆动从动件无偏距概念，重置 e/pz
    if (ft === FollowerType.OscillatingRoller || ft === FollowerType.OscillatingFlatFaced) {
      updateParam('e', 0);
      updateParam('pz', 1);
    }
    props.onValidate();
  };

  return (
    <div class="relative overflow-hidden">
      <button type="button" onClick={() => props.onToggle()} class="panel-header w-full flex items-center justify-between">
        <span class="text-sm font-medium text-on-surface">{t().sidebar.group.geometry}</span>
        <Icon name="expand_more" size={18} classList={{ 'rotate-180 transition-transform duration-200': props.expanded, 'transition-transform duration-200': !props.expanded }} />
      </button>
      <div classList={{ 'accordion-content': true, 'collapsed': !props.expanded }}>
        <div class="accordion-inner">
          <div class="px-3 pt-2 pb-3">
            <div class="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <div class="col-span-2">
                <Select
                  label={t().sidebar.label.follower_type}
                  value={params().follower_type}
                  options={followerTypeOptions()}
                  onChange={handleFollowerTypeChange}
                  onValidate={validateSelect}
                />
              </div>
              <Show when={isOscillating()} fallback={
                <NumberInput
                  label={t().sidebar.label.h}
                  value={params().h}
                  min={0.1} step={0.5}
                  unit={t().sidebar.unit.mm}
                  error={invalidParams().has('h')}
                  onChange={(v) => updateParam('h', v)}
                  onValidate={validateSelect}
                />
              }>
                <NumberInput
                  label={t().sidebar.label.psi_max}
                  value={params().arm_length > 0 ? Math.round(params().h / params().arm_length * 180 / Math.PI * 10) / 10 : 0}
                  min={1} max={60} step={1}
                  unit={t().sidebar.unit.deg}
                  error={invalidParams().has('h')}
                  onChange={(v) => {
                    const arm = params().arm_length;
                    updateParam('h', Math.round(v * arm * Math.PI / 180 * 100) / 100);
                  }}
                  onValidate={validateSelect}
                />
              </Show>
              <Show when={needsRoller()}>
                <NumberInput
                  label={t().sidebar.label.r_r}
                  value={params().r_r}
                  min={0.1} step={0.5}
                  unit={t().sidebar.unit.mm}
                  onChange={(v) => updateParam('r_r', v)}
                  onValidate={validateSelect}
                />
              </Show>
              <Show when={isTranslating()}>
                <NumberInput
                  label={t().sidebar.label.e}
                  value={params().e}
                  min={-50} step={0.5}
                  unit={t().sidebar.unit.mm}
                  error={invalidParams().has('e')}
                  onChange={(v) => updateParam('e', v)}
                  onValidate={validateSelect}
                />
              </Show>
              <NumberInput
                label={t().sidebar.label.r_0}
                value={params().r_0}
                min={1} step={1}
                unit={t().sidebar.unit.mm}
                error={invalidParams().has('r_0')}
                onChange={(v) => updateParam('r_0', v)}
                onValidate={validateNum}
              />
              <Show when={isOscillating()}>
                <NumberInput
                  label={t().sidebar.label.arm_length}
                  value={params().arm_length}
                  min={1} step={1}
                  unit={t().sidebar.unit.mm}
                  error={invalidParams().has('arm_length')}
                  onChange={(v) => updateParam('arm_length', v)}
                  onValidate={validateSelect}
                />
                <NumberInput
                  label={t().sidebar.label.pivot_distance}
                  value={params().pivot_distance}
                  min={1} step={1}
                  unit={t().sidebar.unit.mm}
                  error={invalidParams().has('pivot_distance')}
                  onChange={(v) => updateParam('pivot_distance', v)}
                  onValidate={validateSelect}
                />
                <NumberInput
                  label={t().sidebar.label.psi_0}
                  value={params().initial_angle}
                  min={-180} max={180} step={1}
                  unit={t().sidebar.unit.deg}
                  onChange={(v) => updateParam('initial_angle', v)}
                  onValidate={validateSelect}
                />
                <NumberInput
                  label={t().sidebar.label.gamma}
                  value={params().gamma}
                  min={0} max={360} step={5}
                  unit={t().sidebar.unit.deg}
                  onChange={(v) => updateParam('gamma', v)}
                  onValidate={validateSelect}
                />
              </Show>
              <Show when={isFlatFaced()}>
                <NumberInput
                  label={t().sidebar.label.flat_face_offset}
                  value={params().flat_face_offset}
                  min={-20} max={20} step={0.5}
                  unit={t().sidebar.unit.mm}
                  onChange={(v) => updateParam('flat_face_offset', v)}
                  onValidate={validateSelect}
                />
              </Show>
              <Show when={isFlatFaced() && simulationData()}>
                {(() => {
                  const sd = simulationData()!;
                  return (
                    <div class="col-span-2 space-y-1">
                      <div class="text-xs text-on-surface-variant">
                        {t().sidebar.label.flat_face_min_width}: {(sd.flat_face_min_half_width * 2).toFixed(1)} mm
                      </div>
                      <Show when={sd.has_concave_region}>
                        <div class="text-xs text-error font-medium">
                          {t().status.concaveProfile}
                        </div>
                      </Show>
                    </div>
                  );
                })()}
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
