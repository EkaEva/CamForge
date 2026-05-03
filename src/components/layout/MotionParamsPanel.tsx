import { NumberInput, Select } from '../controls';
import { params, updateParam, invalidParams } from '../../stores/simulation';
import { t } from '../../i18n';
import { motionLawOptions } from '../../constants';
import { Icon } from '../ui/Icon';
import type { MotionLaw } from '../../types';

export interface MotionParamsPanelProps {
  expanded: boolean;
  onToggle: () => void;
  onValidate: () => boolean;
}

export function MotionParamsPanel(props: MotionParamsPanelProps) {
  const rotationOptions = () => [
    { value: 1, label: t().sidebar.option.cw, labelZh: t().sidebar.option.cw },
    { value: -1, label: t().sidebar.option.ccw, labelZh: t().sidebar.option.ccw },
  ];

  const validateNum = (_v: number): boolean => props.onValidate();
  const validateSelect = (_v: number | string): boolean => props.onValidate();

  return (
    <div class="relative overflow-hidden">
      <button type="button" onClick={() => props.onToggle()} class="panel-header w-full flex items-center justify-between">
        <span class="text-sm font-medium text-on-surface">{t().sidebar.group.motion}</span>
        <Icon name="expand_more" size={18} classList={{ 'rotate-180 transition-transform duration-200': props.expanded, 'transition-transform duration-200': !props.expanded }} />
      </button>
      <div classList={{ 'accordion-content': true, 'collapsed': !props.expanded }}>
        <div class="accordion-inner">
          <div class="px-3 pt-2 pb-3">
            <div class="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <NumberInput
                label={t().sidebar.label.delta_0}
                value={params().delta_0}
                min={1} max={359} integer
                unit={t().sidebar.unit.deg}
                error={invalidParams().has('delta_0')}
                onChange={(v) => updateParam('delta_0', v)}
                onValidate={validateNum}
              />
              <NumberInput
                label={t().sidebar.label.delta_01}
                value={params().delta_01}
                min={0} max={359} integer
                unit={t().sidebar.unit.deg}
                error={invalidParams().has('delta_01')}
                onChange={(v) => updateParam('delta_01', v)}
                onValidate={validateNum}
              />
              <NumberInput
                label={t().sidebar.label.delta_ret}
                value={params().delta_ret}
                min={1} max={359} integer
                unit={t().sidebar.unit.deg}
                error={invalidParams().has('delta_ret')}
                onChange={(v) => updateParam('delta_ret', v)}
                onValidate={validateNum}
              />
              <NumberInput
                label={t().sidebar.label.delta_02}
                value={params().delta_02}
                min={0} max={359} integer
                unit={t().sidebar.unit.deg}
                error={invalidParams().has('delta_02')}
                onChange={(v) => updateParam('delta_02', v)}
                onValidate={validateNum}
              />
              <Select
                label={t().sidebar.label.tc_law}
                value={params().tc_law}
                options={motionLawOptions}
                onChange={(v) => updateParam('tc_law', v as MotionLaw)}
                onValidate={validateSelect}
              />
              <Select
                label={t().sidebar.label.hc_law}
                value={params().hc_law}
                options={motionLawOptions}
                onChange={(v) => updateParam('hc_law', v as MotionLaw)}
                onValidate={validateSelect}
              />
              <div class="col-span-2">
                <Select
                  label={t().sidebar.label.sn}
                  value={params().sn}
                  options={rotationOptions()}
                  onChange={(v) => updateParam('sn', v as number)}
                  onValidate={validateSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
