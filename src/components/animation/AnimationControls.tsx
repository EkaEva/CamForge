import { Show } from 'solid-js';
import { Icon } from '../ui/Icon';

interface FrameData {
  angleDeg: number;
  followerX: number;
  contactX: number;
  contactY: number;
  pivotX: number;
  pivotY: number;
  armAngle: number;
  tx: number;
  ty: number;
  nx: number;
  ny: number;
  alphaI: number;
  sI: number;
  xRot: number[];
  yRot: number[];
  xRotTheory: number[];
  yRotTheory: number[];
  isRising: boolean;
  isReturning: boolean;
}

interface ChartPadding {
  left: number;
  right: number;
}

interface AnimationControlsProps {
  playing: boolean;
  togglePlay: () => void;
  frame: number;
  setFrame: (f: number) => void;
  maxFrame: number;
  speed: number;
  setSpeed: (s: number) => void;
  frameData: FrameData | null;
  chartPadding: ChartPadding;
}

export function AnimationControls(props: AnimationControlsProps) {
  return (
    <div class="absolute bottom-0 inset-x-0 h-10 flex items-center gap-2" style={{ 'background-color': 'var(--chrome-bg)', 'border-top': '1px solid var(--chrome-border)' }}>
      {/* Left padding zone: play button inside chart left margin */}
      <div class="flex items-center justify-end pr-1 shrink-0" style={{ width: `${props.chartPadding.left}px` }}>
        <button
          type="button"
          onClick={props.togglePlay}
          class="w-7 h-7 flex items-center justify-center rounded-full text-chrome-text-active transition-all duration-200 touch-manipulation hover:bg-chrome-surface-hover hover:shadow-md hover:-translate-y-0.5 active:bg-chrome-active active:translate-y-0 active:shadow-none active:scale-90"
        >
          <Show when={props.playing} fallback={
            <Icon name="play_arrow" size={18} fill />
          }>
            <Icon name="pause" size={18} fill />
          </Show>
        </button>
      </div>

      {/* Slider - exactly spans chart plot area */}
      <input
        type="range"
        min={0}
        max={props.maxFrame}
        value={props.frame}
        onInput={(e) => {
          const newFrame = parseInt(e.currentTarget.value);
          props.setFrame(Math.min(newFrame, props.maxFrame));
        }}
        class="flex-1 min-w-0 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          'background-color': 'var(--chrome-border)',
          'accent-color': 'var(--chrome-text-active)',
        }}
      />

      {/* Right padding zone: partial spacer */}
      <div class="shrink-0" style={{ width: `${Math.round(props.chartPadding.right * 0.4)}px` }} />

      {/* Controls outside chart area */}
      <span class="text-xs text-chrome-text-active font-display tabular-nums whitespace-nowrap shrink-0">
        {(props.frameData?.angleDeg.toFixed(0) ?? '0').padStart(3, ' ')}°/360°
      </span>
      <select
        value={props.speed}
        onChange={(e) => props.setSpeed(parseInt(e.currentTarget.value))}
        class="text-xs font-display cursor-pointer h-6 px-1 rounded border-none shrink-0 mr-3"
        style={{
          'background-color': 'var(--chrome-surface-hover)',
          'color': 'var(--chrome-text-active)',
        }}
      >
        <option value="1">1x</option>
        <option value="2">2x</option>
        <option value="3">3x</option>
        <option value="5">5x</option>
        <option value="10">10x</option>
      </select>
    </div>
  );
}
